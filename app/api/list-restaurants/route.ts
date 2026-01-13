import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }
    
    // Finde alle Restaurants für diesen User
    const restaurants = await prisma.restaurant.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { 
            staff: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      },
      include: {
        settings: {
          select: {
            currency: true,
            timezone: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        city: true,
        settings: true,
        ownerId: true
      }
    })
    
    return NextResponse.json({
      success: true,
      userId: session.user.id,
      userEmail: session.user.email,
      restaurantsFound: restaurants.length,
      restaurants: restaurants.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        country: r.country,
        city: r.city,
        currency: r.settings?.currency || 'NOT SET',
        isOwner: r.ownerId === session.user.id
      }))
    })
    
  } catch (error: any) {
    console.error('List restaurants error:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error.message },
      { status: 500 }
    )
  }
}