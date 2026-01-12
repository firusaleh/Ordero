import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const body = await request.json()
    
    // Unterstütze beide Formate: { count, prefix } oder { tables: [...] }
    let tablesToCreate = []
    
    if (body.tables && Array.isArray(body.tables)) {
      // Frontend sendet { tables: [...] }
      tablesToCreate = body.tables
      console.log('Creating batch tables from array:', { id, count: tablesToCreate.length })
    } else if (body.count) {
      // Alternative: { count, prefix }
      const { count, prefix } = body
      console.log('Creating batch tables from count:', { id, count, prefix })
      
      if (!count || count < 1 || count > 100) {
        return NextResponse.json(
          { error: 'Anzahl muss zwischen 1 und 100 liegen' },
          { status: 400 }
        )
      }
      
      // Generiere Tische basierend auf count
      for (let i = 0; i < count; i++) {
        tablesToCreate.push({
          number: i + 1,
          name: prefix ? `${prefix}${i + 1}` : `Tisch ${i + 1}`,
          seats: 4,
          isActive: true
        })
      }
    } else {
      return NextResponse.json(
        { error: 'Ungültiges Format. Erwartet { tables: [...] } oder { count, prefix }' },
        { status: 400 }
      )
    }

    // Prüfe ob User Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: id },
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
      const staffMember = await prisma.restaurantStaff.findFirst({
        where: {
          restaurantId: id,
          userId: session.user.id
        }
      })

      if (!staffMember) {
        return NextResponse.json(
          { error: 'Keine Berechtigung für dieses Restaurant' },
          { status: 403 }
        )
      }
    }

    // Erstelle Tische
    const createdTables = []
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'

    for (const tableData of tablesToCreate) {
      // Prüfe ob Tischnummer bereits existiert
      const existingTable = await prisma.table.findFirst({
        where: {
          id,
          number: tableData.number
        }
      })
      
      if (existingTable) {
        console.log(`Table number ${tableData.number} already exists, skipping`)
        continue
      }
      
      // Generiere QR Code URL
      const qrUrl = `${baseUrl}/r/${restaurant.slug}?table=${tableData.number}`
      
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
          id: tableData.id,
          restaurantId: id,
          number: tableData.number,
          name: tableData.name || `Tisch ${tableData.number}`,
          qrCode: qrCodeDataUrl,
          seats: tableData.seats || 4,
          area: tableData.area,
          isActive: tableData.isActive !== false // Standard true
        }
      })

      createdTables.push(table)
    }

    return NextResponse.json({
      success: true,
      message: `${createdTables.length} Tische erfolgreich erstellt`,
      data: createdTables
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
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }

    const { id } = await context.params
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
      where: { id: id },
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
        restaurantId: id // Sicherstellen dass nur Tische dieses Restaurants gelöscht werden
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