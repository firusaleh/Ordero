import Stripe from 'stripe'
import { 
  PaymentProvider, 
  PaymentResult, 
  RefundResult, 
  CreatePaymentIntentParams, 
  PaymentConfig,
  PaymentMethod,
  PROVIDER_COUNTRIES,
  PROVIDER_CURRENCIES
} from '../types'

export class StripeProvider implements PaymentProvider {
  public readonly name = 'Stripe'
  private stripe: Stripe
  private config: PaymentConfig

  constructor(config: PaymentConfig) {
    this.config = {
      ...config,
      features: {
        applePay: true,
        googlePay: true,
        ...config.features
      }
    }
    this.stripe = new Stripe(config.secretKey)
  }

  /**
   * Erstellt ein Payment Intent für Stripe
   */
  async processPayment(params: CreatePaymentIntentParams): Promise<PaymentResult> {
    try {
      const totalAmount = params.amount + (params.tip || 0)
      
      // Stripe erwartet Centbeträge
      const amountInCents = Math.round(totalAmount * 100)
      
      // Erstelle Statement Descriptor mit Restaurant Name
      // Stripe limitiert auf 22 Zeichen, nur erlaubte Zeichen (A-Z, a-z, 0-9, space, -, .)
      let statementDescriptor = 'Oriido Payment'
      if (params.restaurantName) {
        // Entferne alle nicht erlaubten Zeichen für Stripe
        const cleanName = params.restaurantName
          .replace(/[^a-zA-Z0-9\s\-\.]/g, '') // Nur erlaubte Zeichen
          .trim()
          .substring(0, 12) // Kürze auf 12 Zeichen für " by Oriido" (10 Zeichen)
        
        statementDescriptor = `${cleanName} by Oriido`.substring(0, 22)
        
        console.log('Statement Descriptor:', statementDescriptor, 'from:', params.restaurantName)
      }
      
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: params.currency.toLowerCase(),
        statement_descriptor: statementDescriptor,
        statement_descriptor_suffix: params.metadata?.tableNumber ? `T${params.metadata.tableNumber}` : undefined,
        description: `Order ${params.orderId} at ${params.restaurantName || 'Restaurant'}`,
        metadata: {
          orderId: params.orderId,
          restaurantId: params.restaurantId,
          restaurantName: params.restaurantName || '',
          baseAmount: params.amount.toString(),
          tipAmount: (params.tip || 0).toString(),
          ...params.metadata
        },
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always'
        }
      }

