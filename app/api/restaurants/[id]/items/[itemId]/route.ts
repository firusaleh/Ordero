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

    // Lösche Menü-Artikel
    await prisma.menuItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Artikel gelöscht' 
    })
  } catch (error) {
    console.error('Fehler beim Löschen des Menü-Artikels:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Artikels' },
      { status: 500 }
    )
  }
}