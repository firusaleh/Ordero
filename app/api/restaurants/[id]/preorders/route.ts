import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const data = await req.json()

    // Validiere Restaurant
    const restaurant = await prisma.restaurant.findUnique({
      where: { id }
    })

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      )
    }

    // Parse Pickup DateTime
    const pickupDateTime = new Date(data.pickupDateTime)
    
    // Validiere Pickup Zeit (mindestens 2 Stunden in der Zukunft)
    const minPickupTime = new Date()
    minPickupTime.setHours(minPickupTime.getHours() + 2)
    
    if (pickupDateTime < minPickupTime) {
      return NextResponse.json(
        { error: 'Abholzeit muss mindestens 2 Stunden in der Zukunft liegen' },
        { status: 400 }
      )
    }

    // Generiere Bestellnummer
    const orderNumber = `PRE-${Date.now()}`

    // Erstelle Vorbestellung
    const order = await prisma.order.create({
      data: {
        restaurantId: id,
        orderNumber,
        type: 'PREORDER',
        status: 'PENDING',
        items: data.items as any,
        subtotal: data.subtotal,
        tax: data.tax || 0,
        tip: data.tip || 0,
        total: data.total,
        guestName: data.customerName,
        guestPhone: data.customerPhone,
        guestEmail: data.customerEmail || null,
        notes: data.notes || null,
        // Speichere Pickup Zeit in einem Custom Field oder notes
        paymentStatus: 'PENDING',
        // Für Vorbestellungen kann das pickupDateTime im notes Feld gespeichert werden
        metadata: {
          pickupDateTime: pickupDateTime.toISOString(),
          preorder: true
        } as any
      }
    })

    // Erstelle OrderItems für bessere Datenbankstruktur
    if (data.items && data.items.length > 0) {
      const orderItems = data.items.map((item: any) => ({
        orderId: order.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
        variantId: item.variantId || null,
        variantName: item.variantName || null,
        extraIds: item.extraIds || [],
        extraNames: item.extraNames || [],
        extraPrices: item.extraPrices || [],
        notes: item.notes || null
      }))

      await prisma.orderItem.createMany({
        data: orderItems
      })
    }

    // Optional: Sende Benachrichtigung an Restaurant
    // await sendPreOrderNotification(restaurant, order)

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      message: 'Vorbestellung erfolgreich erstellt',
      pickupDateTime: pickupDateTime.toISOString()
    })

  } catch (error) {
    console.error('Fehler beim Erstellen der Vorbestellung:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Vorbestellung' },
      { status: 500 }
    )
  }
}

// GET - Vorbestellungen abrufen (für Dashboard)
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    // Hole alle Vorbestellungen für das Restaurant
    const preorders = await prisma.order.findMany({
      where: {
        restaurantId: id,
        type: 'PREORDER',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Letzte 7 Tage
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            menuItem: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      preorders
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Vorbestellungen:', error)
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Vorbestellungen' },
      { status: 500 }
    )
  }
}