import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendNewOrderNotification, sendOrderConfirmation } from '@/lib/email'
import { orderRateLimiter, checkRateLimit, getIpAddress } from '@/lib/rate-limit'
import { getPOSAdapter } from '@/lib/pos-integrations'

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
    const { tableId, tableNumber, type, items, tipPercent, tipAmount, paymentMethod } = body

    // Validiere Restaurant über Slug
    const restaurant = await prisma.restaurant.findUnique({
      where: { 
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

    // Berechne Service Fee
    let serviceFee = 0
    if (restaurant.settings?.serviceFeeEnabled) {
      if (restaurant.settings.serviceFeeType === 'PERCENT') {
        serviceFee = subtotal * (restaurant.settings.serviceFeePercent / 100)
      } else {
        serviceFee = restaurant.settings.serviceFeeAmount || 0
      }
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

    // Füge Trinkgeld und Service Fee hinzu
    const tip = tipAmount || 0
    const total = subtotal + (includeTax ? 0 : tax) + serviceFee + tip

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

    // Debug-Logging für Restaurant
    console.log('[ORDER CREATE] Creating order for restaurant:', {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      restaurantSlug: restaurant.slug,
      stripeAccountId: restaurant.stripeAccountId,
      stripeOnboardingCompleted: restaurant.stripeOnboardingCompleted,
      orderNumber,
      tableNumber,
      total,
      paymentMethod: paymentMethod || 'CASH'
    })

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
        serviceFee,
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

    console.log('[ORDER CREATE] Order created successfully:', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      status: order.status
    })

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
        
        // TODO: Hier könnte später die tatsächliche Abrechnung implementiert werden
        // z.B. über einen Payment Provider oder eine Billing-Tabelle
        const currency = restaurant.country === 'JO' ? 'JD' : '€'
        const planType = restaurant.subscriptionPlan
        console.log(`[BILLING] Bestellung ${orderNumber} für Restaurant ${restaurant.name} (${restaurant.country}) - Plan: ${planType} - Gebühr: ${restaurant.payPerOrderRate} ${currency}`)
        
        // Bei DE_MONTHLY oder DE_YEARLY fallen KEINE Gebühren pro Bestellung an
        if (restaurant.country === 'DE' && (restaurant.subscriptionPlan === 'DE_MONTHLY' || restaurant.subscriptionPlan === 'DE_YEARLY')) {
          console.log(`[BILLING] Restaurant hat Flatrate (${restaurant.subscriptionPlan}) - keine Gebühr pro Bestellung`)
        }
      } catch (billingError) {
        // Billing-Fehler sollten die Bestellung nicht verhindern
        console.error('Fehler bei der automatischen Abrechnung:', billingError)
      }
    } else if (restaurant.country === 'DE' && (restaurant.subscriptionPlan === 'DE_MONTHLY' || restaurant.subscriptionPlan === 'DE_YEARLY')) {
      // Flatrate - keine Gebühren pro Bestellung, nur monatliche/jährliche Gebühr
      console.log(`[BILLING] Restaurant ${restaurant.name} hat Flatrate-Plan (${restaurant.subscriptionPlan}) - keine Gebühr für Bestellung ${orderNumber}`)
    }

    // WICHTIG: Prüfe ob Restaurant Stripe Connect hat für spätere Zahlungen
    if (!restaurant.stripeAccountId || !restaurant.stripeOnboardingCompleted) {
      console.warn('[STRIPE WARNING] Restaurant hat kein Stripe Connect eingerichtet:', {
        restaurantId: restaurant.id,
        name: restaurant.name,
        stripeAccountId: restaurant.stripeAccountId,
        onboardingCompleted: restaurant.stripeOnboardingCompleted,
        info: 'Zahlungen werden direkt an Oriido gehen und müssen manuell übertragen werden'
      })
    }

    // POS-Integration: Sende Bestellung an Kassensystem
    if (restaurant.settings?.posSyncEnabled && restaurant.settings?.posSystem && restaurant.settings?.posApiKey) {
      try {
        const adapter = getPOSAdapter(
          restaurant.settings.posSystem,
          restaurant.settings.posApiKey,
          restaurant.settings.posRestaurantId || undefined
        )

        if (adapter) {
          const posOrder = {
            id: order.id,
            orderNumber: order.orderNumber,
            tableNumber: order.tableNumber ? order.tableNumber.toString() : undefined,
            orderType: order.type,
            items: order.items.map(item => ({
              name: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              notes: item.notes || undefined,
              posId: item.menuItem.posId || undefined,
              selectedVariants: [], // TODO: Implementiere Varianten
              selectedExtras: []    // TODO: Implementiere Extras
            })),
            total: order.total,
            tipAmount: order.tip || undefined,
            paymentMethod: order.paymentMethod || 'CASH',
            customerName: body.guestName,
            guestEmail: body.guestEmail,
            notes: body.notes
          }

          const posSent = await adapter.sendOrder(posOrder)
          
          if (posSent) {
            console.log(`[POS SYNC] Bestellung ${order.orderNumber} erfolgreich an ${restaurant.settings.posSystem} gesendet`)
            
            // Markiere Bestellung als mit POS synchronisiert
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                posSyncStatus: 'SYNCED',
                posSyncedAt: new Date()
              }
            })
          } else {
            console.error(`[POS SYNC] Fehler beim Senden der Bestellung ${order.orderNumber} an ${restaurant.settings.posSystem}`)
          }
        }
      } catch (posError) {
        console.error('[POS SYNC] Fehler bei POS-Integration:', posError)
        // POS-Fehler sollten die Bestellung nicht verhindern
      }
    }

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