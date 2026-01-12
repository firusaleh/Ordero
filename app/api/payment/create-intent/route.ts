import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'
import { prisma } from '@/lib/prisma'

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

    // Lade das Restaurant um Land und Währung zu erhalten
    let restaurant = null
    let country = 'DE'
    let currency = 'EUR'
    
    if (body.restaurantId) {
      restaurant = await prisma.restaurant.findUnique({
        where: { id: body.restaurantId },
        include: { settings: true }
      })
      
      if (restaurant) {
        country = restaurant.country || 'DE'
        currency = restaurant.settings?.currency || 'EUR'
        console.log('Restaurant found:', {
          name: restaurant.name,
          country,
          currency
        })
      }
    }

    const data = {
      orderId: body.orderId,
      amount: body.amount,
      currency: body.currency || currency,
      restaurantId: body.restaurantId,
      tip: body.tip || 0,
      customerId: body.customerId,
      country: body.country || country,
      metadata: body.metadata || {}
    }

    // Hole den passenden Payment Provider basierend auf Restaurant-Standort
    console.log('Getting payment provider for:', { 
      country: data.country, 
      currency: data.currency
    })
    
    let paymentProvider
    let fallbackMessage = null
    
    try {
      // Wähle Provider basierend auf Land
      const isMiddleEast = ['JO', 'SA', 'AE', 'KW', 'BH', 'QA', 'OM', 'EG'].includes(data.country)
      const preferredProvider = isMiddleEast ? 'paytabs' : 'stripe'
      
      console.log('Preferred provider for country', data.country, ':', preferredProvider)
      
      // Try to get preferred provider first
      try {
        paymentProvider = await PaymentFactory.getProvider(
          data.country, 
          data.currency, 
          preferredProvider
        )
      } catch (error) {
        console.warn(`Preferred provider ${preferredProvider} not available, trying fallback`)
        
        // If PayTabs fails for Middle East, try Stripe as fallback
        if (isMiddleEast && preferredProvider === 'paytabs') {
          fallbackMessage = 'PayTabs ist noch nicht konfiguriert. Verwende Stripe als Alternative.'
          paymentProvider = await PaymentFactory.getProvider(
            data.country, 
            data.currency, 
            'stripe'
          )
        } else {
          throw error
        }
      }
      
      console.log('Payment provider obtained:', paymentProvider?.name || 'none')
      if (fallbackMessage) {
        console.log('Fallback message:', fallbackMessage)
      }
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
      supportedPaymentMethods: paymentProvider.getSupportedPaymentMethods(data.country),
      fallbackMessage: fallbackMessage || undefined
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

    // Build response object
    const response: any = {
      country,
      currency,
      stripeConfigured: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_...',
      paytabsConfigured: !!process.env.PAYTABS_SERVER_KEY && process.env.PAYTABS_SERVER_KEY !== 'SHJN6LRNBB-JGGLGDNLZT-BWTLZ69DRN',
      availableProviders: [],
      activeProvider: null,
      providerError: null,
      isProduction: process.env.NODE_ENV === 'production'
    }

    // Try to get available providers
    try {
      response.availableProviders = PaymentFactory.getAvailableProviders(country, currency)
    } catch (error) {
      console.error('Error getting available providers:', error)
    }
    
    // Try to get active provider
    try {
      const provider = await PaymentFactory.getProvider(country, currency)
      response.activeProvider = {
        name: provider.name,
        supportedMethods: provider.getSupportedPaymentMethods(country)
      }
    } catch (error) {
      // Provider nicht verfügbar
      response.providerError = error instanceof Error ? error.message : 'Provider not available'
      console.log('Provider error for', country, currency, ':', response.providerError)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Get payment info error:', error)
    
    return NextResponse.json(
      {
        error: 'Fehler beim Abrufen der Zahlungsinformationen',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}