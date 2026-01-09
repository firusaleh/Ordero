// Payment Provider Types and Interfaces

export interface PaymentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  redirectUrl?: string
  error?: string
}

export interface RefundResult {
  success: boolean
  refundId?: string
  amount?: number
  error?: string
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay' | 'sepa' | 'paypal' | 'cash'
  last4?: string
  brand?: string
  wallet?: string
}

export interface CreatePaymentIntentParams {
  amount: number
  currency: string
  orderId: string
  customerId?: string
  metadata?: Record<string, string>
  restaurantId: string
  tip?: number
}

export interface PaymentProvider {
  name: string
  processPayment(params: CreatePaymentIntentParams): Promise<PaymentResult>
  confirmPayment(paymentIntentId: string): Promise<PaymentResult>
  refund(paymentIntentId: string, amount?: number): Promise<RefundResult>
  createCustomer(email: string, name?: string): Promise<{ customerId: string }>
  isAvailable(country: string, currency: string): boolean
  getSupportedPaymentMethods(country: string): PaymentMethod[]
}

export interface PaymentConfig {
  provider: 'stripe' | 'paypal' | 'paytabs' | 'razorpay'
  publicKey: string
  secretKey: string
  webhookSecret?: string
  currency: string
  country: string
  features?: {
    applePay?: boolean
    googlePay?: boolean
    saveCards?: boolean
    subscriptions?: boolean
  }
}

// Supported countries by provider
export const PROVIDER_COUNTRIES = {
  stripe: [
    'US', 'CA', 'GB', 'DE', 'FR', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 
    'FI', 'IE', 'IT', 'ES', 'PT', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'GR',
    'AU', 'NZ', 'JP', 'SG', 'HK', 'MY', 'TH', 'IN', 'MX', 'BR'
  ],
  paypal: ['*'], // Available globally
  paytabs: [
    'AE', 'SA', 'KW', 'BH', 'QA', 'OM', 'EG', 'JO', 'LB', 'IQ', 'MA', 'DZ', 'TN'
  ],
  razorpay: ['IN'],
  mercadopago: ['AR', 'BR', 'MX', 'CO', 'CL', 'PE', 'UY']
}

// Supported currencies by provider
export const PROVIDER_CURRENCIES = {
  stripe: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'INR'],
  paypal: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'],
  paytabs: ['AED', 'SAR', 'KWD', 'BHD', 'QAR', 'OMR', 'EGP', 'JOD', 'USD'],
  razorpay: ['INR'],
  mercadopago: ['ARS', 'BRL', 'MXN', 'COP', 'CLP', 'PEN', 'UYU']
}