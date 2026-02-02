import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

/**
 * Registriert Apple Pay Domains für ein Stripe Connect Account
 * Dies ermöglicht Apple Pay Zahlungen auf der Oriido Plattform
 */
export async function registerApplePayDomains(stripeAccountId: string): Promise<void> {
  const domains = [
    'oriido.com',
    'www.oriido.com'
  ];

  console.log(`🍎 Registriere Apple Pay Domains für Account: ${stripeAccountId}`);

  for (const domainName of domains) {
    try {
      // Prüfe ob Domain bereits registriert ist
      const existingDomains = await stripe.applePayDomains.list(
        { limit: 100 },
        { stripeAccount: stripeAccountId }
      );

      const domainExists = existingDomains.data.some(
        domain => domain.domain_name === domainName
      );

      if (domainExists) {
        console.log(`✓ Domain ${domainName} bereits registriert`);
        continue;
      }

      // Registriere neue Domain
      const domain = await stripe.applePayDomains.create(
        { domain_name: domainName },
        { stripeAccount: stripeAccountId }
      );

      console.log(`✅ Apple Pay Domain registriert: ${domainName} (ID: ${domain.id})`);
    } catch (error: any) {
      // Ignoriere Fehler wenn Domain bereits existiert
      if (error?.code === 'apple_pay_domain_duplicate') {
        console.log(`ℹ️ Domain ${domainName} bereits registriert (duplicate)`);
        continue;
      }

      console.error(`❌ Fehler beim Registrieren der Domain ${domainName}:`, error?.message || error);
      
      // Bei anderen Fehlern werfen wir den Fehler nicht weiter,
      // damit der Onboarding-Prozess nicht unterbrochen wird
    }
  }
}

/**
 * Entfernt Apple Pay Domains von einem Stripe Connect Account
 * (für Cleanup bei Account-Löschung)
 */
export async function unregisterApplePayDomains(stripeAccountId: string): Promise<void> {
  try {
    console.log(`🗑️ Entferne Apple Pay Domains für Account: ${stripeAccountId}`);
    
    const domains = await stripe.applePayDomains.list(
      { limit: 100 },
      { stripeAccount: stripeAccountId }
    );

    for (const domain of domains.data) {
      try {
        await stripe.applePayDomains.del(
          domain.id,
          { stripeAccount: stripeAccountId }
        );
        console.log(`✓ Domain ${domain.domain_name} entfernt`);
      } catch (error) {
        console.error(`Fehler beim Entfernen der Domain ${domain.domain_name}:`, error);
      }
    }
  } catch (error) {
    console.error('Fehler beim Entfernen der Apple Pay Domains:', error);
  }
}