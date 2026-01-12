import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    
    // Überprüfe ob das Restaurant existiert
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: resolvedParams.id },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Aktiviere das Restaurant und Online-Bestellungen
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: resolvedParams.id },
      data: {
        status: 'ACTIVE',
        settings: {
          update: {
            orderingEnabled: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Restaurant wurde erfolgreich aktiviert',
      data: updatedRestaurant
    })
    
  } catch (error) {
    console.error('Activate restaurant error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktivieren des Restaurants' },
      { status: 500 }
    )
  }
}