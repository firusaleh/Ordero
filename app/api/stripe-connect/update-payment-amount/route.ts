import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as any,
})

export async function POST(request: NextRequest) {
  try {
    const { paymentIntentId, amount } = await request.json()

    if (!paymentIntentId || !amount) {
      return NextResponse.json(
        { error: 'Payment Intent ID und Betrag sind erforderlich' },
        { status: 400 }
      )
    }

    // Update the payment intent with new amount
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      {
        amount: Math.round(amount), // Amount in cents
      }
    )

    return NextResponse.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        client_secret: paymentIntent.client_secret,
      }
    })
  } catch (error: any) {
    console.error('Error updating payment amount:', error)
    return NextResponse.json(
      { error: error.message || 'Fehler beim Aktualisieren des Betrags' },
      { status: 500 }
    )
  }
}