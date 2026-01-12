import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.transactionRef || !body.orderId || !body.restaurantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Pflichtfelder'
        },
        { status: 400 }
      )
    }

    // Load restaurant to get country
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: body.restaurantId },
      include: { settings: true }
    })
    
    if (!restaurant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Restaurant nicht gefunden'
        },
        { status: 404 }
      )
    }

    const country = restaurant.country || 'JO'
    const currency = restaurant.settings?.currency || 'JOD'

    // Get PayTabs provider
    const paymentProvider = await PaymentFactory.getProvider(country, currency, 'paytabs')
    
    if (!paymentProvider || paymentProvider.name !== 'PayTabs') {
      return NextResponse.json(
        {
          success: false,
          error: 'PayTabs Provider nicht verfügbar'
        },
        { status: 503 }
      )
    }

    // Verify payment with PayTabs
    const result = await paymentProvider.confirmPayment(body.transactionRef)

    if (result.success) {
      // Update order status in database
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          paymentStatus: 'paid',
          paymentMethod: 'card',
          paymentIntentId: body.transactionRef,
          paidAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Zahlung erfolgreich verifiziert'
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Zahlung konnte nicht verifiziert werden'
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Verify PayTabs payment error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Fehler bei der Zahlungsverifizierung'
      },
      { status: 500 }
    )
  }
}