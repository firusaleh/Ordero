import Stripe from 'stripe'

// Stripe nur initialisieren wenn API Key vorhanden und kein Platzhalter
const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const isValidKey = stripeSecretKey && 
  stripeSecretKey !== 'sk_test_...' && 
  stripeSecretKey.startsWith('sk_')

export const stripe = isValidKey 
  ? new Stripe(stripeSecretKey!, {
      apiVersion: '2024-11-20.acacia' as any,
      typescript: true,
    })
  : null as any

// Aktuelle Preismodelle - nur noch länderbasiert
export const PRICING_MODELS = {
  // Deutschland
  DE_PAY_PER_ORDER: {
    name: 'Pay-per-Order',
    pricePerOrder: 0.45,
    setupFee: 250,
    currency: 'EUR',
  },
  DE_MONTHLY: {
    name: 'Monatlich',
    monthlyPrice: 279,
    setupFee: 250,
    currency: 'EUR',
  },
  DE_YEARLY: {
    name: 'Jährlich',
    yearlyPrice: 2150,
    setupFee: 250,
    currency: 'EUR',
  },
  // Jordanien
  JO_PAY_PER_ORDER: {
    name: 'Pay-per-Order',
    pricePerOrder: 0.10,
    setupFee: 0,
    currency: 'JOD',
  },
} as const

export type PricingModel = keyof typeof PRICING_MODELS

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