      // Füge Customer hinzu falls vorhanden
      if (params.customerId) {
        paymentIntentParams.customer = params.customerId
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams)

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret || undefined
      }
    } catch (error) {
      console.error('Stripe Payment Intent Creation Failed:', error)
      
      let errorMessage = 'Zahlungs-Intent konnte nicht erstellt werden'
      if (error instanceof Stripe.errors.StripeError) {
        switch (error.code) {
          case 'amount_too_small':
            errorMessage = 'Der Betrag ist zu gering für eine Stripe-Zahlung'
            break
          case 'currency_not_supported':
            errorMessage = 'Diese Währung wird nicht unterstützt'
            break
          case 'invalid_request_error':
            errorMessage = 'Ungültige Zahlungsanfrage'
            break
          default:
            errorMessage = error.message || errorMessage
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Bestätigt eine Zahlung (wird automatisch vom Frontend gemacht)
   */
  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          paymentIntentId: paymentIntent.id
        }
      } else {
        return {
          success: false,
          error: `Zahlung noch nicht abgeschlossen. Status: ${paymentIntent.status}`
        }
      }
    } catch (error) {
      console.error('Stripe Payment Confirmation Failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zahlungsbestätigung fehlgeschlagen'
      }
    }
  }

  /**
   * Erstellt eine Rückerstattung
   */
  async refund(paymentIntentId: string, amount?: number): Promise<RefundResult> {
    try {
      // Hole das Payment Intent um die Charge ID zu bekommen
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status !== 'succeeded') {
        return {
          success: false,
          error: 'Zahlung wurde noch nicht erfolgreich abgeschlossen'
        }
      }

      const charges = (paymentIntent as any).charges?.data
      if (!charges || charges.length === 0) {
        return {
          success: false,
          error: 'Keine Charges für diese Zahlung gefunden'
        }
      }

      const charge = charges[0]
      
      const refundParams: Stripe.RefundCreateParams = {
        charge: charge.id,
        metadata: {
          orderId: paymentIntent.metadata.orderId || '',
          restaurantId: paymentIntent.metadata.restaurantId || ''
        }
      }

      // Teilrückerstattung wenn Betrag angegeben
      if (amount && amount > 0) {
        const amountInCents = Math.round(amount * 100)
        if (amountInCents < charge.amount) {
          refundParams.amount = amountInCents
        }
      }

      const refund = await this.stripe.refunds.create(refundParams)

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount ? refund.amount / 100 : undefined
      }
    } catch (error) {
      console.error('Stripe Refund Failed:', error)
      
      let errorMessage = 'Rückerstattung fehlgeschlagen'
      if (error instanceof Stripe.errors.StripeError) {
        switch (error.code) {
          case 'charge_already_refunded':
            errorMessage = 'Diese Zahlung wurde bereits vollständig erstattet'
            break
          case 'insufficient_funds':
            errorMessage = 'Nicht genügend Guthaben für die Rückerstattung'
            break
          default:
            errorMessage = error.message || errorMessage
        }
      }

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /**
   * Erstellt einen Stripe Customer
   */
  async createCustomer(email: string, name?: string): Promise<{ customerId: string }> {
    try {
      const customerParams: Stripe.CustomerCreateParams = {
        email
      }

      if (name) {
        customerParams.name = name
      }

      const customer = await this.stripe.customers.create(customerParams)
      
      return {
        customerId: customer.id
      }
    } catch (error) {
      console.error('Stripe Customer Creation Failed:', error)
      throw new Error('Kunde konnte nicht erstellt werden')
    }
  }

  /**
   * Prüft ob Stripe in einem Land/Währung verfügbar ist
   */
  isAvailable(country: string, currency: string): boolean {
    return PROVIDER_COUNTRIES.stripe.includes(country) && 
           PROVIDER_CURRENCIES.stripe.includes(currency)
  }

  /**
   * Gibt unterstützte Zahlungsmethoden für ein Land zurück
   */
  getSupportedPaymentMethods(country: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [
      { id: 'card', type: 'card' }
    ]

    // Apple Pay - verfügbar in unterstützten Ländern
    if (this.config.features?.applePay && this.isApplePayAvailable(country)) {
      methods.push({ id: 'apple_pay', type: 'apple_pay', wallet: 'apple_pay' })
    }

    // Google Pay - verfügbar in den meisten Ländern
    if (this.config.features?.googlePay && this.isGooglePayAvailable(country)) {
      methods.push({ id: 'google_pay', type: 'google_pay', wallet: 'google_pay' })
    }

    // SEPA für EU-Länder
    if (this.isSEPAAvailable(country)) {
      methods.push({ id: 'sepa_debit', type: 'sepa' })
    }

    return methods
  }

  /**
   * Prüft Apple Pay Verfügbarkeit
   */
  private isApplePayAvailable(country: string): boolean {
    // Apple Pay ist in den meisten entwickelten Ländern verfügbar
    const applePayCountries = [
      'US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 
      'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'CZ', 'HU', 'JP', 'SG', 'HK'
    ]
    return applePayCountries.includes(country)
  }

  /**
   * Prüft Google Pay Verfügbarkeit
   */
  private isGooglePayAvailable(country: string): boolean {
    // Google Pay ist in mehr Ländern verfügbar als Apple Pay
    const googlePayCountries = [
      'US', 'CA', 'GB', 'AU', 'NZ', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 
      'CH', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 
      'GR', 'JP', 'SG', 'HK', 'MY', 'TH', 'IN', 'MX', 'BR'
    ]
    return googlePayCountries.includes(country)
  }

  /**
   * Prüft SEPA Verfügbarkeit (EU + einige weitere)
   */
  private isSEPAAvailable(country: string): boolean {
    const sepaCountries = [
      'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'LU', 
      'GR', 'EE', 'LV', 'LT', 'SI', 'SK', 'CY', 'MT', 'HR', 'BG', 'RO',
      'PL', 'CZ', 'HU', 'SE', 'DK', 'IS', 'NO', 'LI', 'CH', 'MC', 'SM', 'VA'
    ]
    return sepaCountries.includes(country) && this.config.currency === 'EUR'
  }

  /**
   * Hilfsmethode: Holt das Setup Intent für Karte speichern
   */
  async createSetupIntent(customerId: string): Promise<{ setupIntentId: string; clientSecret: string }> {
    try {
      const setupIntent = await this.stripe.setupIntents.create({
        customer: customerId,
        payment_method_types: ['card'],
        usage: 'off_session'
      })

      return {
        setupIntentId: setupIntent.id,
        clientSecret: setupIntent.client_secret || ''
      }
    } catch (error) {
      console.error('Stripe Setup Intent Creation Failed:', error)
      throw new Error('Setup Intent konnte nicht erstellt werden')
    }
  }

  /**
   * Hilfsmethode: Holt gespeicherte Zahlungsmethoden eines Kunden
   */
  async getCustomerPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card'
      })

      return paymentMethods.data.map(pm => ({
        id: pm.id,
        type: 'card',
        last4: pm.card?.last4,
        brand: pm.card?.brand
      }))
    } catch (error) {
      console.error('Failed to get customer payment methods:', error)
      return []
    }
  }
}