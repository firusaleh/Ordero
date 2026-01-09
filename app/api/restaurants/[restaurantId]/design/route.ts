import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.restaurantId,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      },
      select: {
        logo: true,
        banner: true,
        primaryColor: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder kein Zugriff' },
        { status: 404 }
      )
    }

    return NextResponse.json(restaurant)
    
  } catch (error) {
    console.error('Get design error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Design-Einstellungen' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth()
    const resolvedParams = await params
    
    if (!session) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { logo, banner, primaryColor } = body

    // Überprüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.restaurantId,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id, role: { in: ['ADMIN', 'MANAGER'] } } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden oder keine Berechtigung' },
        { status: 404 }
      )
    }

    // Aktualisiere Design-Einstellungen
    const updatedRestaurant = await prisma.restaurant.update({
      where: { id: resolvedParams.restaurantId },
      data: {
        logo,
        banner,
        primaryColor
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Design-Einstellungen erfolgreich gespeichert',
      data: updatedRestaurant
    })
    
  } catch (error) {
    console.error('Save design error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Design-Einstellungen' },
      { status: 500 }
    )
  }
}