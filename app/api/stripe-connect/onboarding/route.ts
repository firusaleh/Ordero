import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { registerApplePayDomains } from '@/lib/stripe/register-apple-pay-domains';

// Prüfe ob Stripe konfiguriert ist
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const isValidKey = stripeSecretKey && 
  stripeSecretKey !== 'sk_test_...' && 
  stripeSecretKey.startsWith('sk_');

if (!isValidKey) {
  console.error('STRIPE_SECRET_KEY ist nicht in Vercel konfiguriert oder ungültig.');
  console.error('Bitte füge STRIPE_SECRET_KEY in Vercel Settings → Environment Variables hinzu');
  console.error('Verwende diesen Test-Key: sk_test_51SnM1lFKsQG9Heb2eSepCsK4b4NIEp6KmqolVcySX2kNB0qHVPqZFnoUNsuWu6ufGM5gQ9jV6RItqMJJumSrqrX700Q5hLx86m');
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
        { 
          error: 'Stripe ist nicht konfiguriert. Bitte fügen Sie STRIPE_SECRET_KEY in Vercel Environment Variables hinzu.',
          details: 'Siehe VERCEL_STRIPE_SETUP.md für Anleitung',
          missingKey: 'STRIPE_SECRET_KEY' 
        },
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
    let accountExists = false;

    // Prüfe ob der gespeicherte Account noch existiert
    if (accountId) {
      try {
        await stripe.accounts.retrieve(accountId);
        accountExists = true;
      } catch (error: any) {
        // Account existiert nicht oder kein Zugriff (z.B. Test-Account mit Live-Key)
        if (error.code === 'resource_missing' || 
            error.statusCode === 404 ||
            error.code === 'account_invalid' ||
            error.raw?.message?.includes('does not have access to account') ||
            error.raw?.message?.includes('does not exist')) {
          
          console.log('Stripe Account nicht zugreifbar, erstelle neuen. Fehler:', error.message);
          accountExists = false;
          
          // Lösche die ungültige Account ID
          await prisma.restaurant.update({
            where: { id: restaurantId },
            data: { 
              stripeAccountId: null,
              stripeAccountStatus: null,
              stripeChargesEnabled: false,
              stripePayoutsEnabled: false,
              stripeDetailsSubmitted: false,
              stripeOnboardingCompleted: false
            }
          });
          accountId = null;
        } else {
          // Unerwarteter Fehler
          console.error('Unerwarteter Fehler beim Abrufen des Stripe Accounts:', error);
          throw error;
        }
      }
    }

    // Erstelle ein neues Stripe Connect Konto wenn keines existiert oder das alte gelöscht wurde
    if (!accountId || !accountExists) {
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

      // Speichere die neue Stripe Account ID
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
        { 
          error: 'Stripe ist nicht konfiguriert. Bitte fügen Sie STRIPE_SECRET_KEY in Vercel Environment Variables hinzu.',
          details: 'Siehe VERCEL_STRIPE_SETUP.md für Anleitung',
          missingKey: 'STRIPE_SECRET_KEY' 
        },
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
    let account;
    try {
      account = await stripe.accounts.retrieve(restaurant.stripeAccountId);
    } catch (error: any) {
      // Account existiert nicht oder kein Zugriff (z.B. Test-Account mit Live-Key)
      if (error.code === 'resource_missing' || 
          error.statusCode === 404 ||
          error.code === 'account_invalid' ||
          error.raw?.message?.includes('does not have access to account') ||
          error.raw?.message?.includes('does not exist')) {
        
        console.log('Stripe Account nicht zugreifbar beim Status-Check:', error.message);
        
        // Account existiert nicht mehr, lösche die ungültige ID
        await prisma.restaurant.update({
          where: { id: restaurantId },
          data: { 
            stripeAccountId: null,
            stripeAccountStatus: null,
            stripeChargesEnabled: false,
            stripePayoutsEnabled: false,
            stripeDetailsSubmitted: false,
            stripeOnboardingCompleted: false
          }
        });
        return NextResponse.json({ 
          connected: false,
          onboardingCompleted: false,
          accountDeleted: true 
        });
      } else {
        console.error('Unerwarteter Fehler beim Status-Check:', error);
        throw error;
      }
    }

    // Update lokale Datenbank mit aktuellen Stripe-Daten
    const wasOnboardingCompleted = restaurant.stripeOnboardingCompleted;
    const isNowComplete = account.charges_enabled && account.details_submitted;
    
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data: {
        stripeChargesEnabled: account.charges_enabled,
        stripePayoutsEnabled: account.payouts_enabled,
        stripeDetailsSubmitted: account.details_submitted,
        stripeOnboardingCompleted: isNowComplete,
        stripeAccountStatus: account.charges_enabled ? 'enabled' : 
                            account.details_submitted ? 'complete' : 'restricted'
      }
    });

    // Registriere Apple Pay Domains wenn Onboarding abgeschlossen wurde
    if (!wasOnboardingCompleted && isNowComplete) {
      console.log('🍎 Onboarding abgeschlossen - Registriere Apple Pay Domains');
      try {
        await registerApplePayDomains(restaurant.stripeAccountId);
        console.log('✅ Apple Pay Domains erfolgreich registriert');
      } catch (error) {
        console.error('⚠️ Fehler beim Registrieren der Apple Pay Domains:', error);
        // Fehler nicht weiterwerfen, da es das Onboarding nicht blockieren soll
      }
    }

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