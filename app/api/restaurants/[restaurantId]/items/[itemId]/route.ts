import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ restaurantId: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { restaurantId, itemId } = await context.params
    const data = await req.json()

    // Überprüfe Berechtigung
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Aktualisiere Menü-Artikel
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
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true
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
  context: { params: Promise<{ restaurantId: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { restaurantId, itemId } = await context.params

    // Überprüfe Berechtigung
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
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