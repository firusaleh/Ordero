'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { formatPrice as formatPriceUtil, getCurrencySymbol as getCurrencySymbolUtil, Currency } from '@/lib/utils/currency'

interface RestaurantCurrency {
  currency: Currency
  formatPrice: (amount: number) => string
  getCurrencySymbol: () => string
}

export function useRestaurantCurrency(): RestaurantCurrency {
  const { data: session } = useSession()
  const [currency, setCurrency] = useState<Currency>('EUR')

  useEffect(() => {
    async function fetchRestaurantCurrency() {
      const restaurantId = (session?.user as any)?.restaurantId
      if (restaurantId) {
        try {
          const response = await fetch(`/api/restaurants/${restaurantId}`)
          if (response.ok) {
            const data = await response.json()
            setCurrency(data.settings?.currency || data.currency || 'EUR')
          }
        } catch (error) {
          console.error('Error fetching restaurant currency:', error)
        }
      }
    }

    fetchRestaurantCurrency()
  }, [session?.user])

  const formatPrice = (amount: number) => {
    return formatPriceUtil(amount, currency)
  }

  const getCurrencySymbol = () => {
    return getCurrencySymbolUtil(currency)
  }

  return {
    currency,
    formatPrice,
    getCurrencySymbol
  }
}