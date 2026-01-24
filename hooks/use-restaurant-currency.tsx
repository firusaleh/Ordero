'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { formatPrice as formatPriceUtil, getCurrencySymbol as getCurrencySymbolUtil, Currency } from '@/lib/utils/currency'
import { useRouter } from 'next/navigation'

interface RestaurantCurrency {
  currency: Currency
  formatPrice: (amount: number) => string
  getCurrencySymbol: () => string
  refreshCurrency: () => Promise<void>
  isLoading: boolean
}

export function useRestaurantCurrency(restaurantIdParam?: string): RestaurantCurrency {
  const { data: session } = useSession()
  const [currency, setCurrency] = useState<Currency>('EUR')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const fetchRestaurantCurrency = useCallback(async () => {
    setIsLoading(true)
    const restaurantId = restaurantIdParam || (session?.user as any)?.restaurantId
    if (restaurantId) {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}`, {
          cache: 'no-store' // Verhindere Caching
        })
        if (response.ok) {
          const data = await response.json()
          const newCurrency = data.settings?.currency || data.currency || 'EUR'
          console.log('Fetched restaurant data:', data)
          console.log('Currency found:', newCurrency)
          setCurrency(newCurrency as Currency)
        }
      } catch (error) {
        console.error('Error fetching restaurant currency:', error)
      }
    } else {
      console.log('No restaurantId available:', restaurantIdParam, session?.user)
    }
    setIsLoading(false)
  }, [session?.user, restaurantIdParam])

  useEffect(() => {
    fetchRestaurantCurrency()
    
    // Refresh currency when window gets focus (user might have changed it in another tab)
    const handleFocus = () => {
      fetchRestaurantCurrency()
    }
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchRestaurantCurrency])

  const formatPrice = (amount: number) => {
    return formatPriceUtil(amount, currency)
  }

  const getCurrencySymbol = () => {
    return getCurrencySymbolUtil(currency)
  }

  return {
    currency,
    formatPrice,
    getCurrencySymbol,
    refreshCurrency: fetchRestaurantCurrency,
    isLoading
  }
}