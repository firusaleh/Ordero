import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

// Prüfe ob Stripe konfiguriert ist
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isValidKey = stripeSecretKey && 
  stripeSecretKey !== 'sk_test_...' && 
  stripeSecretKey.startsWith('sk_');

if (!isValidKey) {
  console.error('STRIPE_SECRET_KEY ist nicht konfiguriert oder ungültig. Aktueller Wert:', stripeSecretKey ? 'sk_test_... (Platzhalter)' : 'nicht gesetzt');
}

const stripe = isValidKey ? new Stripe(stripeSecretKey!, {
  apiVersion: '2024-11-20.acacia' as any,
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
    const { orderId, restaurantId, amount, currency = 'eur', tableNumber } = body;

    if (!orderId || !restaurantId || !amount) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Parameter' },
        { status: 400 }
      );
    }

    // Validate orderId is a valid MongoDB ObjectId (24 hex characters)
    const isValidOrderId = /^[0-9a-fA-F]{24}$/.test(orderId);
    if (!isValidOrderId) {
      console.error('Invalid orderId format:', orderId);
      return NextResponse.json(
        { error: 'Ungültige Bestellungs-ID' },
        { status: 400 }
      );
    }

    // Verify order exists in database
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return NextResponse.json(
        { error: 'Bestellung nicht gefunden' },
        { status: 404 }
      );
    }

    // Create payment description for bank statement
    const tableInfo = tableNumber ? `Tisch ${tableNumber}` : 'Bestellung';
    const statementSuffix = tableNumber ? `TISCH${tableNumber}` : 'ORDER';

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

    let paymentIntent;
    let isDirectPayment = false;
    
    // Prüfe ob Restaurant Stripe Connect eingerichtet hat
    if (!restaurant.stripeAccountId || !restaurant.stripeOnboardingCompleted) {
      console.warn(`Restaurant ${restaurantId} hat kein vollständiges Stripe Connect. Verwende direktes Payment.`);
      
      // FALLBACK: Erstelle normales Payment Intent ohne Connect
      // Das Geld geht erstmal an Oriido und muss manuell überwiesen werden
      isDirectPayment = true;
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Betrag in Cents
        currency: currency,
        payment_method_types: ['card'],
        description: `${tableInfo} bei ${restaurant.name}`,
        statement_descriptor_suffix: statementSuffix,
        metadata: {
          orderId: orderId,
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          tableNumber: tableNumber?.toString() || '',
          platform: 'Oriido',
          paymentType: 'DIRECT_FALLBACK',
          note: 'Manueller Transfer erforderlich - Restaurant hat kein Stripe Connect'
        }
      });
      
      console.warn('WICHTIG: Direktzahlung erstellt. Manueller Transfer an Restaurant erforderlich!');
      
    } else {
      // NORMAL: Verwende Stripe Connect mit automatischem Transfer
      const platformFee = Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Betrag in Cents
        currency: currency,
        payment_method_types: ['card'],
        description: `${tableInfo} bei ${restaurant.name}`,
        statement_descriptor_suffix: statementSuffix,
        application_fee_amount: platformFee, // Plattformgebühr
        transfer_data: {
          destination: restaurant.stripeAccountId, // Geld geht an das Restaurant
        },
        metadata: {
          orderId: orderId,
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          tableNumber: tableNumber?.toString() || '',
          platform: 'Oriido',
          paymentType: 'STRIPE_CONNECT'
        }
      });
    }

    // Speichere Payment Intent ID in der Bestellung
    // Versuche zuerst mit der ID direkt, falls es eine MongoDB ObjectId ist
    try {
      // Prüfe ob es eine MongoDB ObjectId ist (24 Zeichen hex)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
      
      if (isObjectId) {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentIntentId: paymentIntent.id,
            paymentMethod: 'STRIPE'
          }
        });
      } else {
        // Falls es eine orderNumber ist, suche die Order danach
        const order = await prisma.order.findFirst({
          where: { orderNumber: orderId }
        });
        
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              paymentIntentId: paymentIntent.id,
              paymentMethod: 'STRIPE'
            }
          });
        } else {
          console.warn(`Order nicht gefunden: ${orderId}`);
          // Fahre trotzdem fort, da die Zahlung wichtiger ist
        }
      }
    } catch (updateError) {
      console.error('Fehler beim Update der Order:', updateError);
      // Fahre trotzdem fort, da die Zahlung wichtiger ist
    }

    const platformFee = isDirectPayment ? 0 : Math.round(amount * (PLATFORM_FEE_PERCENTAGE / 100));
    
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      platformFee: platformFee,
      restaurantAmount: amount - platformFee,
      isDirectPayment: isDirectPayment,
      warning: isDirectPayment ? 'Restaurant hat kein Stripe Connect. Zahlung erfolgt direkt an Plattform.' : null
    });
  } catch (error: any) {
    console.error('Create Payment Intent Error:', error);
    
    // Spezifische Stripe-Fehler behandeln
    if (error?.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { 
          error: 'Stripe API-Authentifizierung fehlgeschlagen. Bitte Administrator kontaktieren.',
          details: 'Stripe API key issue'
        },
        { status: 503 }
      );
    }
    
    if (error?.code === 'account_invalid') {
      return NextResponse.json(
        { 
          error: 'Das Stripe Connect Konto des Restaurants ist ungültig.',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    if (error?.message?.includes('No such account')) {
      return NextResponse.json(
        { 
          error: 'Das Stripe Connect Konto existiert nicht mehr. Bitte Restaurant kontaktieren.',
          details: error.message
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen der Zahlung',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Webhook zum Verarbeiten erfolgreicher Zahlungen
export async function PUT(req: NextRequest) {
  try {
    // Prüfe ob Stripe konfiguriert ist
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.' },
        { status: 503 }
      );
    }
    
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
      // Versuche zuerst über paymentIntentId zu finden
      let order = await prisma.order.findFirst({
        where: { paymentIntentId: paymentIntentId }
      });
      
      // Falls nicht gefunden, versuche über die Metadata
      if (!order && paymentIntent.metadata?.orderId) {
        const orderId = paymentIntent.metadata.orderId;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(orderId);
        
        if (isObjectId) {
          order = await prisma.order.findUnique({
            where: { id: orderId }
          });
        } else {
          order = await prisma.order.findFirst({
            where: { orderNumber: orderId }
          });
        }
      }

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