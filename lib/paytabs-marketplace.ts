import { PAYTABS_CONFIG, getPayTabsHeaders, isPayTabsConfigured } from './paytabs'

// PayTabs Marketplace Konfiguration
const MARKETPLACE_CONFIG = {
  platformFeePercent: parseFloat(process.env.PAYTABS_PLATFORM_FEE || '2.5'), // 2.5% Plattformgebühr
  settlementPeriod: process.env.PAYTABS_SETTLEMENT_PERIOD || 'daily', // daily, weekly, monthly
  autoTransfer: process.env.PAYTABS_AUTO_TRANSFER === 'true', // Automatische Überweisung
}

// Vendor (Restaurant) Interface
export interface PayTabsVendor {
  vendorId: string
  vendorName: string
  vendorEmail: string
  vendorPhone: string
  bankAccount?: {
    bankName: string
    accountNumber: string
    iban: string
    swiftCode?: string
  }
  settlementCurrency: string
  status: 'active' | 'pending' | 'suspended'
}

// Erstelle Vendor Account für Restaurant
export async function createVendorAccount(restaurantData: {
  restaurantId: string
  name: string
  email: string
  phone: string
  bankDetails?: {
    bankName: string
    accountNumber: string
    iban: string
    swiftCode?: string
  }
  country: string
  currency: string
}): Promise<{ vendorId: string; status: string } | null> {
  if (!isPayTabsConfigured()) {
    console.error('PayTabs ist nicht konfiguriert')
    return null
  }

  const payload = {
    profile_id: PAYTABS_CONFIG.profileId,
    vendor_name: restaurantData.name,
    vendor_email: restaurantData.email,
    vendor_phone: restaurantData.phone,
    vendor_country: restaurantData.country,
    settlement_currency: restaurantData.currency,
    settlement_method: 'bank_transfer',
    bank_details: restaurantData.bankDetails ? {
      bank_name: restaurantData.bankDetails.bankName,
      account_number: restaurantData.bankDetails.accountNumber,
      iban: restaurantData.bankDetails.iban,
      swift_code: restaurantData.bankDetails.swiftCode
    } : undefined,
    auto_withdrawal: MARKETPLACE_CONFIG.autoTransfer,
    withdrawal_period: MARKETPLACE_CONFIG.settlementPeriod
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/vendors/create`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    if (data.vendor_id) {
      return {
        vendorId: data.vendor_id,
        status: data.status || 'pending'
      }
    }

    console.error('PayTabs Vendor Creation Fehler:', data)
    return null
  } catch (error) {
    console.error('PayTabs API Fehler:', error)
    return null
  }
}

// Update Vendor Bank Details
export async function updateVendorBankDetails(
  vendorId: string,
  bankDetails: {
    bankName: string
    accountNumber: string
    iban: string
    swiftCode?: string
  }
) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/vendors/update`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        vendor_id: vendorId,
        bank_name: bankDetails.bankName,
        account_number: bankDetails.accountNumber,
        iban: bankDetails.iban,
        swift_code: bankDetails.swiftCode
      })
    })

    return await response.json()
  } catch (error) {
    console.error('PayTabs Update Bank Details Fehler:', error)
    return null
  }
}

// Erstelle Split Payment
export async function createSplitPayment(orderData: {
  orderId: string
  amount: number
  description: string
  customerName: string
  customerEmail: string
  customerPhone: string
  vendorId: string // Restaurant's PayTabs Vendor ID
  platformFeePercent?: number // Optional: Override default platform fee
  returnUrl: string
  callbackUrl: string
}) {
  if (!isPayTabsConfigured()) {
    return null
  }

  const platformFee = orderData.platformFeePercent || MARKETPLACE_CONFIG.platformFeePercent
  const platformAmount = parseFloat((orderData.amount * (platformFee / 100)).toFixed(2))
  const vendorAmount = parseFloat((orderData.amount - platformAmount).toFixed(2))

  const payload = {
    profile_id: PAYTABS_CONFIG.profileId,
    tran_type: 'sale',
    tran_class: 'ecom',
    cart_id: orderData.orderId,
    cart_currency: PAYTABS_CONFIG.currency,
    cart_amount: orderData.amount,
    cart_description: orderData.description,
    paypage_lang: 'ar',
    customer_details: {
      name: orderData.customerName,
      email: orderData.customerEmail,
      phone: orderData.customerPhone,
      country: 'JO'
    },
    // Split Payment Configuration
    split_type: 'percentage', // oder 'amount'
    split_vendors: [
      {
        vendor_id: orderData.vendorId,
        vendor_amount: vendorAmount,
        vendor_percentage: 100 - platformFee
      },
      {
        vendor_id: 'platform', // Platform vendor ID
        vendor_amount: platformAmount,
        vendor_percentage: platformFee
      }
    ],
    callback: orderData.callbackUrl,
    return: orderData.returnUrl
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/payment/request`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.redirect_url && data.tran_ref) {
      return {
        paymentUrl: data.redirect_url,
        tranRef: data.tran_ref,
        vendorAmount,
        platformAmount
      }
    }

    console.error('PayTabs Split Payment Fehler:', data)
    return null
  } catch (error) {
    console.error('PayTabs API Fehler:', error)
    return null
  }
}

// Hole Vendor Balance (Verfügbares Guthaben)
export async function getVendorBalance(vendorId: string) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/vendors/balance`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        vendor_id: vendorId
      })
    })

    const data = await response.json()
    
    return {
      availableBalance: data.available_balance || 0,
      pendingBalance: data.pending_balance || 0,
      currency: data.currency || PAYTABS_CONFIG.currency,
      lastSettlement: data.last_settlement_date,
      nextSettlement: data.next_settlement_date
    }
  } catch (error) {
    console.error('PayTabs Balance Check Fehler:', error)
    return null
  }
}

