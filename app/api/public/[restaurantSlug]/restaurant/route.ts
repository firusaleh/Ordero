import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const { restaurantSlug } = await params

    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        slug: restaurantSlug,
        status: 'ACTIVE'
      },
      include: {
        settings: true,
        _count: {
          select: {
            tables: true,
            menuItems: true,
            categories: true
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ restaurant })
  } catch (error) {
    console.error('Fehler beim Laden des Restaurants:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}