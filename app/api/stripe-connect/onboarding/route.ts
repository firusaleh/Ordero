import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

export async function POST(req: NextRequest) {
  try {
    // Prüfe ob Stripe konfiguriert ist
    if (!stripe) {
      console.error('Stripe ist nicht konfiguriert. Bitte STRIPE_SECRET_KEY in Vercel setzen.');
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.' },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const { restaurantId, country } = body;

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID erforderlich' }, { status: 400 });
    }

    // Überprüfe ob der Benutzer der Besitzer des Restaurants ist
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { owner: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 });
    }

    if (restaurant.owner.email !== session.user.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    let accountId = restaurant.stripeAccountId;

    // Erstelle ein neues Stripe Connect Konto wenn noch keines existiert
    if (!accountId) {
      const accountEmail = restaurant.email || session.user.email;
      
      // Map country codes to Stripe-supported countries
      // Default to DE for European countries, use restaurant country if supported
      const stripeCountry = country || restaurant.country || 'DE';
      
      const account = await stripe.accounts.create({
        type: 'express',
        country: stripeCountry,
        email: accountEmail || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: restaurant.name,
          url: restaurant.website || undefined,
          mcc: '5812', // Restaurant MCC Code
        },
        metadata: {
          restaurantId: restaurant.id,
          platform: 'Oriido'
        }
      });

      accountId = account.id;

      // Speichere die Stripe Account ID
      await prisma.restaurant.update({
        where: { id: restaurantId },
        data: { 
          stripeAccountId: accountId,
          stripeAccountStatus: 'restricted'
        }
      });
    }

    // Erstelle den Account Link für das Onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?stripe_connect=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings/payments?stripe_connect=success`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error: any) {
    console.error('Stripe Connect Onboarding Error:', error);
    
    // Bessere Fehlerbehandlung
    if (error?.type === 'StripeAuthenticationError') {
      return NextResponse.json(
        { error: 'Stripe API-Schlüssel ungültig. Bitte Administrator kontaktieren.' },
        { status: 503 }
      );
    }
    
    if (error?.statusCode === 401) {
      return NextResponse.json(
        { error: 'Stripe Authentifizierung fehlgeschlagen. API-Keys überprüfen.' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Erstellen des Onboarding-Links',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Prüfe ob Stripe konfiguriert ist
    if (!stripe) {
      console.error('Stripe ist nicht konfiguriert. Bitte STRIPE_SECRET_KEY in Vercel setzen.');
      return NextResponse.json(
        { error: 'Stripe ist nicht konfiguriert. Bitte kontaktieren Sie den Administrator.' },
        { status: 503 }
      );
    }
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const restaurantId = searchParams.get('restaurantId');

    if (!restaurantId) {
      return NextResponse.json({ error: 'Restaurant ID erforderlich' }, { status: 400 });
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { owner: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 });
    }

    if (restaurant.owner.email !== session.user.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        connected: false,
        onboardingCompleted: false 
      });
    }

    // Hole aktuelle Account-Informationen von Stripe
    const account = await stripe.accounts.retrieve(restaurant.stripeAccountId);

    // Update lokale Datenbank mit aktuellen Stripe-Daten
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingCompleted: account.charges_enabled && account.details_submitted,
        stripeAccountStatus: account.charges_enabled ? 'enabled' : 
                            account.details_submitted ? 'complete' : 'restricted'
      }
    });

    return NextResponse.json({
      connected: true,
      onboardingCompleted: account.charges_enabled && account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      accountId: account.id
    });
  } catch (error) {
    console.error('Stripe Connect Status Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen des Account-Status' },
      { status: 500 }
    );
  }
}