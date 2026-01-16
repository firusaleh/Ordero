import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { authRateLimiter, checkRateLimit, getIpAddress } from '@/lib/rate-limit'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  restaurantName: z.string().min(2),
  phone: z.string().optional(),
  country: z.string().default('DE'),
})

export async function POST(request: NextRequest) {
  try {
    // Rate Limiting
    const ip = getIpAddress(request)
    const rateLimitResult = await checkRateLimit(authRateLimiter, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
          }
        }
      )
    }
    
    const body = await request.json()
    
    // Validiere Input
    const validatedData = registerSchema.parse(body)
    
    // Prüfe ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Diese E-Mail-Adresse ist bereits registriert' },
        { status: 400 }
      )
    }
    
    // Hash das Passwort
    const hashedPassword = await bcrypt.hash(validatedData.password, 12)
    
    // Erstelle Slug für Restaurant
    const slug = validatedData.restaurantName
      .toLowerCase()
      .replace(/[äöüß]/g, (char) => {
        const replacements: { [key: string]: string } = {
          'ä': 'ae',
          'ö': 'oe',
          'ü': 'ue',
          'ß': 'ss'
        }
        return replacements[char] || char
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    // Stelle sicher, dass der Slug eindeutig ist
    let finalSlug = slug
    let counter = 1
    while (await prisma.restaurant.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${slug}-${counter}`
      counter++
    }
    
    // Erstelle User und Restaurant in einer Transaktion
    const result = await prisma.$transaction(async (tx) => {
      // Erstelle User
      const user = await tx.user.create({
        data: {
          email: validatedData.email,
          password: hashedPassword,
          name: validatedData.name,
          phone: validatedData.phone,
          role: 'RESTAURANT_OWNER',
        }
      })
      
      // Berechne Trial-Ende (14 Tage)
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 14)
      
      // Erstelle Restaurant
      const restaurant = await tx.restaurant.create({
        data: {
          name: validatedData.restaurantName,
          slug: finalSlug,
          ownerId: user.id,
          status: 'ACTIVE',
          plan: 'TRIAL',
          trialEndsAt,
          email: validatedData.email,
          phone: validatedData.phone,
          country: validatedData.country || 'DE',
        }
      })
      
      // Erstelle Restaurant-Einstellungen
      await tx.restaurantSettings.create({
        data: {
          restaurantId: restaurant.id,
        }
      })
      
      return { user, restaurant }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich',
      data: {
        email: result.user.email,
        restaurantSlug: result.restaurant.slug,
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabedaten', details: (error as any).errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' },
      { status: 500 }
    )
  }
}