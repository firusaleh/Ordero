import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getPOSAdapter } from '@/lib/pos-integrations'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { posSystem, posApiKey, posRestaurantId } = await req.json()

    if (!posSystem || !posApiKey) {
      return NextResponse.json({ error: 'Fehlende Zugangsdaten' }, { status: 400 })
    }

    // Demo-Modus für Tests
    if (posApiKey.startsWith('demo_')) {
      return NextResponse.json({ 
        success: true,
        message: 'Demo-Verbindung erfolgreich',
        restaurantName: 'Demo Restaurant',
        isDemo: true
      })
    }

    // Verwende den POS Adapter für echte API-Tests
    const adapter = getPOSAdapter(posSystem, posApiKey, posRestaurantId || undefined)
    
    if (!adapter) {
      return NextResponse.json({ 
        error: `POS-System '${posSystem}' wird noch nicht unterstützt` 
      }, { status: 400 })
    }

    try {
      const isConnected = await adapter.testConnection()
      
      if (isConnected) {
        // Speichere erfolgreiche Verbindung
        const restaurant = await prisma.restaurant.findFirst({
          where: {
            OR: [
              { ownerId: session.user.id },
              { staff: { some: { userId: session.user.id } } }
            ]
          }
        })

        if (restaurant) {
          await prisma.restaurantSettings.upsert({
            where: { restaurantId: restaurant.id },
            update: {
              posConnectionStatus: 'connected',
              posLastConnectionTest: new Date()
            },
            create: {
              restaurantId: restaurant.id,
              posConnectionStatus: 'connected',
              posLastConnectionTest: new Date()
            }
          })
        }

        return NextResponse.json({ 
          success: true,
          message: `${posSystem} Verbindung erfolgreich hergestellt`,
          restaurantName: posRestaurantId || 'Restaurant verifiziert'
        })
      } else {
        return NextResponse.json({ 
          error: 'Verbindung fehlgeschlagen. Bitte prüfen Sie Ihre Zugangsdaten.' 
        }, { status: 401 })
      }
    } catch (apiError: any) {
      console.error(`${posSystem} API-Fehler:`, apiError)
      
      // Spezifische Fehlermeldungen je nach POS-System
      let errorMessage = 'Verbindung fehlgeschlagen'
      
      if (apiError.message?.includes('401') || apiError.message?.includes('unauthorized')) {
        errorMessage = 'Ungültige API-Zugangsdaten'
      } else if (apiError.message?.includes('404')) {
        errorMessage = posRestaurantId 
          ? 'Restaurant-ID nicht gefunden' 
          : 'API-Endpunkt nicht gefunden'
      } else if (apiError.message?.includes('network')) {
        errorMessage = 'Netzwerkfehler - Bitte versuchen Sie es später erneut'
      }
      
      return NextResponse.json({ 
        error: errorMessage 
      }, { status: 401 })
    }
  } catch (error) {
    console.error('Verbindungstest Fehler:', error)
    return NextResponse.json(
      { error: 'Interner Fehler beim Verbindungstest' },
      { status: 500 }
    )
  }
}