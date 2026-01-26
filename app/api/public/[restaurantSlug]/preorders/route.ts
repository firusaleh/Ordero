import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
// Email-Service ist verfügbar in email-service.ts

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
      where: { slug: restaurantSlug },
      include: {
        settings: true,
        categories: {
          where: { isActive: true },
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
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob Vorbestellungen erlaubt sind
    const currentTime = new Date()
    const maxPreOrderTime = new Date()
    maxPreOrderTime.setHours(maxPreOrderTime.getHours() + 24) // Max 24 Stunden im Voraus

    return NextResponse.json({
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        description: restaurant.description,
        settings: {
          currency: restaurant.settings?.currency || 'EUR',
          serviceFee: restaurant.settings?.serviceFeePercent || 0,
          taxRate: restaurant.settings?.taxRate || 19
        }
      },
      categories: restaurant.categories,
      availableTimeSlots: {
        min: new Date(currentTime.getTime() + 20 * 60000).toISOString(), // Min 20 Minuten voraus
        max: maxPreOrderTime.toISOString()
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen des Menüs:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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
      where: { slug: restaurantSlug },
      include: { 
        settings: true,
        owner: {
          select: {
            email: true
          }
        }
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

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
    const preOrderItems = validatedData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)!
      
      let itemPrice = menuItem.price
      
      // Variante hinzufügen
      if (item.variant) {
        const variant = menuItem.variants?.find(v => v.name === item.variant)
        if (variant) {
          itemPrice = variant.price
        }
      }
      
      // Extras hinzufügen
      let extrasTotal = 0
      if (item.extras && item.extras.length > 0) {
        extrasTotal = item.extras.reduce((sum, extra) => sum + extra.price, 0)
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
        variantPrice: item.variant ? itemPrice : undefined,
        extras: item.extras || [],
        notes: item.notes
      }
    })

    // Berechne Steuern und Gebühren
    const taxRate = restaurant.settings?.taxRate || 19
    const tax = subtotal * (taxRate / 100)
    const serviceFee = restaurant.settings?.serviceFeePercent 
      ? subtotal * (restaurant.settings.serviceFeePercent / 100)
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
    for (const item of preOrderItems) {
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
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}