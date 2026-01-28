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

// Plattformgebühr als Fixbetrag in Cents
const PLATFORM_FEE_CENTS = 45; // 0.45 EUR Fixgebühr pro Bestellung

interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  variantId?: string;
  variantName?: string;
  extraIds: string[];
  extraNames: string[];
  extraPrices: number[];
  notes?: string;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  tax: number;
  tip: number;
}

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
    const { restaurantId, tableId, tableNumber, amount, currency = 'eur', cartData } = body as {
      restaurantId: string;
      tableId?: string;
      tableNumber?: number;
      amount: number; // Amount in cents
      currency?: string;
      cartData: CartData;
    };

    if (!restaurantId || !amount || !cartData) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Parameter (restaurantId, amount, cartData)' },
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

    // Create payment description for bank statement
    const tableInfo = tableNumber ? `Tisch ${tableNumber}` : 'Bestellung';
    const statementSuffix = tableNumber ? `T${tableNumber}` : '';
    
    // Clean restaurant name for statement descriptor (max 10 chars for suffix)
    const cleanRestaurantName = restaurant.name
      .replace(/[^a-zA-Z0-9\s]/g, '') // Nur Buchstaben, Zahlen, Leerzeichen
      .replace(/\s+/g, ' ') // Multiple spaces zu einem
      .trim()
      .substring(0, 10);

    // Calculate totals
    const subtotal = cartData.subtotal;
    const tax = cartData.tax;
    const tip = cartData.tip || 0;
    const total = amount / 100; // Convert cents to euros for storage

    // Create PendingPayment record FIRST (before Stripe call)
    const pendingPayment = await prisma.pendingPayment.create({
      data: {
        restaurantId,
        tableId: tableId || null,
        tableNumber: tableNumber || null,
        items: cartData.items as any, // Store cart items as JSON
        subtotal,
        tax,
        tip,
        total,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // Expires in 1 hour
      }
    });

    let paymentIntent;
    let isDirectPayment = false;

    // Prüfe ob Restaurant Stripe Connect eingerichtet hat
    if (!restaurant.stripeAccountId || !restaurant.stripeOnboardingCompleted) {
      console.warn(`Restaurant ${restaurantId} hat kein vollständiges Stripe Connect. Verwende direktes Payment.`);

      // FALLBACK: Erstelle normales Payment Intent ohne Connect
      isDirectPayment = true;

      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Betrag in Cents
        currency: currency,
        automatic_payment_methods: { enabled: true }, // Enables Apple Pay, Google Pay, Cards, etc.
        description: `${tableInfo} bei ${restaurant.name}`,
        // Versuche Restaurant Name als Suffix, falls Platform Descriptor "Oriido" ist
        statement_descriptor_suffix: cleanRestaurantName,
        metadata: {
          pendingPaymentId: pendingPayment.id,
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
      // Fixe Plattformgebühr von 0.45 EUR (45 Cents) pro Bestellung
      const platformFee = PLATFORM_FEE_CENTS;
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: amount, // Betrag in Cents
        currency: currency,
        automatic_payment_methods: { enabled: true }, // Enables Apple Pay, Google Pay, Cards, etc.
        description: `${tableInfo} bei ${restaurant.name}`,
        // Versuche Restaurant Name als Suffix, falls Platform Descriptor "Oriido" ist
        statement_descriptor_suffix: cleanRestaurantName,
        application_fee_amount: platformFee, // Fixe Plattformgebühr von 0.45 EUR
        transfer_data: {
          destination: restaurant.stripeAccountId, // Geld geht an das Restaurant
        },
        metadata: {
          pendingPaymentId: pendingPayment.id,
          restaurantId: restaurantId,
          restaurantName: restaurant.name,
          tableNumber: tableNumber?.toString() || '',
          platform: 'Oriido',
          paymentType: 'STRIPE_CONNECT',
          platformFee: `${platformFee} cents`
        }
      });
    }

    // Update PendingPayment with paymentIntentId
    await prisma.pendingPayment.update({
      where: { id: pendingPayment.id },
      data: { paymentIntentId: paymentIntent.id }
    });

    // Bei Direktzahlung keine Gebühr, sonst fixe 0.45 EUR
    const platformFee = isDirectPayment ? 0 : PLATFORM_FEE_CENTS;
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      pendingPaymentId: pendingPayment.id,
      paymentIntentId: paymentIntent.id,
      amount: amount,
      platformFee: platformFee,
      platformFeeEUR: platformFee / 100, // Gebühr in EUR für Frontend-Anzeige
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
