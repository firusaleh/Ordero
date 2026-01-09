import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Finde Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Kein Restaurant zugeordnet' }, { status: 403 })
    }

    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id },
      select: {
        posSystem: true,
        posApiKey: true,
        posRestaurantId: true,
      }
    })

    // Verstecke teilweise den API-Key für Sicherheit
    const maskedSettings = settings ? {
      ...settings,
      posApiKey: settings.posApiKey ? `${settings.posApiKey.substring(0, 4)}...${settings.posApiKey.slice(-4)}` : null,
      syncEnabled: !!settings.posApiKey,
      lastSync: null // TODO: Aus separater Sync-Tabelle holen
    } : {
      posSystem: null,
      posApiKey: null,
      posRestaurantId: null,
      syncEnabled: false,
      lastSync: null
    }

    return NextResponse.json(maskedSettings)
  } catch (error) {
    console.error('Fehler beim Laden der POS-Einstellungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' },
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

    // Finde Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Kein Restaurant zugeordnet' }, { status: 403 })
    }

    const data = await req.json()
    
    // Nur aktualisieren wenn sich der API-Key geändert hat (nicht maskiert)
    const updateData: any = {
      posSystem: data.posSystem,
      posRestaurantId: data.posRestaurantId,
    }

    // Nur neuen API-Key speichern, wenn er nicht maskiert ist
    if (data.posApiKey && !data.posApiKey.includes('...')) {
      updateData.posApiKey = data.posApiKey
    }

    await prisma.restaurantSettings.upsert({
      where: { restaurantId: restaurant.id },
      update: updateData,
      create: {
        restaurantId: restaurant.id,
        ...updateData
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Fehler beim Speichern der POS-Einstellungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' },
      { status: 500 }
    )
  }
}