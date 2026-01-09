import Stripe from 'stripe'

// Stripe nur initialisieren wenn API Key vorhanden und kein Platzhalter
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const isValidKey = stripeSecretKey && 
  stripeSecretKey !== 'sk_test_...' && 
  stripeSecretKey.startsWith('sk_')

export const stripe = isValidKey 
  ? new Stripe(stripeSecretKey!, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  : null as any

// Subscription Preise
export const PRICES = {
  STANDARD: process.env.STRIPE_STANDARD_PRICE_ID || 'price_standard',
  PREMIUM: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
} as const

// Subscription Features
export const SUBSCRIPTION_FEATURES = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      '50 Bestellungen pro Monat',
      '1 Benutzer',
      'Basis-Statistiken',
      'E-Mail Support',
    ],
    limits: {
      ordersPerMonth: 50,
      users: 1,
      menuItems: 20,
      tables: 5,
    },
  },
  STANDARD: {
    name: 'Standard',
    price: 29,
    priceId: PRICES.STANDARD,
    features: [
      'Unbegrenzte Bestellungen',
      'Bis zu 5 Benutzer',
      'Erweiterte Statistiken',
      'Priority Support',
      'Kassensystem-Integration',
      'Eigenes Branding',
    ],
    limits: {
      ordersPerMonth: -1, // unbegrenzt
      users: 5,
      menuItems: -1,
      tables: -1,
    },
  },
  PREMIUM: {
    name: 'Premium',
    price: 79,
    priceId: PRICES.PREMIUM,
    features: [
      'Alles aus Standard',
      'Unbegrenzte Benutzer',
      'API-Zugang',
      'Multi-Restaurant Support',
      'Dedizierter Account Manager',
      'Custom Features',
      'White-Label Option',
    ],
    limits: {
      ordersPerMonth: -1,
      users: -1,
      menuItems: -1,
      tables: -1,
      restaurants: -1,
    },
  },
} as const

export type SubscriptionTier = keyof typeof SUBSCRIPTION_FEATURES

// Helper Funktionen
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string
  priceId: string
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}) {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card', 'sepa_debit'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    locale: 'de',
  }

  if (customerId) {
    sessionParams.customer = customerId
  } else {
    sessionParams.customer_creation = 'always'
  }

  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.checkout.sessions.create(sessionParams)
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: 'de',
  })
}

export async function getSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'latest_invoice.payment_intent'],
  })
}

export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

export async function createCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string
  name: string
  metadata?: Record<string, string>
}) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.customers.create({
    email,
    name,
    metadata,
  })
}

export async function getCustomer(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.customers.retrieve(customerId, {
    expand: ['subscriptions', 'default_source'],
  })
}

export async function updateCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.customers.update(customerId, params)
}

// Webhook Verification
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// Usage Metering für nutzungsbasierte Abrechnung
export async function reportUsage({
  subscriptionItemId,
  quantity,
  timestamp = Math.floor(Date.now() / 1000),
}: {
  subscriptionItemId: string
  quantity: number
  timestamp?: number
}) {
  if (!stripe) {
    throw new Error('Stripe ist nicht konfiguriert. Bitte API Key in .env.local setzen.')
  }
  return stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp,
    action: 'increment',
  })
}