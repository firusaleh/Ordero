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

interface PayTabsPaymentPageRequest {
  profile_id: string
  tran_type: 'sale' | 'auth'
  tran_class: 'ecom' | 'moto'
  cart_id: string
  cart_currency: string
  cart_amount: number
  cart_description: string
  customer_details?: {
    name: string
    email: string
    phone: string
    street1?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
  shipping_details?: {
    name: string
    email: string
    phone: string
    street1?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
  callback?: string
  return?: string
  hide_shipping?: boolean
  framed?: boolean
  framed_return_top?: boolean
  framed_return_parent?: boolean
}

interface PayTabsPaymentPageResponse {
  tran_ref: string
  cart_id: string
  cart_description: string
  cart_currency: string
  cart_amount: string
  tran_currency: string
  tran_total: string
  callback: string
  return: string
  redirect_url: string
  customer_details?: {
    name: string
    email: string
    phone: string
  }
  payment_result?: {
    response_status: string
    response_code: string
    response_message: string
    transaction_time?: string
  }
  payment_info?: {
    card_type?: string
    card_scheme?: string
    payment_description?: string
  }
}

export class PayTabsProvider implements PaymentProvider {
  public readonly name = 'PayTabs'
  private config: PaymentConfig
  private apiUrl: string
  private profileId: string
  private serverKey: string

  constructor(config: PaymentConfig) {
    this.config = config
    
    // PayTabs API URLs basierend auf Region
    const region = this.getRegionFromCountry(config.country)
    this.apiUrl = this.getApiUrl(region)
    
    // PayTabs Credentials
    this.profileId = config.publicKey // Profile ID als publicKey gespeichert
    this.serverKey = config.secretKey // Server Key als secretKey gespeichert
  }

  /**
   * Erstellt eine Payment Page für PayTabs
   */
  async processPayment(params: CreatePaymentIntentParams): Promise<PaymentResult> {
    try {
      const totalAmount = params.amount + (params.tip || 0)
      
      const requestBody: PayTabsPaymentPageRequest = {
        profile_id: this.profileId,
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: params.orderId,
        cart_currency: params.currency.toUpperCase(),
        cart_amount: totalAmount,
        cart_description: `Order #${params.orderId}`,
        callback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/paytabs`,
        return: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?orderId=${params.orderId}`,
        hide_shipping: true,
        framed: false
      }

      // Füge Kundendetails hinzu falls vorhanden
      if (params.metadata?.customerEmail) {
        requestBody.customer_details = {
          name: params.metadata.customerName || 'Guest',
          email: params.metadata.customerEmail,
          phone: params.metadata.customerPhone || '',
          street1: 'N/A',
          city: this.getCityFromCountry(this.config.country),
          country: this.config.country,
          zip: '00000'
        }
      }

      const response = await fetch(`${this.apiUrl}/payment/request`, {
        method: 'POST',
        headers: {
          'Authorization': this.serverKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`PayTabs API error: ${response.statusText}`)
      }

      const data: PayTabsPaymentPageResponse = await response.json()

      if (data.redirect_url) {
        return {
          success: true,
          paymentIntentId: data.tran_ref,
          redirectUrl: data.redirect_url,
          clientSecret: data.tran_ref // Verwende tran_ref als clientSecret für spätere Referenz
        }
      } else {
        return {
          success: false,
          error: 'Keine Redirect-URL von PayTabs erhalten'
        }
      }
    } catch (error) {
      console.error('PayTabs Payment Creation Failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'PayTabs-Zahlung fehlgeschlagen'
      }
    }
  }

  /**
   * Überprüft den Status einer Zahlung
   */
  async confirmPayment(transactionRef: string): Promise<PaymentResult> {
    try {
      const response = await fetch(`${this.apiUrl}/payment/query`, {
        method: 'POST',
        headers: {
          'Authorization': this.serverKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          profile_id: this.profileId,
          tran_ref: transactionRef
        })
      })

      if (!response.ok) {
        throw new Error(`PayTabs API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.payment_result?.response_status === 'A') {
        return {
          success: true,
          paymentIntentId: transactionRef
        }
      } else {
        return {
          success: false,
          error: data.payment_result?.response_message || 'Zahlung nicht erfolgreich'
        }
      }
    } catch (error) {
      console.error('PayTabs Payment Confirmation Failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Zahlungsbestätigung fehlgeschlagen'
      }
    }
  }

  /**
   * Erstellt eine Rückerstattung
   */
  async refund(transactionRef: string, amount?: number): Promise<RefundResult> {
    try {
      const refundBody = {
        profile_id: this.profileId,
        tran_type: 'refund',
        tran_class: 'ecom',
        tran_ref: transactionRef,
        cart_id: `refund_${transactionRef}_${Date.now()}`,
        cart_currency: this.config.currency.toUpperCase(),
        cart_amount: amount || 0, // 0 für vollständige Rückerstattung
        cart_description: `Refund for ${transactionRef}`
      }

      const response = await fetch(`${this.apiUrl}/payment/request`, {
        method: 'POST',
        headers: {
          'Authorization': this.serverKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(refundBody)
      })

      if (!response.ok) {
        throw new Error(`PayTabs API error: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.tran_ref) {
        return {
          success: true,
          refundId: data.tran_ref,
          amount: amount
        }
      } else {
        return {
          success: false,
          error: data.response_message || 'Rückerstattung fehlgeschlagen'
        }
      }
    } catch (error) {
      console.error('PayTabs Refund Failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Rückerstattung fehlgeschlagen'
      }
    }
  }

  /**
   * Erstellt einen Customer (nicht direkt von PayTabs unterstützt, wird simuliert)
   */
  async createCustomer(email: string, name?: string): Promise<{ customerId: string }> {
    // PayTabs hat kein direktes Customer-Management wie Stripe
    // Wir generieren eine eigene Customer ID
    const customerId = `paytabs_customer_${email.replace('@', '_').replace('.', '_')}_${Date.now()}`
    
    return {
      customerId
    }
  }

  /**
   * Prüft ob PayTabs in einem Land/Währung verfügbar ist
   */
  isAvailable(country: string, currency: string): boolean {
    return PROVIDER_COUNTRIES.paytabs.includes(country) && 
           PROVIDER_CURRENCIES.paytabs.includes(currency)
  }

  /**
   * Gibt unterstützte Zahlungsmethoden für ein Land zurück
   */
  getSupportedPaymentMethods(country: string): PaymentMethod[] {
    const methods: PaymentMethod[] = [
      { id: 'card', type: 'card' }
    ]

    // PayTabs unterstützt Apple Pay in einigen Ländern
    if (this.isApplePayAvailable(country)) {
      methods.push({ id: 'apple_pay', type: 'apple_pay', wallet: 'apple_pay' })
    }

    // Lokale Zahlungsmethoden je nach Land
    if (country === 'SA') {
      // Saudi-Arabien: Mada, STC Pay
      methods.push({ id: 'mada', type: 'card', brand: 'mada' })
    } else if (country === 'AE') {
      // VAE: zusätzliche lokale Optionen
      methods.push({ id: 'google_pay', type: 'google_pay', wallet: 'google_pay' })
    } else if (country === 'EG') {
      // Ägypten: Fawry, etc.
      methods.push({ id: 'cash', type: 'cash' })
    }

    return methods
  }

  /**
   * Hilfsmethoden
   */
  private getRegionFromCountry(country: string): string {
    const gccCountries = ['AE', 'SA', 'KW', 'BH', 'QA', 'OM']
    const levantCountries = ['JO', 'LB', 'PS']
    const northAfricaCountries = ['EG', 'MA', 'DZ', 'TN', 'LY']
    
    if (gccCountries.includes(country)) return 'gcc'
    if (levantCountries.includes(country)) return 'levant'
    if (northAfricaCountries.includes(country)) return 'north-africa'
    return 'global'
  }

  private getApiUrl(region: string): string {
    // PayTabs hat verschiedene API-Endpunkte je nach Region
    switch (region) {
      case 'gcc':
        return 'https://secure.paytabs.sa'
      case 'levant':
        return 'https://secure.paytabs.com'
      case 'north-africa':
        return 'https://secure-egypt.paytabs.com'
      default:
        return 'https://secure-global.paytabs.com'
    }
  }

  private getCityFromCountry(country: string): string {
    const cityMap: Record<string, string> = {
      'AE': 'Dubai',
      'SA': 'Riyadh',
      'KW': 'Kuwait City',
      'BH': 'Manama',
      'QA': 'Doha',
      'OM': 'Muscat',
      'EG': 'Cairo',
      'JO': 'Amman',
      'LB': 'Beirut',
      'MA': 'Casablanca',
      'DZ': 'Algiers',
      'TN': 'Tunis'
    }
    return cityMap[country] || 'City'
  }

  private isApplePayAvailable(country: string): boolean {
    // Apple Pay ist in einigen Nahost-Ländern verfügbar
    const applePayCountries = ['AE', 'SA', 'QA', 'BH', 'KW', 'JO']
    return applePayCountries.includes(country)
  }

  /**
   * Hilfsmethode: Verifiziert einen Webhook von PayTabs
   */
  async verifyWebhook(signature: string, payload: any): Promise<boolean> {
    try {
      // PayTabs verwendet eine Signatur-Verifizierung
      // Dies muss basierend auf ihrer Dokumentation implementiert werden
      const calculatedSignature = this.calculateWebhookSignature(payload)
      return signature === calculatedSignature
    } catch (error) {
      console.error('PayTabs webhook verification failed:', error)
      return false
    }
  }

  private calculateWebhookSignature(payload: any): string {
    // Implementierung basierend auf PayTabs Dokumentation
    // Normalerweise: HMAC-SHA256(serverKey, payload)
    const crypto = require('crypto')
    return crypto
      .createHmac('sha256', this.serverKey)
      .update(JSON.stringify(payload))
      .digest('hex')
  }
}