import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    
    // Überprüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder kein Zugriff' },
        { status: 404 }
      )
    }

    // Deaktiviere das Restaurant und Online-Bestellungen
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'INACTIVE',
        settings: {
          update: {
            orderingEnabled: false
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Restaurant wurde offline genommen',
      data: updatedRestaurant
    })
    
  } catch (error) {
    console.error('Go offline error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Deaktivieren des Restaurants' },
      { status: 500 }
    )
  }
}