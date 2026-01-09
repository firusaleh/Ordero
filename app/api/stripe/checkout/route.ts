import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, createCustomer, SUBSCRIPTION_FEATURES } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const { priceId, plan } = await req.json()

    // Prüfe ob Stripe konfiguriert ist
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey || stripeKey === 'sk_test_...' || !stripeKey.startsWith('sk_')) {
      return NextResponse.json({ 
        error: 'Stripe ist noch nicht konfiguriert. Bitte konfigurieren Sie Stripe in der .env.local Datei.' 
      }, { status: 503 })
    }

    // Validiere Plan
    if (!plan || !['STANDARD', 'PREMIUM'].includes(plan)) {
      return NextResponse.json({ error: 'Ungültiger Plan' }, { status: 400 })
    }

    const subscriptionPlan = SUBSCRIPTION_FEATURES[plan as 'STANDARD' | 'PREMIUM']
    if (!subscriptionPlan.priceId) {
      return NextResponse.json({ error: 'Plan nicht verfügbar' }, { status: 400 })
    }

    // Hole oder erstelle Stripe Customer
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Finde Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: { ownerId: user.id }
    })

    let customerId = user.stripeCustomerId

    // Erstelle Stripe Customer wenn nicht vorhanden
    if (!customerId) {
      const customer = await createCustomer({
        email: user.email,
        name: user.name || user.email,
        metadata: {
          userId: user.id,
          restaurantId: restaurant?.id || '',
        }
      })

      customerId = customer.id

      // Speichere Customer ID
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    // Erstelle Checkout Session
    const checkoutSession = await createCheckoutSession({
      customerId: customerId || undefined,
      priceId: subscriptionPlan.priceId,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: user.id,
        restaurantId: restaurant?.id || '',
        plan,
      }
    })

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id 
    })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Checkout-Session' },
      { status: 500 }
    )
  }
}