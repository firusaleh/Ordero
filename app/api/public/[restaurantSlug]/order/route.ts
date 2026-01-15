import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewOrderNotification, sendOrderConfirmation } from '@/lib/email'
import { orderRateLimiter, checkRateLimit, getIpAddress } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ restaurantSlug: string }> }
) {
  try {
    const { restaurantSlug } = await params
    
    // Rate Limiting
    const ip = getIpAddress(request)
    const rateLimitResult = await checkRateLimit(orderRateLimiter, ip)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Zu viele Bestellungen. Bitte warten Sie einen Moment.' },
        { status: 429 }
      )
    }
    
    const body = await request.json()
    const { restaurantId, tableId, tableNumber, type, items, tipPercent, tipAmount, paymentMethod } = body

    // Validiere Restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
        id: restaurantId,
        slug: restaurantSlug,
        status: 'ACTIVE'
      },
      include: {
        settings: true
      }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Validiere Tisch wenn erforderlich
    if (restaurant.settings?.requireTableNumber && !tableId) {
      const table = await prisma.table.findFirst({
        where: {
          restaurantId: restaurant.id,
          number: tableNumber,
          isActive: true
        }
      })

      if (!table) {
        return NextResponse.json(
          { error: 'Invalid table number' },
          { status: 400 }
        )
      }
    }

    // Berechne Gesamtpreis
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId }
      })

      if (!menuItem) continue

      let unitPrice = item.variantPrice || menuItem.price
      
      if (item.extras && item.extras.length > 0) {
        unitPrice += item.extras.reduce((sum: number, extra: any) => sum + extra.price, 0)
      }

      const itemTotal = unitPrice * item.quantity
      subtotal += itemTotal

      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        variant: item.variant || null,
        variantPrice: item.variantPrice || null,
        extras: item.extras || [],
        notes: item.notes || null
      })
    }

    // Berechne Steuer
    const taxRate = restaurant.settings?.taxRate || 19
    const includeTax = restaurant.settings?.includeTax ?? true
    let tax = 0
    
    if (includeTax) {
      // Preise enthalten bereits MwSt
      tax = subtotal - (subtotal / (1 + taxRate / 100))
    } else {
      // Preise ohne MwSt
      tax = subtotal * (taxRate / 100)
    }

    // Füge Trinkgeld hinzu
    const tip = tipAmount || 0
    const total = subtotal + (includeTax ? 0 : tax) + tip

    // Generiere Bestellnummer als String
    const count = await prisma.order.count({
      where: {
        restaurantId: restaurant.id
      }
    })
    
    // Hole Restaurant-Settings für Bestellnummer-Prefix
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id }
    })
    
    const orderPrefix = settings?.orderPrefix || 'ORD'
    const orderNumber = `${orderPrefix}-${String(count + 1).padStart(5, '0')}`

    // Erstelle Bestellung
    const order = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId,
        tableNumber,
        orderNumber,
        type: type || 'DINE_IN',
        status: 'PENDING',
        subtotal,
        tax,
        total,
        tip,
        tipPercent: tipPercent || null,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'PENDING',
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    // E-Mail-Benachrichtigungen senden
    try {
      // Benachrichtigung an Restaurant
      const restaurantWithOwner = await prisma.restaurant.findUnique({
        where: { id: restaurant.id },
        include: { owner: true }
      })
      
      const restaurantOwner = restaurantWithOwner?.owner

      if (restaurantOwner?.email) {
        await sendNewOrderNotification({
          email: restaurantOwner.email,
          orderNumber: order.orderNumber.toString(),
          tableNumber: tableNumber || 0,
          items: order.items.map(item => ({
            name: item.menuItem.name,
            quantity: item.quantity,
            price: item.unitPrice
          })),
          total: order.total,
          customerName: body.guestName,
          notes: body.notes
        })
      }

      // Optional: Bestätigungs-E-Mail an Gast (wenn E-Mail vorhanden)
      // Dies würde eine E-Mail-Adresse vom Gast benötigen
    } catch (emailError) {
      console.error('Error sending email notifications:', emailError)
      // E-Mail-Fehler sollten die Bestellung nicht verhindern
    }

    return NextResponse.json({
      success: true,
      data: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        total: order.total,
        tip: order.tip,
        paymentMethod: order.paymentMethod
      }
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}