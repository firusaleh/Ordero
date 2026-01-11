import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { restaurantId } = await context.params
    const body = await request.json()
    const { count, prefix } = body

    console.log('Creating batch tables:', { restaurantId, count, prefix })

    // Validierung
    if (!count || count < 1 || count > 100) {
      return NextResponse.json(
        { error: 'Anzahl muss zwischen 1 und 100 liegen' },
        { status: 400 }
      )
    }

    // Prüfe ob User Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { 
        id: true, 
        ownerId: true,
        slug: true,
        name: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung (Owner oder Admin)
    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      // Prüfe ob User Staff-Mitglied ist
      const staffMember = await prisma.restaurantStaff.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId: restaurantId,
            userId: session.user.id
          }
        }
      })

      if (!staffMember) {
        return NextResponse.json(
          { error: 'Keine Berechtigung für dieses Restaurant' },
          { status: 403 }
        )
      }
    }

    // Hole die höchste existierende Tischnummer
    const lastTable = await prisma.table.findFirst({
      where: { restaurantId },
      orderBy: { number: 'desc' }
    })

    const startNumber = (lastTable?.number || 0) + 1

    // Erstelle Tische
    const tables = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'

    for (let i = 0; i < count; i++) {
      const tableNumber = startNumber + i
      const displayName = prefix ? `${prefix}${tableNumber}` : `Tisch ${tableNumber}`
      
      // Generiere QR Code URL
      const qrUrl = `${baseUrl}/r/${restaurant.slug}?table=${tableNumber}`
      
      // Generiere QR Code als Data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const table = await prisma.table.create({
        data: {
          restaurantId,
          number: tableNumber,
          name: displayName,
          qrCode: qrCodeDataUrl,
          seats: 4, // Standard-Kapazität
          isActive: true
        }
      })

      tables.push(table)
    }

    return NextResponse.json({
      success: true,
      message: `${count} Tische erfolgreich erstellt`,
      tables
    })

  } catch (error: any) {
    console.error('Batch table creation error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Einige Tischnummern existieren bereits' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Tische',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// DELETE Methode für Batch-Löschung
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { restaurantId } = await context.params
    const body = await request.json()
    const { tableIds } = body

    if (!tableIds || !Array.isArray(tableIds) || tableIds.length === 0) {
      return NextResponse.json(
        { error: 'Keine Tische zum Löschen angegeben' },
        { status: 400 }
      )
    }

    // Prüfe Berechtigung
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { ownerId: true }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Keine Berechtigung' },
        { status: 403 }
      )
    }

    // Lösche Tische
    const result = await prisma.table.deleteMany({
      where: {
        id: { in: tableIds },
        restaurantId // Sicherstellen dass nur Tische dieses Restaurants gelöscht werden
      }
    })

    return NextResponse.json({
      success: true,
      message: `${result.count} Tische erfolgreich gelöscht`,
      deletedCount: result.count
    })

  } catch (error: any) {
    console.error('Batch table deletion error:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen der Tische',
        details: error.message 
      },
      { status: 500 }
    )
  }
}