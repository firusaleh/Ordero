import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Prüfe ob Stripe konfiguriert ist
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('STRIPE_SECRET_KEY ist nicht konfiguriert');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null;

// Plattformgebühr in Prozent
const PLATFORM_FEE_PERCENTAGE = 2.5; // 2.5% Plattformgebühr

export async function POST(req: NextRequest) {
  try {
    // Prüfe ob Stripe konfiguriert ist
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.' },
        { status: 503 }
      );
    }
    const body = await req.json();
    const { orderId, restaurantId, amount, currency = 'eur' } = body;

    if (!orderId || !restaurantId || !amount) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Parameter' },
        { status: 400 }
      );
    }

    // Hole Restaurant mit Stripe Connect Account
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant nicht gefunden' },
        { status: 404 }
      );
    }

    if (!restaurant.stripeAccountId || !restaurant.stripeOnboardingCompleted) {
      return NextResponse.json(
        { error: 'Stripe Connect nicht vollständig eingerichtet' },
        { status: 400 }
      );
    }

    // Berechne die Plattformgebühr (in Cents)
    const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));

    // Erstelle Payment Intent mit Plattformgebühr
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Betrag in Cents
      currency: currency,
      payment_method_types: ['card'],
      application_fee_amount: platformFee, // Plattformgebühr
      transfer_data: {
        destination: restaurant.stripeAccountId, // Geld geht an das Restaurant
      },
      metadata: {
        orderId: orderId,
        restaurantId: restaurantId,
        platform: 'Oriido'
      }
    });

    // Speichere Payment Intent ID in der Bestellung
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentIntentId: paymentIntent.id,
        paymentMethod: 'STRIPE'
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      platformFee: platformFee,
      restaurantAmount: amount - platformFee
    });
  } catch (error) {
    console.error('Create Payment Intent Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen der Zahlung' },
      { status: 500 }
    );
  }
}

// Webhook zum Verarbeiten erfolgreicher Zahlungen
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID erforderlich' },
        { status: 400 }
      );
    }

    // Hole Payment Intent von Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Update Bestellstatus
      const order = await prisma.order.findFirst({
        where: { paymentIntentId: paymentIntentId }
      });

      if (order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'PAID',
            paidAt: new Date(),
            status: order.status === 'PENDING' ? 'CONFIRMED' : order.status,
            confirmedAt: order.status === 'PENDING' ? new Date() : order.confirmedAt
          }
        });

        // Erstelle Payment-Eintrag
        await prisma.payment.create({
          data: {
            restaurantId: order.restaurantId,
            amount: paymentIntent.amount / 100, // Cents zu Euro
            currency: paymentIntent.currency.toUpperCase(),
            status: 'SUCCESS',
            type: 'ORDER',
            stripePaymentId: paymentIntent.id,
            description: `Zahlung für Bestellung #${order.orderNumber}`
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Payment Confirmation Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Bestätigen der Zahlung' },
      { status: 500 }
    );
  }
}