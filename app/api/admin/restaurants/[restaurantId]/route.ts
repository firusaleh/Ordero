import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ restaurantId: string }> }
) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { restaurantId } = await context.params
    
    // Prüfe ob Restaurant existiert
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { 
        owner: true,
        orders: true,
        menuItems: true,
        categories: true,
        tables: true
      }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }
    
    // Lösche alles in einer Transaktion
    await prisma.$transaction(async (tx) => {
      // 1. Lösche alle Bestellpositionen
      await tx.orderItem.deleteMany({
        where: {
          order: {
            restaurantId: restaurantId
          }
        }
      })
      
      // 2. Lösche alle Bestellungen
      await tx.order.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 3. Lösche alle Menü-Items
      await tx.menuItem.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 4. Lösche alle Kategorien
      await tx.category.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 5. Lösche alle Tische
      await tx.table.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 6. Lösche Restaurant-Einstellungen
      await tx.restaurantSettings.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 7. Lösche Restaurant-Staff Zuordnungen
      await tx.restaurantStaff.deleteMany({
        where: { restaurantId: restaurantId }
      })
      
      // 8. Lösche das Restaurant selbst
      await tx.restaurant.delete({
        where: { id: restaurantId }
      })
      
      // 9. Lösche den Owner-Account (optional - nur wenn er keine anderen Restaurants hat)
      const otherRestaurants = await tx.restaurant.findFirst({
        where: { ownerId: restaurant.ownerId }
      })
      
      if (!otherRestaurants) {
        // Owner hat keine anderen Restaurants, lösche den Account
        await tx.user.delete({
          where: { id: restaurant.ownerId }
        })
      }
    })
    
    return NextResponse.json({
      success: true,
      message: 'Restaurant und alle zugehörigen Daten wurden vollständig gelöscht',
      deletedRestaurant: restaurant.name
    })
    
  } catch (error: any) {
    console.error('Delete restaurant error:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Löschen des Restaurants',
        details: error.message 
      },
      { status: 500 }
    )
  }
}