// Initiere manuelle Auszahlung für Vendor
export async function initiateVendorPayout(
  vendorId: string,
  amount?: number // Optional: Teilbetrag, sonst ganzes verfügbares Guthaben
) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/vendors/withdraw`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        vendor_id: vendorId,
        amount: amount,
        currency: PAYTABS_CONFIG.currency
      })
    })

    const data = await response.json()
    
    return {
      success: data.response_code === '000',
      transactionId: data.transaction_id,
      message: data.response_message
    }
  } catch (error) {
    console.error('PayTabs Payout Fehler:', error)
    return null
  }
}

// Hole Vendor Transactions History
export async function getVendorTransactions(
  vendorId: string,
  dateFrom?: string,
  dateTo?: string,
  limit: number = 50
) {
  if (!isPayTabsConfigured()) {
    return null
  }

  try {
    const response = await fetch(`${PAYTABS_CONFIG.baseUrl}/vendors/transactions`, {
      method: 'POST',
      headers: getPayTabsHeaders(),
      body: JSON.stringify({
        profile_id: PAYTABS_CONFIG.profileId,
        vendor_id: vendorId,
        date_from: dateFrom,
        date_to: dateTo,
        limit
      })
    })

    const data = await response.json()
    
    return data.transactions || []
  } catch (error) {
    console.error('PayTabs Transactions Fehler:', error)
    return []
  }
}

// Berechne Platform Fee für Anzeige
export function calculatePlatformFee(amount: number, customFeePercent?: number) {
  const feePercent = customFeePercent || MARKETPLACE_CONFIG.platformFeePercent
  const platformFee = amount * (feePercent / 100)
  const vendorAmount = amount - platformFee
  
  return {
    totalAmount: amount,
    platformFee: parseFloat(platformFee.toFixed(2)),
    vendorAmount: parseFloat(vendorAmount.toFixed(2)),
    feePercent
  }
}

// Settlement Schedule für verschiedene Länder
export const SETTLEMENT_SCHEDULES = {
  JOR: {
    standard: 'T+2', // 2 Werktage
    express: 'T+1',  // 1 Werktag (mit höheren Gebühren)
    instant: 'T+0'   // Sofort (mit Premium-Gebühren)
  },
  SAU: {
    standard: 'T+1',
    express: 'T+0',
    instant: 'Instant'
  },
  UAE: {
    standard: 'T+1',
    express: 'T+0',
    instant: 'Instant'
  },
  EGY: {
    standard: 'T+3',
    express: 'T+2',
    instant: 'T+1'
  }
}

// Banken in Jordanien für Dropdown
export const JORDAN_BANKS = [
  { code: 'ARAB', name: 'Arab Bank', swiftCode: 'ARABJOAX' },
  { code: 'JKBB', name: 'Jordan Kuwait Bank', swiftCode: 'JKBBJOAX' },
  { code: 'HBTF', name: 'Housing Bank', swiftCode: 'HBTFJOAX' },
  { code: 'CAAB', name: 'Cairo Amman Bank', swiftCode: 'CAABJOAX' },
  { code: 'JOBA', name: 'Bank of Jordan', swiftCode: 'JOBAJOAX' },
  { code: 'SGBJ', name: 'Société Générale Jordan', swiftCode: 'SGBJJOAX' },
  { code: 'ABCO', name: 'Bank al Etihad', swiftCode: 'ABCOJOAX' },
  { code: 'CBJO', name: 'Capital Bank of Jordan', swiftCode: 'CBJOJOAX' },
  { code: 'JIIB', name: 'Jordan Islamic Bank', swiftCode: 'JIIBJOAX' },
  { code: 'SIBK', name: 'Safwa Islamic Bank', swiftCode: 'SIBKJOAX' }
]