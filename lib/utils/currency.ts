/**
 * Currency formatting utilities
 */

export type Currency = 'EUR' | 'USD' | 'SAR'

export interface CurrencySettings {
  currency: Currency
  symbol: string
  position: 'before' | 'after'
  decimal: string
  thousand: string
}

// Currency configurations
export const CURRENCY_CONFIG: Record<Currency, CurrencySettings> = {
  EUR: {
    currency: 'EUR',
    symbol: '€',
    position: 'after',
    decimal: ',',
    thousand: '.'
  },
  USD: {
    currency: 'USD',
    symbol: '$',
    position: 'before',
    decimal: '.',
    thousand: ','
  },
  SAR: {
    currency: 'SAR',
    symbol: 'ر.س',
    position: 'after',
    decimal: '.',
    thousand: ','
  }
}

/**
 * Format a price with the correct currency symbol and formatting
 * @param amount - The amount to format
 * @param currency - The currency code (EUR, USD, SAR)
 * @returns Formatted price string
 */
export function formatPrice(amount: number, currency: Currency = 'EUR'): string {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR
  
  // Format the number with 2 decimal places
  const formatted = amount.toFixed(2)
    .replace('.', config.decimal)
    .replace(/\B(?=(\d{3})+(?!\d))/g, config.thousand)
  
  // Add currency symbol
  if (config.position === 'before') {
    return `${config.symbol}${formatted}`
  } else {
    return `${formatted} ${config.symbol}`
  }
}

/**
 * Get currency symbol
 * @param currency - The currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currency: Currency = 'EUR'): string {
  return CURRENCY_CONFIG[currency]?.symbol || '€'
}

/**
 * Parse a formatted price string to number
 * @param formatted - The formatted price string
 * @param currency - The currency code
 * @returns Numeric value
 */
export function parsePrice(formatted: string, currency: Currency = 'EUR'): number {
  const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.EUR
  
  // Remove currency symbol and whitespace
  let cleaned = formatted.replace(config.symbol, '').trim()
  
  // Replace decimal and thousand separators
  cleaned = cleaned.replace(new RegExp(`\\${config.thousand}`, 'g'), '')
  cleaned = cleaned.replace(config.decimal, '.')
  
  return parseFloat(cleaned) || 0
}