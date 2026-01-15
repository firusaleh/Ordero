'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Store, 
  MapPin, 
  Phone, 
  Globe, 
  Clock,
  CreditCard,
  Palette,
  Save,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { OpeningHoursManager } from '@/components/dashboard/opening-hours'
import PaymentMethods from '@/components/dashboard/payment-methods'
import RestaurantDesign from '@/components/dashboard/restaurant-design'

interface RestaurantData {
  id: string
  name: string
  slug: string
  description?: string | null
  cuisine?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  country: string
  phone?: string | null
  email?: string | null
  website?: string | null
  logo?: string | null
  coverImage?: string | null
  primaryColor?: string | null
}

interface SettingsData {
  orderingEnabled?: boolean
  requireTableNumber?: boolean
  allowTakeaway?: boolean
  emailNotifications?: boolean
  soundNotifications?: boolean
  currency?: string
  language?: string
  openingHours?: any
}

interface GeneralSettingsClientProps {
  restaurant: RestaurantData
  settings: SettingsData | null
}

export default function GeneralSettingsClient({ restaurant: initialRestaurant, settings: initialSettings }: GeneralSettingsClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [restaurant, setRestaurant] = useState({
    name: initialRestaurant.name || '',
    description: initialRestaurant.description || '',
    cuisine: initialRestaurant.cuisine || '',
    street: initialRestaurant.street || '',
    city: initialRestaurant.city || '',
    postalCode: initialRestaurant.postalCode || '',
    phone: initialRestaurant.phone || '',
    email: initialRestaurant.email || '',
    website: initialRestaurant.website || '',
  })

  const handleSaveBasicInfo = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'restaurant',
          id: initialRestaurant.id,
          ...restaurant 
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      toast.success('Grundinformationen gespeichert')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveAddress = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'restaurant',
          id: initialRestaurant.id,
          street: restaurant.street,
          city: restaurant.city,
          postalCode: restaurant.postalCode
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern')
      }

      toast.success('Adresse gespeichert')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Fehler beim Speichern')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Allgemeine Einstellungen</h1>
        <p className="text-gray-600">Verwalten Sie die grundlegenden Informationen Ihres Restaurants</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Grundinformationen
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Adresse
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Öffnungszeiten
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Zahlungsmethoden
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Design & Aussehen
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Grundinformationen
              </CardTitle>
              <CardDescription>
                Allgemeine Informationen über Ihr Restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                    placeholder="Mein Restaurant"
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">Küche</Label>
                  <Input
                    id="cuisine"
                    value={restaurant.cuisine}
                    onChange={(e) => setRestaurant({ ...restaurant, cuisine: e.target.value })}
                    placeholder="z.B. Italienisch, Asiatisch, Deutsch"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={restaurant.description}
                  onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })}
                  rows={4}
                  placeholder="Beschreiben Sie Ihr Restaurant, die Atmosphäre und Besonderheiten..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Diese Beschreibung wird Gästen auf Ihrer öffentlichen Seite angezeigt
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Kontaktinformationen
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={restaurant.phone}
                      onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                      placeholder="+49 30 12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-Mail-Adresse</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurant.email}
                      onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })}
                      placeholder="kontakt@meinrestaurant.de"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={restaurant.website}
                    onChange={(e) => setRestaurant({ ...restaurant, website: e.target.value })}
                    placeholder="https://www.meinrestaurant.de"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Link zu Ihrer bestehenden Website (optional)
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBasicInfo} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Grundinformationen speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Address Tab */}
        <TabsContent value="address">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Adresse
              </CardTitle>
              <CardDescription>
                Die Adresse Ihres Restaurants für Lieferungen und Navigation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="street">Straße und Hausnummer *</Label>
                <Input
                  id="street"
                  value={restaurant.street}
                  onChange={(e) => setRestaurant({ ...restaurant, street: e.target.value })}
                  placeholder="Musterstraße 123"
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="postalCode">Postleitzahl *</Label>
                  <Input
                    id="postalCode"
                    value={restaurant.postalCode}
                    onChange={(e) => setRestaurant({ ...restaurant, postalCode: e.target.value })}
                    placeholder="12345"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="city">Stadt *</Label>
                  <Input
                    id="city"
                    value={restaurant.city}
                    onChange={(e) => setRestaurant({ ...restaurant, city: e.target.value })}
                    placeholder="Berlin"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Wichtiger Hinweis</h4>
                <p className="text-sm text-blue-800">
                  Eine korrekte Adresse ist wichtig für:
                </p>
                <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                  <li>Lieferservice und Navigation</li>
                  <li>Lokale Suchergebnisse</li>
                  <li>Rechtliche Impressumspflicht</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAddress} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Adresse speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opening Hours Tab */}
        <TabsContent value="hours">
          <OpeningHoursManager 
            restaurantId={initialRestaurant.id}
          />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments">
          <PaymentMethods 
            restaurantId={initialRestaurant.id}
            initialData={{
              acceptCash: true,
              acceptCard: false,
              acceptMobile: false,
              acceptOnline: false,
              minimumOrder: 0,
              serviceFee: 0,
              tipOptions: [5, 10, 15, 20]
            }}
          />
        </TabsContent>

        {/* Design & Appearance Tab */}
        <TabsContent value="design">
          <RestaurantDesign 
            restaurantId={initialRestaurant.id}
            initialData={{
              logo: initialRestaurant.logo || '',
              coverImage: initialRestaurant.coverImage || '',
              primaryColor: initialRestaurant.primaryColor || '#FF6B35',
              secondaryColor: '#1E40AF',
              fontFamily: 'inter',
              customCss: ''
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}