import crypto from 'crypto'

// PayTabs Konfiguration
export const PAYTABS_CONFIG = {
  profileId: process.env.PAYTABS_PROFILE_ID || '',
  serverKey: process.env.PAYTABS_SERVER_KEY || '',
  clientKey: process.env.PAYTABS_CLIENT_KEY || '',
  baseUrl: process.env.PAYTABS_BASE_URL || 'https://secure.paytabs.sa',
  currency: 'JOD', // Jordanischer Dinar
  region: 'JOR',
}

// Prüfe ob PayTabs konfiguriert ist
export const isPayTabsConfigured = () => {
  return !!(
    PAYTABS_CONFIG.profileId &&
    PAYTABS_CONFIG.serverKey &&
    PAYTABS_CONFIG.profileId !== 'your_profile_id' &&
    PAYTABS_CONFIG.serverKey !== 'your_server_key'
  )
}

// PayTabs API Headers
export const getPayTabsHeaders = () => ({
  'Authorization': PAYTABS_CONFIG.serverKey,
  'Content-Type': 'application/json',
})

// Signature Verification
export const verifyPayTabsSignature = (
  payload: any,
  signature: string
): boolean => {
  const signatureFields = [
    payload.profile_id,
    payload.tran_ref,
    payload.tran_type,
    payload.tran_class,
    payload.cart_id,
    payload.cart_description,
    payload.cart_currency,
    payload.cart_amount,
    PAYTABS_CONFIG.serverKey
  ].join('')
  
  const hash = crypto
    .createHash('sha256')
    .update(signatureFields)
    .digest('hex')
  
  return hash === signature
}

// PayTabs Payment Request Interface
export interface PayTabsPaymentRequest {
  profile_id: string
  tran_type: 'sale' | 'auth'
  tran_class: 'ecom' | 'moto' | 'cont'
  cart_id: string
  cart_currency: string
  cart_amount: number
  cart_description: string
  paypage_lang: 'ar' | 'en'
  customer_details: {
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
    name?: string
    email?: string
    phone?: string
    street1?: string
    city?: string
    state?: string
    country?: string
    zip?: string
  }
  callback?: string
  return?: string
}

// Erstelle Payment Page
export async function createPaymentPage(
  orderData: {
    orderId: string
    amount: number
    description: string
    customerName: string
    customerEmail: string
    customerPhone: string
    returnUrl: string
    callbackUrl: string
  }
): Promise<{ paymentUrl: string; tranRef: string } | null> {
  if (!isPayTabsConfigured()) {
    console.error('PayTabs ist nicht konfiguriert')
    return null
  }

  const payload: PayTabsPaymentRequest = {
    profile_id: PAYTABS_CONFIG.profileId,
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: orderData.orderId,
    cart_currency: PAYTABS_CONFIG.currency,
    cart_amount: orderData.amount,
    cart_description: orderData.description,
    paypage_lang: 'ar', // Arabisch für Jordanien
    customer_details: {
      name: orderData.customerName,
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      country: 'JO',
    },
    callback: orderData.callbackUrl,
    return: orderData.returnUrl,
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/payment/request`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (data.redirect_url && data.tran_ref) {
      return {
        paymentUrl: data.redirect_url,
        tranRef: data.tran_ref,
      }
    }

    console.error('PayTabs Payment Page Fehler:', data)
    return null
  } catch (error) {
    console.error('PayTabs API Fehler:', error)
    return null
  }
}

// Transaktion abfragen
export async function queryTransaction(tranRef: string) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/payment/query`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        tran_ref: tranRef,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('PayTabs Query Fehler:', error)
    return null
  }
}

// Rückerstattung
export async function refundTransaction(
  tranRef: string,
  amount: number,
  reason: string
) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/payment/request`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        tran_type: 'refund',
        tran_class: 'ecom',
        cart_id: `refund_${tranRef}`,
        cart_currency: PAYTABS_CONFIG.currency,
        cart_amount: amount,
        cart_description: reason,
        tran_ref: tranRef,
      }),
    })

    return await response.json()
  } catch (error) {
    console.error('PayTabs Refund Fehler:', error)
    return null
  }
}

// Payment Methods für Jordanien
export const PAYTABS_PAYMENT_METHODS = {
  CARD: 'creditcard',
  MADA: 'mada', // Saudi, aber auch in Jordanien verfügbar
  APPLEPAY: 'applepay',
  STC_PAY: 'stcpay',
  AMAN: 'aman', // Ägypten & Jordanien
  URPAY: 'urpay',
  VALU: 'valu',
  UNIONPAY: 'unionpay',
}

// Währungen für verschiedene Länder
export const PAYTABS_CURRENCIES = {
  JOR: 'JOD', // Jordanien
  SAU: 'SAR', // Saudi-Arabien
  UAE: 'AED', // VAE
  EGY: 'EGP', // Ägypten
  KWT: 'KWD', // Kuwait
  BHR: 'BHD', // Bahrain
  OMN: 'OMR', // Oman
  QAT: 'QAR', // Katar
  LBN: 'LBP', // Libanon
}