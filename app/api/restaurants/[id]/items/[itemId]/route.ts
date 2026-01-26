import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id, itemId } = await context.params
    const data = await req.json()

    // Überprüfe Berechtigung
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Aktualisiere Menü-Artikel mit neuen Varianten und Extras
    const menuItem = await prisma.menuItem.update({
      where: { id: itemId },
      data: {
        name: data.name,
        description: data.description || null,
        price: data.price,
        image: data.image || null,
        categoryId: data.categoryId,
        allergens: data.allergens || [],
        tags: data.tags || [],
        isActive: data.isActive !== undefined ? data.isActive : true,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        // In MongoDB werden Varianten und Extras als embedded documents gespeichert
        variants: data.variants?.map((v: any) => ({
          id: v.id || new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
          name: v.name,
          price: v.price,
          sortOrder: v.sortOrder || 0
        })) || [],
        extras: data.extras?.map((e: any) => ({
          id: e.id || new Date().getTime().toString() + Math.random().toString(36).substr(2, 9),
          name: e.name,
          price: e.price,
          sortOrder: e.sortOrder || 0
        })) || []
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: menuItem 
    })
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Menü-Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Artikels' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id, itemId } = await context.params
    
    // Prüfe ob Force-Delete angefordert wurde
    const url = new URL(req.url)
    const forceDelete = url.searchParams.get('force') === 'true'
    
    console.log('[DELETE MenuItem] Request:', { restaurantId: id, itemId, forceDelete })

    // Überprüfe Berechtigung
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: id,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      console.error('[DELETE MenuItem] Keine Berechtigung für Restaurant:', id)
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Prüfe ob Artikel existiert
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: itemId }
    })
    
    if (!menuItem) {
      console.error('[DELETE MenuItem] Artikel nicht gefunden:', itemId)
      return NextResponse.json({ error: 'Artikel nicht gefunden' }, { status: 404 })
    }
    
    // Prüfe ob Artikel zum Restaurant gehört
    if (menuItem.restaurantId !== id) {
      console.error('[DELETE MenuItem] Artikel gehört nicht zum Restaurant')
      return NextResponse.json({ error: 'Artikel gehört nicht zu diesem Restaurant' }, { status: 403 })
    }

    // Prüfe ob der Artikel in Bestellungen verwendet wird
    const orderItemsCount = await prisma.orderItem.count({
      where: { menuItemId: itemId }
    })
    
    if (orderItemsCount > 0 && !forceDelete) {
      console.log('[DELETE MenuItem] Artikel wird in Bestellungen verwendet')
      
      // Sende Info zurück, dass Artikel in Bestellungen verwendet wird
      return NextResponse.json({ 
        success: false,
        hasOrders: true,
        orderCount: orderItemsCount,
        message: `Artikel wird in ${orderItemsCount} Bestellung(en) verwendet. Möchten Sie ihn trotzdem löschen?`,
        requiresConfirmation: true
      })
    }
    
    if (orderItemsCount > 0 && forceDelete) {
      console.log('[DELETE MenuItem] Force-Delete: Lösche Artikel trotz Bestellungen')
      
      // Lösche zuerst alle OrderItems die diesen Artikel referenzieren
      await prisma.orderItem.deleteMany({
        where: { menuItemId: itemId }
      })
      
      console.log(`[DELETE MenuItem] ${orderItemsCount} OrderItems gelöscht`)
    }
    
    // Keine Bestellungen vorhanden - sicher zu löschen
    await prisma.menuItem.delete({
      where: { id: itemId }
    })
    
    console.log('[DELETE MenuItem] Artikel erfolgreich gelöscht:', itemId)

    return NextResponse.json({ 
      success: true, 
      message: 'Artikel erfolgreich gelöscht' 
    })
  } catch (error: any) {
    console.error('[DELETE MenuItem] Fehler:', error)
    
    // Spezifische Fehlerbehandlung
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Artikel nicht gefunden oder bereits gelöscht' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Artikels',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    )
  }
}