import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Mock-Implementierung für Demo-Zwecke
// In Produktion würde hier die echte API-Verbindung getestet
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

    // Simuliere API-Verbindungstest basierend auf POS-System
    switch (posSystem) {
      case 'ready2order':
        // Simuliere ready2order API Test
        if (posApiKey.startsWith('r2o_')) {
          return NextResponse.json({ 
            success: true, 
            message: 'ready2order Verbindung erfolgreich',
            restaurantName: 'Demo Restaurant'
          })
        }
        break
      
      case 'orderbird':
        // Simuliere orderbird API Test
        if (posApiKey.startsWith('ob_')) {
          return NextResponse.json({ 
            success: true,
            message: 'orderbird Verbindung erfolgreich',
            restaurantName: 'Demo Restaurant'
          })
        }
        break
      
      case 'gastrofix':
        // Simuliere Gastrofix API Test
        if (posApiKey.startsWith('gf_')) {
          return NextResponse.json({ 
            success: true,
            message: 'Gastrofix Verbindung erfolgreich',
            restaurantName: 'Demo Restaurant'
          })
        }
        break
    }

    // Demo-Modus: Akzeptiere jeden Key der mit "demo" beginnt
    if (posApiKey.startsWith('demo')) {
      return NextResponse.json({ 
        success: true,
        message: 'Demo-Verbindung erfolgreich',
        restaurantName: 'Demo Restaurant',
        isDemo: true
      })
    }

    // Verbindung fehlgeschlagen
    return NextResponse.json(
      { error: 'Ungültige Zugangsdaten' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Verbindungstest Fehler:', error)
    return NextResponse.json(
      { error: 'Verbindungstest fehlgeschlagen' },
      { status: 500 }
    )
  }
}