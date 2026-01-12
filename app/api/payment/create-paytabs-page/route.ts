import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('Creating PayTabs payment page')
    
    const body = await request.json()
    
    // Validate required fields
    if (!body.orderId || !body.amount || !body.currency || !body.restaurantId) {
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
    const currency = body.currency || restaurant.settings?.currency || 'JOD'

    // Get PayTabs provider
    let paymentProvider
    try {
      paymentProvider = await PaymentFactory.getProvider(country, currency, 'paytabs')
      
      if (!paymentProvider || paymentProvider.name !== 'PayTabs') {
        throw new Error('PayTabs nicht verfügbar')
      }
    } catch (error) {
      console.error('PayTabs not available:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'PayTabs ist noch nicht konfiguriert. Bitte verwenden Sie Stripe.'
        },
        { status: 503 }
      )
    }

    // Create PayTabs payment page
    const result = await paymentProvider.processPayment({
      orderId: body.orderId,
      amount: body.amount,
      currency: currency,
      restaurantId: body.restaurantId,
      tip: body.tip || 0,
      metadata: {
        source: 'guest-checkout',
        returnUrl: body.returnUrl,
        callbackUrl: body.callbackUrl
      }
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'PayTabs-Zahlung konnte nicht erstellt werden'
        },
        { status: 400 }
      )
    }

    // Return redirect URL and transaction reference
    return NextResponse.json({
      success: true,
      redirectUrl: result.redirectUrl,
      transactionRef: result.paymentIntentId,
      provider: 'PayTabs'
    })

  } catch (error) {
    console.error('Create PayTabs page error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Server-Fehler bei der PayTabs-Verarbeitung'
      },
      { status: 500 }
    )
  }
}