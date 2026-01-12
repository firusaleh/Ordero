import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    console.log('Update request body:', JSON.stringify(body))
    
    // Validiere Request Body
    if (!body) {
      return NextResponse.json(
        { error: 'Keine Daten zum Aktualisieren erhalten' },
        { status: 400 }
      )
    }
    
    // Unterstütze beide Formate:
    // 1. { type: "...", data: {...} }  - Strukturiertes Format
    // 2. { name: "...", ... }          - Direktes Format
    let type = body.type
    let data = body.data || body
    
    // Wenn body ein type Feld hat, aber kein data Feld, dann ist es vermutlich ein Fehler
    if (body.type && !body.data) {
      console.log('Type provided but no data field, treating entire body as data')
      type = 'all'
      data = body
    }
    
    // Wenn weder type noch data existieren, behandle alles als direkte Daten
    if (!type && !body.data) {
      console.log('No type or data field, treating entire body as data for "all" update')
      type = 'all'
      data = body
    }
    
    console.log('Update request - id:', resolvedParams.id, 'type:', type, 'data keys:', Object.keys(data))
    
    // Prüfe ob Restaurant existiert
    const existingRestaurant = await prisma.restaurant.findUnique({
      where: { id: resolvedParams.id }
    })
    
    if (!existingRestaurant) {
      console.error('Restaurant not found:', resolvedParams.id)
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }
    
    if (type === 'basic') {
      // Update Restaurant Grunddaten
      const restaurant = await prisma.restaurant.update({
        where: { id: resolvedParams.id },
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
        where: { id: resolvedParams.id },
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
      // Bereite Update-Daten vor (nur nicht-null Werte)
      const restaurantUpdateData: any = {}
      if (data?.name !== undefined) restaurantUpdateData.name = data.name
      if (data?.description !== undefined) restaurantUpdateData.description = data.description
      if (data?.cuisine !== undefined) restaurantUpdateData.cuisine = data.cuisine
      if (data?.street !== undefined) restaurantUpdateData.street = data.street
      if (data?.city !== undefined) restaurantUpdateData.city = data.city
      if (data?.postalCode !== undefined) restaurantUpdateData.postalCode = data.postalCode
      if (data?.phone !== undefined) restaurantUpdateData.phone = data.phone
      if (data?.email !== undefined) restaurantUpdateData.email = data.email
      if (data?.website !== undefined) restaurantUpdateData.website = data.website
      if (data?.logo !== undefined) restaurantUpdateData.logo = data.logo
      if (data?.banner !== undefined) restaurantUpdateData.banner = data.banner
      if (data?.primaryColor !== undefined) restaurantUpdateData.primaryColor = data.primaryColor
      
      console.log('Restaurant update data:', restaurantUpdateData)
      
      // Update sowohl Restaurant als auch Settings
      const [restaurant, settings] = await prisma.$transaction([
        prisma.restaurant.update({
          where: { id: resolvedParams.id },
          data: restaurantUpdateData
        }),
        prisma.restaurantSettings.upsert({
          where: { id: resolvedParams.id },
          create: {
            id: resolvedParams.id,
            restaurantId: resolvedParams.id,
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
            orderingEnabled: data?.orderingEnabled,
            requireTableNumber: data?.requireTableNumber,
            allowTakeaway: data?.allowTakeaway,
            allowDelivery: data?.allowDelivery,
            autoAcceptOrders: data?.autoAcceptOrders,
            acceptCash: data?.acceptCash,
            acceptCard: data?.acceptCard,
            acceptPaypal: data?.acceptPaypal,
            acceptStripe: data?.acceptStripe,
            taxRate: data?.taxRate,
            includeTax: data?.includeTax
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
    
  } catch (error: any) {
    console.error('Update error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    })
    
    // Prisma-spezifische Fehlerbehandlung
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Daten-Konflikt: Ein Restaurant mit diesen Daten existiert bereits' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Aktualisieren',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    )
  }
}