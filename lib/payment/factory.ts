import { PaymentProvider, PaymentConfig, PROVIDER_COUNTRIES, PROVIDER_CURRENCIES } from './types'
import { StripeProvider } from './providers/stripe'
// import { PayPalProvider } from './providers/paypal' // Für später
// import { PayTabsProvider } from './providers/paytabs' // Für später

export class PaymentFactory {
  private static providers: Map<string, PaymentProvider> = new Map()

  /**
   * Get the best payment provider for a country/currency combination
   */
  static async getProvider(
    country: string, 
    currency: string,
    preferredProvider?: string
  ): Promise<PaymentProvider> {
    // Check if preferred provider is available
    if (preferredProvider) {
      const provider = await this.initializeProvider(preferredProvider, country, currency)
      if (provider && provider.isAvailable(country, currency)) {
        return provider
      }
    }

    // Auto-select best provider based on country/currency
    // Priority order: Stripe -> Regional Provider -> PayPal
    
    // 1. Try Stripe first (best global coverage)
    if (PROVIDER_COUNTRIES.stripe.includes(country) && 
        PROVIDER_CURRENCIES.stripe.includes(currency)) {
      const stripe = await this.initializeProvider('stripe', country, currency)
      if (stripe) return stripe
    }

    // 2. Try regional providers
    // PayTabs for Middle East
    if (PROVIDER_COUNTRIES.paytabs.includes(country) && 
        PROVIDER_CURRENCIES.paytabs.includes(currency)) {
      // const paytabs = await this.initializeProvider('paytabs', country, currency)
      // if (paytabs) return paytabs
    }

    // Razorpay for India
    if (country === 'IN' && currency === 'INR') {
      // const razorpay = await this.initializeProvider('razorpay', country, currency)
      // if (razorpay) return razorpay
    }

    // 3. Fallback to PayPal (global coverage)
    // const paypal = await this.initializeProvider('paypal', country, currency)
    // if (paypal) return paypal

    // 4. Default to Stripe anyway (with limited features)
    const defaultProvider = await this.initializeProvider('stripe', country, currency)
    if (defaultProvider) return defaultProvider

    throw new Error(`No payment provider available for ${country}/${currency}`)
  }

  /**
   * Initialize a specific payment provider
   */
  private static async initializeProvider(
    providerName: string,
    country: string,
    currency: string
  ): Promise<PaymentProvider | null> {
    const cacheKey = `${providerName}-${country}-${currency}`
    
    // Return cached provider if exists
    if (this.providers.has(cacheKey)) {
      return this.providers.get(cacheKey)!
    }

    try {
      let provider: PaymentProvider | null = null

      switch (providerName) {
        case 'stripe':
          const config = await this.getProviderConfig('stripe', country, currency)
          if (config) {
            provider = new StripeProvider(config)
            this.providers.set(cacheKey, provider)
          }
          break

        // case 'paypal':
        //   const paypalConfig = await this.getProviderConfig('paypal', country, currency)
        //   if (paypalConfig) {
        //     provider = new PayPalProvider(paypalConfig)
        //     this.providers.set(cacheKey, provider)
        //   }
        //   break

        // Add more providers here as needed
      }

      return provider
    } catch (error) {
      console.error(`Failed to initialize ${providerName}:`, error)
      return null
    }
  }

  /**
   * Get provider configuration from environment or database
   */
  private static async getProviderConfig(
    provider: string,
    country: string,
    currency: string
  ): Promise<PaymentConfig | null> {
    // In production, this would fetch from database based on restaurant settings
    // For now, we'll use environment variables
    
    switch (provider) {
      case 'stripe':
        if (!process.env.STRIPE_SECRET_KEY) return null
        
        return {
          provider: 'stripe',
          publicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
          secretKey: process.env.STRIPE_SECRET_KEY,
          webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
          currency,
          country,
          features: {
            applePay: true,
            googlePay: true,
            saveCards: true,
            subscriptions: true
          }
        }

      // case 'paypal':
      //   if (!process.env.PAYPAL_SECRET_KEY) return null
      //   return {
      //     provider: 'paypal',
      //     publicKey: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '',
      //     secretKey: process.env.PAYPAL_SECRET_KEY,
      //     currency,
      //     country
      //   }

      default:
        return null
    }
  }

  /**
   * Get available providers for a country
   */
  static getAvailableProviders(country: string, currency: string): string[] {
    const available: string[] = []

    if (PROVIDER_COUNTRIES.stripe.includes(country) && 
        PROVIDER_CURRENCIES.stripe.includes(currency)) {
      available.push('stripe')
    }

    if (PROVIDER_COUNTRIES.paytabs.includes(country) && 
        PROVIDER_CURRENCIES.paytabs.includes(currency)) {
      available.push('paytabs')
    }

    if (country === 'IN' && currency === 'INR') {
      available.push('razorpay')
    }

    // PayPal is always available as fallback
    available.push('paypal')

    return available
  }
}