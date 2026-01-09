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

    // Überprüfe ob der Benutzer Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: resolvedParams.restaurantId,
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

    return NextResponse.json({
      openingHours: restaurant.settings?.openingHours || null
    })
    
  } catch (error) {
    console.error('Get opening hours error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Öffnungszeiten' },
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
    const { hours } = body

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

    // Aktualisiere die Öffnungszeiten
    await prisma.restaurantSettings.upsert({
      where: { restaurantId: resolvedParams.restaurantId },
      update: {
        openingHours: hours
      },
      create: {
        restaurantId: resolvedParams.restaurantId,
        openingHours: hours
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Öffnungszeiten erfolgreich gespeichert'
    })
    
  } catch (error) {
    console.error('Save opening hours error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Öffnungszeiten' },
      { status: 500 }
    )
  }
}