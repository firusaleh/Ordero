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

    // Debug-Informationen
    const debugInfo = {
      hasSettings: !!restaurant.settings,
      openingHoursRaw: restaurant.settings?.openingHours,
      openingHoursType: typeof restaurant.settings?.openingHours,
      openingHoursParsed: null as any,
      parseError: null as string | null,
      validationResult: false
    }

    // Versuche zu parsen
    if (restaurant.settings?.openingHours) {
      try {
        const parsed = typeof restaurant.settings.openingHours === 'string' 
          ? JSON.parse(restaurant.settings.openingHours) 
          : restaurant.settings.openingHours
        
        debugInfo.openingHoursParsed = parsed
        
        // Führe die gleiche Validierung aus wie in restaurant-setup.tsx
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          debugInfo.validationResult = Object.values(parsed).some((day: any) => 
            day?.isOpen === true && 
            day?.timeSlots && 
            Array.isArray(day.timeSlots) && 
            day.timeSlots.length > 0 &&
            day.timeSlots.some((slot: any) => slot?.open && slot?.close)
          )
        }
      } catch (e) {
        debugInfo.parseError = e instanceof Error ? e.message : 'Unknown error'
      }
    }

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Debug-Fehler', details: error },
      { status: 500 }
    )
  }
}