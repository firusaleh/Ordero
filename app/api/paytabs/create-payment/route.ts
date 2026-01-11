import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createPaymentPage, PAYTABS_CONFIG, isPayTabsConfigured } from '@/lib/paytabs'

export async function POST(req: NextRequest) {
  try {
    // Prüfe ob PayTabs konfiguriert ist
    if (!isPayTabsConfigured()) {
      return NextResponse.json(
        { error: 'PayTabs ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.' },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { orderId, restaurantId } = body

    if (!orderId || !restaurantId) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Parameter' },
        { status: 400 }
      )
    }

    // Hole Bestellung mit Details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        items: {
          include: {
            menuItem: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    // Prüfe ob Restaurant PayTabs aktiviert hat
    const restaurantSettings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId }
    })

    if (!restaurantSettings?.acceptPaytabs) {
      return NextResponse.json(
        { error: 'PayTabs ist für dieses Restaurant nicht aktiviert' },
        { status: 400 }
      )
    }

    // Erstelle PayTabs Payment Page
    const paymentResult = await createPaymentPage({
      orderId: order.id,
      amount: order.total,
      description: `Bestellung bei ${order.restaurant.name}`,
      customerName: order.guestName || 'Gast',
      customerEmail: order.guestEmail || 'guest@oriido.com',
      customerPhone: order.guestPhone || '+962000000000',
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}/success`,
      callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/paytabs/webhook`
    })

    if (!paymentResult) {
      return NextResponse.json(
        { error: 'Fehler beim Erstellen der Zahlung' },
        { status: 500 }
      )
    }

    // Speichere PayTabs Transaction Reference
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentResult.tranRef,
        paymentMethod: 'PAYTABS'
      }
    })

    return NextResponse.json({
      paymentUrl: paymentResult.paymentUrl,
      tranRef: paymentResult.tranRef
    })

  } catch (error: any) {
    console.error('PayTabs Payment Error:', error)
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Zahlung',
        details: error.message
      },
      { status: 500 }
    )
  }
}