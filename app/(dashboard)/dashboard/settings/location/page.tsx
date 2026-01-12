'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { RestaurantLocationSettings } from '@/components/dashboard/restaurant-location-settings'
import { toast } from 'sonner'

export default function LocationSettingsPage() {
  const router = useRouter()
  const [restaurantId, setRestaurantId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRestaurantId()
  }, [])

  const fetchRestaurantId = async () => {
    try {
      const response = await fetch('/api/dashboard/settings')
      if (response.ok) {
        const data = await response.json()
        if (data.restaurant?.id) {
          setRestaurantId(data.restaurant.id)
        } else {
          toast.error('Kein Restaurant gefunden')
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error)
      toast.error('Fehler beim Laden der Daten')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!restaurantId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Kein Restaurant gefunden</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zu Einstellungen
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Standort & Region</h1>
        <p className="text-gray-600 mt-2">
          Ihr Standort bestimmt automatisch, welcher Zahlungsanbieter verwendet wird.
          Deutsche Restaurants nutzen Stripe, Restaurants im Nahen Osten nutzen PayTabs.
        </p>
      </div>

      <RestaurantLocationSettings restaurantId={restaurantId} />
    </div>
  )
}