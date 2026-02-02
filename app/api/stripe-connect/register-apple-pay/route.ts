import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerApplePayDomains } from '@/lib/stripe/register-apple-pay-domains';

/**
 * Manueller Endpoint zum Registrieren von Apple Pay Domains
 * Kann verwendet werden um Apple Pay für bereits existierende Restaurants zu aktivieren
 */
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

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        error: 'Restaurant hat kein Stripe Connect Konto' 
      }, { status: 400 });
    }

    if (!restaurant.stripeOnboardingCompleted) {
      return NextResponse.json({ 
        error: 'Stripe Connect Onboarding nicht abgeschlossen' 
      }, { status: 400 });
    }

    // Registriere Apple Pay Domains
    await registerApplePayDomains(restaurant.stripeAccountId);

    return NextResponse.json({ 
      success: true,
      message: 'Apple Pay Domains erfolgreich registriert' 
    });

  } catch (error: any) {
    console.error('Fehler beim Registrieren der Apple Pay Domains:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Registrieren der Apple Pay Domains',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

/**
 * GET Endpoint zum Abrufen der registrierten Apple Pay Domains
 */
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

    // Überprüfe ob der Benutzer Admin ist oder der Besitzer des Restaurants
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { owner: true }
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant nicht gefunden' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Nur Admin oder Restaurant-Besitzer dürfen Domains sehen
    if (user.role !== 'ADMIN' && restaurant.owner.email !== session.user.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 });
    }

    if (!restaurant.stripeAccountId) {
      return NextResponse.json({ 
        domains: [],
        message: 'Kein Stripe Connect Konto vorhanden' 
      });
    }

    // Diese Funktion würde die Domains von Stripe abrufen
    // Für jetzt geben wir die erwarteten Domains zurück
    return NextResponse.json({
      domains: ['oriido.com', 'www.oriido.com'],
      stripeAccountId: restaurant.stripeAccountId,
      onboardingCompleted: restaurant.stripeOnboardingCompleted
    });

  } catch (error: any) {
    console.error('Fehler beim Abrufen der Apple Pay Domains:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Abrufen der Apple Pay Domains',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}