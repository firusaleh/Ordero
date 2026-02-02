import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { registerApplePayDomains } from '@/lib/stripe/register-apple-pay-domains';

/**
 * Admin-Endpoint zum Registrieren von Apple Pay Domains für ALLE Restaurants
 * Nur für Administratoren zugänglich
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Überprüfe ob der Benutzer Admin ist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Administratoren haben Zugriff' }, { status: 403 });
    }

    // Hole alle Restaurants mit abgeschlossenem Stripe Connect
    const restaurants = await prisma.restaurant.findMany({
      where: {
        stripeAccountId: { not: null },
        stripeOnboardingCompleted: true
      },
      select: {
        id: true,
        name: true,
        stripeAccountId: true
      }
    });

    console.log(`🍎 Registriere Apple Pay für ${restaurants.length} Restaurants`);

    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const restaurant of restaurants) {
      try {
        if (!restaurant.stripeAccountId) continue;
        
        console.log(`Registriere für: ${restaurant.name}`);
        await registerApplePayDomains(restaurant.stripeAccountId);
        
        results.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          success: true,
          message: 'Erfolgreich registriert'
        });
        successCount++;
      } catch (error: any) {
        console.error(`Fehler bei ${restaurant.name}:`, error?.message);
        results.push({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          success: false,
          error: error?.message || 'Unbekannter Fehler'
        });
        errorCount++;
      }
    }

    console.log(`✅ Abgeschlossen: ${successCount} erfolgreich, ${errorCount} Fehler`);

    return NextResponse.json({
      totalRestaurants: restaurants.length,
      successCount,
      errorCount,
      results
    });

  } catch (error: any) {
    console.error('Fehler beim Batch-Registrieren der Apple Pay Domains:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Batch-Registrieren',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}

/**
 * GET Endpoint zum Abrufen des Status aller Restaurants
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
    }

    // Überprüfe ob der Benutzer Admin ist
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nur Administratoren haben Zugriff' }, { status: 403 });
    }

    // Hole alle Restaurants mit ihrem Stripe-Status
    const restaurants = await prisma.restaurant.findMany({
      select: {
        id: true,
        name: true,
        stripeAccountId: true,
        stripeOnboardingCompleted: true,
        stripeChargesEnabled: true,
        country: true
      },
      orderBy: { name: 'asc' }
    });

    const stats = {
      total: restaurants.length,
      withStripeAccount: restaurants.filter(r => r.stripeAccountId).length,
      onboardingComplete: restaurants.filter(r => r.stripeOnboardingCompleted).length,
      chargesEnabled: restaurants.filter(r => r.stripeChargesEnabled).length,
      readyForApplePay: restaurants.filter(r => 
        r.stripeAccountId && r.stripeOnboardingCompleted && r.stripeChargesEnabled
      ).length
    };

    return NextResponse.json({
      stats,
      restaurants: restaurants.map(r => ({
        id: r.id,
        name: r.name,
        country: r.country,
        hasStripeAccount: !!r.stripeAccountId,
        onboardingComplete: r.stripeOnboardingCompleted || false,
        chargesEnabled: r.stripeChargesEnabled || false,
        readyForApplePay: !!(r.stripeAccountId && r.stripeOnboardingCompleted && r.stripeChargesEnabled)
      }))
    });

  } catch (error: any) {
    console.error('Fehler beim Abrufen des Restaurant-Status:', error);
    return NextResponse.json(
      { 
        error: 'Fehler beim Abrufen des Status',
        details: error?.message || 'Unbekannter Fehler'
      },
      { status: 500 }
    );
  }
}