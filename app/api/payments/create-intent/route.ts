import { NextRequest, NextResponse } from 'next/server'
import { PaymentFactory } from '@/lib/payment/factory'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      orderId, 
      amount, 
      currency, 
      country,
      tip,
      customerEmail,
      customerName,
      customerPhone,
      preferredProvider 
    } = body

    // Validierung
    if (!orderId || !amount || !currency || !country) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Felder' },
        { status: 400 }
      )
    }

    // Hole Bestelldetails
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { restaurant: true }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      )
    }

    // Automatisch den besten Payment Provider auswählen
    const provider = await PaymentFactory.getProvider(
      country,
      currency,
      preferredProvider
    )

    console.log(`Using payment provider: ${provider.name} for ${country}/${currency}`)

    // Payment Intent erstellen
    const result = await provider.processPayment({
      amount,
      currency,
      orderId,
      restaurantId: order.restaurantId,
      tip,
      metadata: {
        customerEmail: customerEmail || order.customerEmail || '',
        customerName: customerName || order.guestName || '',
        customerPhone: customerPhone || order.customerPhone || '',
        tableNumber: order.tableNumber?.toString() || ''
      }
    })

    if (result.success) {
      // Speichere Payment Intent ID in der Bestellung
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentIntentId: result.paymentIntentId,
          paymentMethod: provider.name.toUpperCase()
        }
      })

      // Rückgabe mit Provider-Info
      return NextResponse.json({
        success: true,
        provider: provider.name,
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        redirectUrl: result.redirectUrl,
        supportedMethods: provider.getSupportedPaymentMethods(country)
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Zahlung konnte nicht verarbeitet werden' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// GET: Verfügbare Provider für ein Land abrufen
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const country = searchParams.get('country') || 'DE'
    const currency = searchParams.get('currency') || 'EUR'

    const availableProviders = PaymentFactory.getAvailableProviders(country, currency)
    
    // Detaillierte Infos für jeden Provider
    const providerDetails = await Promise.all(
      availableProviders.map(async (providerName) => {
        try {
          const provider = await PaymentFactory.getProvider(country, currency, providerName)
          return {
            name: providerName,
            displayName: provider.name,
            available: true,
            supportedMethods: provider.getSupportedPaymentMethods(country)
          }
        } catch {
          return {
            name: providerName,
            displayName: providerName,
            available: false,
            supportedMethods: []
          }
        }
      })
    )

    return NextResponse.json({
      country,
      currency,
      providers: providerDetails,
      recommended: providerDetails[0]?.name || 'stripe'
    })
  } catch (error: any) {
    console.error('Error getting available providers:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Abrufen der Zahlungsanbieter' },
      { status: 500 }
    )
  }
}