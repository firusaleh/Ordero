import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema für neue Vorbestellung
const createPreOrderSchema = z.object({
  customerName: z.string().min(2, 'Name ist erforderlich'),
  customerEmail: z.string().email('Ungültige E-Mail-Adresse'),
  customerPhone: z.string().min(10, 'Telefonnummer ist erforderlich'),
  pickupTime: z.string(), // ISO DateTime string
  orderType: z.enum(['PICKUP', 'DINE_IN']).default('PICKUP'),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    variant: z.string().optional(),
    extras: z.array(z.object({
      name: z.string(),
      price: z.number()
    })).optional(),
    notes: z.string().optional()
  })),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CARD', 'ONLINE']).optional()
})

// GET - Menü für Vorbestellung abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const { restaurantSlug } = await params
    
    // Restaurant mit Menü finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Settings separat laden
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id }
    })

    // Kategorien und MenuItems laden
    const categories = await prisma.category.findMany({
      where: { 
        restaurantId: restaurant.id,
        isActive: true 
      },
      include: {
        menuItems: {
          where: { 
            isActive: true,
            isAvailable: true 
          },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    })

    // Prüfe ob Vorbestellungen erlaubt sind
    const currentTime = new Date()
    const maxPreOrderTime = new Date()
    maxPreOrderTime.setHours(maxPreOrderTime.getHours() + 24) // Max 24 Stunden im Voraus

    // Konvertiere menuItems für bessere Kompatibilität
    const categoriesWithPrices = categories.map(category => ({
      ...category,
      menuItems: category.menuItems.map(item => ({
        ...item,
        price: Number(item.price) || 0, // Stelle sicher, dass price eine Zahl ist
        variants: item.variants ? (item.variants as any[]).map((v: any) => ({
          ...v,
          price: Number(v.price) || 0
        })) : [],
        extras: item.extras || []
      }))
    }))

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        logo: restaurant.logo,
        banner: restaurant.banner,
        primaryColor: restaurant.primaryColor,
        settings: {
          currency: settings?.currency || 'EUR',
          serviceFee: settings?.serviceFeePercent || 0,
          taxRate: settings?.taxRate || 19
        }
      },
      categories: categoriesWithPrices,
      availableTimeSlots: {
        min: new Date(currentTime.getTime() + 20 * 60000).toISOString(), // Min 20 Minuten voraus
        max: maxPreOrderTime.toISOString()
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error },
      { status: 500 }
    )
  }
}

