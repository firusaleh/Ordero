import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Hole Restaurant des Benutzers
    const restaurant = await prisma.restaurant.findFirst({
      where: {
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
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }

    // Rückgabe der Öffnungszeiten oder Default-Werte
    const openingHours = restaurant.settings?.openingHours || getDefaultOpeningHours()

    return NextResponse.json(openingHours)
  } catch (error) {
    console.error('Error fetching opening hours:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Öffnungszeiten' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const openingHours = await req.json()

    // Hole Restaurant des Benutzers
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob der Benutzer berechtigt ist (Owner oder Manager)
    if (restaurant.ownerId !== session.user.id) {
      const staffRole = await prisma.restaurantStaff.findFirst({
        where: {
          restaurantId: restaurant.id,
          userId: session.user.id,
          role: 'MANAGER'
        }
      })

      if (!staffRole) {
        return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
      }
    }

    // Update oder erstelle Restaurant-Settings
    const updatedSettings = await prisma.restaurantSettings.upsert({
      where: { restaurantId: restaurant.id },
      update: {
        openingHours: openingHours as any // JSON-Feld
      },
      create: {
        restaurantId: restaurant.id,
        openingHours: openingHours as any
      }
    })

    return NextResponse.json({ 
      success: true, 
      openingHours: updatedSettings.openingHours 
    })
  } catch (error) {
    console.error('Error saving opening hours:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Öffnungszeiten' },
      { status: 500 }
    )
  }
}

function getDefaultOpeningHours() {
  return {
    monday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
    tuesday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
    wednesday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
    thursday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
    friday: { isOpen: true, timeSlots: [{ open: '11:00', close: '23:00' }] },
    saturday: { isOpen: true, timeSlots: [{ open: '11:00', close: '23:00' }] },
    sunday: { isOpen: false, timeSlots: [] }
  }
}