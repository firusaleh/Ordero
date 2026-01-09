import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const restaurantUpdateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  cuisine: z.string(),
  street: z.string(),
  city: z.string(),
  postalCode: z.string(),
  phone: z.string(),
  email: z.string().email(),
  website: z.string().url().optional().or(z.literal('')),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = restaurantUpdateSchema.parse(body)
    
    // Finde oder erstelle das Restaurant des Users
    let restaurant = await prisma.restaurant.findFirst({
      where: {
        ownerId: session.user.id
      }
    })
    
    if (!restaurant) {
      // Erstelle neues Restaurant
      const slug = validatedData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      
      restaurant = await prisma.restaurant.create({
        data: {
          name: validatedData.name,
          slug: `${slug}-${Date.now()}`, // Eindeutiger Slug
          description: validatedData.description || null,
          cuisine: validatedData.cuisine,
          street: validatedData.street,
          city: validatedData.city,
          postalCode: validatedData.postalCode,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website || null,
          ownerId: session.user.id,
          status: 'ACTIVE',
          plan: 'TRIAL',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage Trial
          primaryColor: '#3b82f6'
        }
      })
    } else {
      // Update existierendes Restaurant
      restaurant = await prisma.restaurant.update({
        where: { id: restaurant.id },
        data: {
          name: validatedData.name,
          description: validatedData.description || null,
          cuisine: validatedData.cuisine,
          street: validatedData.street,
          city: validatedData.city,
          postalCode: validatedData.postalCode,
          phone: validatedData.phone,
          email: validatedData.email,
          website: validatedData.website || null,
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: restaurant
    })
    
  } catch (error) {
    console.error('Restaurant update error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Daten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}