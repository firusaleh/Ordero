import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { id: restaurantId, itemId } = await params
    const { categoryId } = await request.json()

    // Verify restaurant ownership
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
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 })
    }

    // Verify category exists and belongs to restaurant
    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        restaurantId
      }
    })

    if (!category) {
      return NextResponse.json({ error: 'Kategorie nicht gefunden' }, { status: 404 })
    }

    // Update menu item category
    const updatedItem = await prisma.menuItem.update({
      where: {
        id: itemId,
        restaurantId
      },
      data: {
        categoryId
      }
    })

    return NextResponse.json({ 
      success: true, 
      item: updatedItem 
    })
  } catch (error) {
    console.error('Error updating item category:', error)
    return NextResponse.json(
      { error: 'Fehler beim Verschieben des Artikels' },
      { status: 500 }
    )
  }
}