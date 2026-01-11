import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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

export async function POST(req: NextRequest) {
  try {
    // Prüfe ob Stripe konfiguriert ist
    if (!stripe) {
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
    const { restaurantId } = body;

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
      return NextResponse.json({ error: 'Stripe Connect nicht eingerichtet' }, { status: 400 });
    }

    // Erstelle einen Login-Link für das Stripe Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(restaurant.stripeAccountId);

    return NextResponse.json({ url: loginLink.url });
  } catch (error) {
    console.error('Stripe Dashboard Link Error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Dashboard-Links' },
      { status: 500 }
    );
  }
}