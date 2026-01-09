import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const { type, data } = await request.json()
    
    if (type === 'basic') {
      // Update Restaurant Grunddaten
      const restaurant = await prisma.restaurant.update({
        where: { id: resolvedParams.restaurantId },
        data: {
          name: data.name,
          description: data.description,
          cuisine: data.cuisine,
          street: data.street,
          city: data.city,
          postalCode: data.postalCode,
          phone: data.phone,
          email: data.email,
          website: data.website
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Grunddaten erfolgreich aktualisiert',
        data: restaurant
      })
    }
    
    if (type === 'settings') {
      // Update Restaurant Einstellungen
      const settings = await prisma.restaurantSettings.update({
        where: { restaurantId: resolvedParams.restaurantId },
        data: {
          orderingEnabled: data.orderingEnabled,
          requireTableNumber: data.requireTableNumber,
          allowTakeaway: data.allowTakeaway,
          allowDelivery: data.allowDelivery,
          autoAcceptOrders: data.autoAcceptOrders,
          acceptCash: data.acceptCash,
          acceptCard: data.acceptCard,
          acceptPaypal: data.acceptPaypal,
          acceptStripe: data.acceptStripe,
          taxRate: data.taxRate,
          includeTax: data.includeTax
        }
      })
      
      return NextResponse.json({
        success: true,
        message: 'Einstellungen erfolgreich aktualisiert',
        data: settings
      })
    }
    
    return NextResponse.json(
      { error: 'Ungültiger Update-Typ' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Update error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren' },
      { status: 500 }
    )
  }
}