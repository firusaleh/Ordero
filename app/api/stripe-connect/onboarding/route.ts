import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    const body = await req.json();
    const { restaurantId } = body;

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
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'DE',
        email: restaurant.email || session.user.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        business_profile: {
          name: restaurant.name,
          url: restaurant.website,
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
  } catch (error) {
    console.error('Stripe Connect Onboarding Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Onboarding-Links' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
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