'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle, XCircle, Clock, Mail, Phone, Globe, MapPin, User, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface PendingRestaurant {
  id: string
  name: string
  slug: string
  description?: string
  email?: string
  phone?: string
  website?: string
  street?: string
  city?: string
  postalCode?: string
  country: string
  status: string
  createdAt: string
  owner: {
    id: string
    name?: string
    email: string
  }
}

export default function RestaurantApprovals() {
  const [restaurants, setRestaurants] = useState<PendingRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPendingRestaurants()
  }, [])

  const loadPendingRestaurants = async () => {
    try {
      const response = await fetch('/api/admin/restaurants/pending')
      if (response.ok) {
        const data = await response.json()
        setRestaurants(data)
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Konnte ausstehende Restaurants nicht laden',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/approve`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Restaurant freigegeben',
          description: 'Das Restaurant wurde erfolgreich freigegeben und der Besitzer wurde benachrichtigt.',
        })
        loadPendingRestaurants()
      } else {
        throw new Error('Fehler bei der Freigabe')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Restaurant konnte nicht freigegeben werden',
        variant: 'destructive'
      })
    }
  }

  const handleReject = async (restaurantId: string) => {
    if (!confirm('Restaurant wirklich ablehnen? Der Besitzer wird benachrichtigt.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/reject`, {
        method: 'POST'
      })

      if (response.ok) {
        toast({
          title: 'Restaurant abgelehnt',
          description: 'Das Restaurant wurde abgelehnt und der Besitzer wurde benachrichtigt.',
        })
        loadPendingRestaurants()
      } else {
        throw new Error('Fehler beim Ablehnen')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Restaurant konnte nicht abgelehnt werden',
        variant: 'destructive'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Restaurant-Freigaben</h1>
        <p className="text-gray-600">Verwalten Sie neue Restaurant-Registrierungen</p>
      </div>

      {restaurants.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-lg">Keine ausstehenden Freigaben</p>
            <p className="text-gray-400 text-sm mt-2">Alle Restaurants sind bereits freigegeben</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {restaurants.map((restaurant) => (
            <Card key={restaurant.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {restaurant.name}
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Ausstehend
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {restaurant.description || 'Keine Beschreibung vorhanden'}
                    </CardDescription>
                  </div>
                  <div className="text-sm text-gray-500">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Registriert {formatDistanceToNow(new Date(restaurant.createdAt), { 
                      addSuffix: true,
                      locale: de 
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Besitzer-Informationen */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-600">Besitzer</h3>
                    <div className="space-y-1">
                      {restaurant.owner.name && (
                        <div className="flex items-center text-sm">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {restaurant.owner.name}
                        </div>
                      )}
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {restaurant.owner.email}
                      </div>
                    </div>
                  </div>

                  {/* Restaurant-Kontakt */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm text-gray-600">Kontakt</h3>
                    <div className="space-y-1">
                      {restaurant.email && (
                        <div className="flex items-center text-sm">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {restaurant.email}
                        </div>
                      )}
                      {restaurant.phone && (
                        <div className="flex items-center text-sm">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {restaurant.phone}
                        </div>
                      )}
                      {restaurant.website && (
                        <div className="flex items-center text-sm">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          {restaurant.website}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adresse */}
                  {(restaurant.street || restaurant.city) && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm text-gray-600">Adresse</h3>
                      <div className="flex items-start text-sm">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        <div>
                          {restaurant.street && <div>{restaurant.street}</div>}
                          {(restaurant.postalCode || restaurant.city) && (
                            <div>
                              {restaurant.postalCode} {restaurant.city}
                            </div>
                          )}
                          <div>{restaurant.country}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Aktionen */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(restaurant.id)}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Freigeben
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleReject(restaurant.id)}
                    className="flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Ablehnen
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}