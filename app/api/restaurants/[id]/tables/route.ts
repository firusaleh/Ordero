import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import QRCode from 'qrcode'

// GET - Hole alle Tische eines Restaurants
export async function GET(
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

    // Prüfe ob User Zugriff auf dieses Restaurant hat
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: id },
      select: { 
        id: true, 
        ownerId: true,
        slug: true 
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe Berechtigung
    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      // Prüfe ob User Staff-Mitglied ist
      const staffMember = await prisma.restaurantStaff.findUnique({
        where: {
          id_userId: {
            id: id,
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

    // Hole alle Tische
    const tables = await prisma.table.findMany({
      where: { id },
      orderBy: { number: 'asc' }
    })

    return NextResponse.json({ success: true, data: tables })

  } catch (error: any) {
    console.error('Get tables error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Tische' },
      { status: 500 }
    )
  }
}

// POST - Erstelle einzelnen Tisch
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
    const { number, name, seats, area } = body

    console.log('Creating single table:', { id, number, name, seats, area })

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

    // Prüfe Berechtigung
    const isOwner = restaurant.ownerId === session.user.id
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN'
    
    if (!isOwner && !isAdmin) {
      // Prüfe ob User Staff-Mitglied ist
      const staffMember = await prisma.restaurantStaff.findUnique({
        where: {
          id_userId: {
            id: id,
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

    // Wenn keine Tischnummer angegeben, finde die nächste freie
    let tableNumber = number
    if (!tableNumber) {
      const lastTable = await prisma.table.findFirst({
        where: { id },
        orderBy: { number: 'desc' }
      })
      tableNumber = (lastTable?.number || 0) + 1
    }

    // Generiere QR Code URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'
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

    // Erstelle Tisch
    const table = await prisma.table.create({
      data: {
        id,
        number: tableNumber,
        name: name || `Tisch ${tableNumber}`,
        seats: seats || 4,
        area: area,
        qrCode: qrCodeDataUrl,
        isActive: true
      }
    })

    return NextResponse.json({ success: true, data: table })

  } catch (error: any) {
    console.error('Create table error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Diese Tischnummer existiert bereits' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Tisches',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

// PUT - Update Tisch
export async function PUT(
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
    const { id, number, name, seats, area, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Tisch ID erforderlich' },
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

    // Update Tisch
    const table = await prisma.table.update({
      where: { id },
      data: {
        number,
        name,
        seats,
        area,
        isActive
      }
    })

    return NextResponse.json({ success: true, data: table })

  } catch (error: any) {
    console.error('Update table error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Diese Tischnummer existiert bereits' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Tisches' },
      { status: 500 }
    )
  }
}

// DELETE - Lösche Tisch
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
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('id')

    if (!tableId) {
      return NextResponse.json(
        { error: 'Tisch ID erforderlich' },
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

    // Lösche Tisch
    await prisma.table.delete({
      where: { id: tableId }
    })

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Delete table error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Tisches' },
      { status: 500 }
    )
  }
}