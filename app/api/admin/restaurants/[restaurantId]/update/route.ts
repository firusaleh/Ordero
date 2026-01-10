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
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const body = await request.json()
    const { type, data } = body
    
    console.log('Update request - type:', type, 'data:', data)
    
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
    
    // Wenn kein Type angegeben, versuche alle Felder zu updaten
    if (!type || type === 'all') {
      // Update sowohl Restaurant als auch Settings
      const [restaurant, settings] = await prisma.$transaction([
        prisma.restaurant.update({
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
            website: data.website,
            // Füge weitere Felder hinzu falls vorhanden
            ...(data.logo && { logo: data.logo }),
            ...(data.banner && { banner: data.banner }),
            ...(data.primaryColor && { primaryColor: data.primaryColor })
          }
        }),
        prisma.restaurantSettings.upsert({
          where: { restaurantId: resolvedParams.restaurantId },
          create: {
            restaurantId: resolvedParams.restaurantId,
            orderingEnabled: data.orderingEnabled ?? true,
            requireTableNumber: data.requireTableNumber ?? true,
            allowTakeaway: data.allowTakeaway ?? false,
            allowDelivery: data.allowDelivery ?? false,
            autoAcceptOrders: data.autoAcceptOrders ?? false,
            acceptCash: data.acceptCash ?? true,
            acceptCard: data.acceptCard ?? false,
            acceptPaypal: data.acceptPaypal ?? false,
            acceptStripe: data.acceptStripe ?? false,
            taxRate: data.taxRate ?? 19,
            includeTax: data.includeTax ?? true,
            emailNotifications: true,
            soundNotifications: true,
            currency: 'EUR',
            language: 'de',
            timezone: 'Europe/Berlin'
          },
          update: {
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
      ])
      
      return NextResponse.json({
        success: true,
        message: 'Restaurant erfolgreich aktualisiert',
        data: { restaurant, settings }
      })
    }
    
    return NextResponse.json(
      { error: `Ungültiger Update-Typ: ${type}. Erlaubt sind: 'basic', 'settings' oder 'all'` },
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