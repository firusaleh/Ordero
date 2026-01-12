import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'

export async function POST(request: NextRequest) {
  try {
    console.log('Create payment intent - Request received')
    
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === 'sk_test_...') {
      console.error('Stripe Secret Key is not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Zahlungsservice ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.'
        },
        { status: 500 }
      )
    }
    
    console.log('Stripe key exists:', !!process.env.STRIPE_SECRET_KEY)

    const body = await request.json()
    console.log('Request body:', body)
    
    // Validate required fields
    if (!body.orderId || !body.amount || !body.currency || !body.restaurantId) {
      console.error('Missing required fields:', {
        orderId: !!body.orderId,
        amount: !!body.amount,
        currency: !!body.currency,
        restaurantId: !!body.restaurantId
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Fehlende Pflichtfelder'
        },
        { status: 400 }
      )
    }

    const data = {
      orderId: body.orderId,
      amount: body.amount,
      currency: body.currency || 'EUR',
      restaurantId: body.restaurantId,
      tip: body.tip || 0,
      customerId: body.customerId,
      country: body.country || 'DE',
      metadata: body.metadata || {}
    }

    // Hole den passenden Payment Provider
    console.log('Getting payment provider for:', { 
      country: data.country, 
      currency: data.currency,
      forceProvider: body.forceProvider 
    })
    
    let paymentProvider
    try {
      // If forceProvider is specified and it's stripe, always use stripe regardless of country
      if (body.forceProvider === 'stripe') {
        paymentProvider = await PaymentFactory.getProvider(
          'DE', // Force DE for Stripe
          'EUR', // Force EUR for Stripe  
          'stripe'
        )
      } else {
        paymentProvider = await PaymentFactory.getProvider(
          data.country, 
          data.currency, 
          'stripe' // Bevorzuge Stripe
        )
      }
      console.log('Payment provider obtained:', paymentProvider?.name || 'none')
    } catch (error) {
      console.error('Payment provider not available:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Kein Zahlungsanbieter verfügbar für diese Region'
        },
        { status: 503 }
      )
    }
    
    if (!paymentProvider) {
      console.error('No payment provider returned')
      return NextResponse.json(
        {
          success: false,
          error: 'Zahlungsanbieter konnte nicht initialisiert werden'
        },
        { status: 503 }
      )
    }

    // Erstelle das Payment Intent
    const result = await paymentProvider.processPayment({
      orderId: data.orderId,
      amount: data.amount,
      currency: data.currency,
      restaurantId: data.restaurantId,
      tip: data.tip,
      customerId: data.customerId,
      metadata: {
        source: 'guest-order',
        country: data.country,
        ...data.metadata
      }
    })

    if (!result.success) {
      console.error('Payment intent creation failed:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Zahlungs-Intent konnte nicht erstellt werden'
        },
        { status: 400 }
      )
    }

    // Erfolgreiche Antwort
    return NextResponse.json({
      success: true,
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      provider: paymentProvider.name,
      supportedPaymentMethods: paymentProvider.getSupportedPaymentMethods(data.country)
    })

  } catch (error) {
    console.error('Create payment intent error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Interner Server-Fehler bei der Zahlungsverarbeitung'
      },
      { status: 500 }
    )
  }
}

// Für Entwicklung/Debugging - GET Endpoint um verfügbare Provider anzuzeigen
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const country = searchParams.get('country') || 'DE'
    const currency = searchParams.get('currency') || 'EUR'

    const availableProviders = PaymentFactory.getAvailableProviders(country, currency)
    
    let activeProvider = null
    try {
      const provider = await PaymentFactory.getProvider(country, currency)
      activeProvider = {
        name: provider.name,
        supportedMethods: provider.getSupportedPaymentMethods(country)
      }
    } catch (error) {
      // Provider nicht verfügbar
    }

    return NextResponse.json({
      country,
      currency,
      availableProviders,
      activeProvider,
      isProduction: process.env.NODE_ENV === 'production'
    })

  } catch (error) {
    console.error('Get payment info error:', error)
    
    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen der Zahlungsinformationen'
      },
      { status: 500 }
    )
  }
}