// POST - Neue Vorbestellung erstellen
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const body = await request.json()
    
    // Validiere Eingabe
    const validatedData = createPreOrderSchema.parse(body)
    const { restaurantSlug } = await params

    // Restaurant finden
    const restaurant = await prisma.restaurant.findUnique({
      where: { slug: restaurantSlug }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Settings laden
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id }
    })

    // Validiere Pickup-Zeit (min 20 Minuten, max 24 Stunden)
    const pickupTime = new Date(validatedData.pickupTime)
    const now = new Date()
    const minTime = new Date(now.getTime() + 20 * 60000)
    const maxTime = new Date(now.getTime() + 24 * 60 * 60000)

    if (pickupTime < minTime || pickupTime > maxTime) {
      return NextResponse.json(
        { error: 'Ungültige Abholzeit. Mindestens 20 Minuten, maximal 24 Stunden im Voraus.' },
        { status: 400 }
      )
    }

    // Hole Menü-Items mit Preisen
    const menuItemIds = validatedData.items.map(item => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { 
        id: { in: menuItemIds },
        restaurantId: restaurant.id,
        isActive: true,
        isAvailable: true
      }
    })

    if (menuItems.length !== menuItemIds.length) {
      return NextResponse.json(
        { error: 'Ein oder mehrere Artikel sind nicht verfügbar' },
        { status: 400 }
      )
    }

    // Berechne Preise
    let subtotal = 0
    const orderItems = validatedData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      
      let itemPrice = Number(menuItem.price) || 0
      
      // Variante hinzufügen
      if (item.variant && menuItem.variants) {
        const variants = menuItem.variants as any[]
        const variant = variants.find(v => v.name === item.variant)
        if (variant) {
          itemPrice = Number(variant.price) || 0
        }
      }
      
      // Extras hinzufügen
      let extrasTotal = 0
      const extras = []
      if (item.extras && item.extras.length > 0) {
        extrasTotal = item.extras.reduce((sum, extra) => sum + (Number(extra.price) || 0), 0)
        extras.push(...item.extras)
      }
      
      const totalPrice = (itemPrice + extrasTotal) * item.quantity
      subtotal += totalPrice
      
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: itemPrice,
        totalPrice,
        variant: item.variant,
        variantPrice: item.variant ? itemPrice : null,
        extras: extras,
        notes: item.notes
      }
    })

    // Berechne Steuern und Gebühren
    const taxRate = settings?.taxRate || 19
    const tax = subtotal * (taxRate / 100)
    const serviceFee = settings?.serviceFeePercent 
      ? subtotal * (settings.serviceFeePercent / 100)
      : 0
    const total = subtotal + tax + serviceFee

    // Generiere Bestellnummer
    const orderNumber = `PRE-${Date.now()}`
    
    // Erstelle Bestellung als Vorbestellung (TAKEAWAY Typ)
    const orderNotes = [
      validatedData.notes || '',
      `PICKUP_TIME: ${pickupTime.toISOString()}`,
      'PREORDER: true'
    ].filter(Boolean).join('\n---\n')
    
    const preOrder = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        orderNumber,
        type: 'TAKEAWAY', // Verwende TAKEAWAY für Vorbestellungen
        status: 'PENDING',
        subtotal,
        tax,
        serviceFee,
        total,
        guestName: validatedData.customerName,
        guestPhone: validatedData.customerPhone,
        guestEmail: validatedData.customerEmail,
        notes: orderNotes,
        paymentStatus: validatedData.paymentMethod === 'ONLINE' ? 'PENDING' : 'UNPAID',
        paymentMethod: validatedData.paymentMethod || 'CASH'
      }
    })
    
    // Erstelle OrderItems
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: preOrder.id,
          menuItemId: item.menuItemId,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          variant: item.variant,
          variantPrice: item.variantPrice,
          notes: item.notes,
          extras: item.extras // Als embedded document
        }
      })
    }

    // Automatische Abrechnung für Pay-per-Order (nur wenn aktiviert)
    if (restaurant.payPerOrderEnabled && restaurant.payPerOrderRate) {
      try {
        // Erhöhe den monatlichen Bestellzähler
        await prisma.restaurant.update({
          where: { id: restaurant.id },
          data: {
            monthlyOrderCount: {
              increment: 1
            }
          }
        })
        
        const currency = restaurant.country === 'JO' ? 'JD' : '€'
        const planType = restaurant.subscriptionPlan
        console.log(`[BILLING] Vorbestellung ${preOrder.orderNumber} für Restaurant ${restaurant.name} (${restaurant.country}) - Plan: ${planType} - Gebühr: ${restaurant.payPerOrderRate} ${currency}`)
      } catch (billingError) {
        // Billing-Fehler sollten die Vorbestellung nicht verhindern
        console.error('Fehler bei der automatischen Abrechnung:', billingError)
      }
    } else if (restaurant.country === 'DE' && (restaurant.subscriptionPlan === 'DE_MONTHLY' || restaurant.subscriptionPlan === 'DE_YEARLY')) {
      // Flatrate - keine Gebühren pro Bestellung, nur monatliche/jährliche Gebühr
      console.log(`[BILLING] Restaurant ${restaurant.name} hat Flatrate-Plan (${restaurant.subscriptionPlan}) - keine Gebühr für Vorbestellung ${preOrder.orderNumber}`)
    }

    // Sende E-Mail-Benachrichtigung an Restaurant (optional)
    // TODO: Implementiere E-Mail-Benachrichtigung mit email-service.ts

    // Wenn Online-Zahlung gewählt wurde, erstelle Payment Intent
    let paymentUrl = null
    if (validatedData.paymentMethod === 'ONLINE') {
      // TODO: Stripe Payment Intent erstellen
      // paymentUrl = await createStripePaymentIntent(preOrder)
    }

    return NextResponse.json({
      success: true,
      preOrder: {
        id: preOrder.id,
        status: preOrder.status,
        total: preOrder.total,
        pickupTime: pickupTime,
        orderNumber: preOrder.orderNumber,
        paymentUrl
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Ungültige Eingabe', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Fehler beim Erstellen der Vorbestellung:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler', details: error },
      { status: 500 }
    )
  }
}