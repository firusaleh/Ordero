'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Globe, MapPin, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface RestaurantLocationSettingsProps {
  restaurantId: string
}

// Länder mit ihren Payment-Providern
const COUNTRY_PAYMENT_INFO = {
  // Europa (Stripe)
  'DE': { name: 'Deutschland', currency: 'EUR', provider: 'Stripe', flag: '🇩🇪' },
  'FR': { name: 'Frankreich', currency: 'EUR', provider: 'Stripe', flag: '🇫🇷' },
  'IT': { name: 'Italien', currency: 'EUR', provider: 'Stripe', flag: '🇮🇹' },
  'ES': { name: 'Spanien', currency: 'EUR', provider: 'Stripe', flag: '🇪🇸' },
  'NL': { name: 'Niederlande', currency: 'EUR', provider: 'Stripe', flag: '🇳🇱' },
  'BE': { name: 'Belgien', currency: 'EUR', provider: 'Stripe', flag: '🇧🇪' },
  'AT': { name: 'Österreich', currency: 'EUR', provider: 'Stripe', flag: '🇦🇹' },
  'CH': { name: 'Schweiz', currency: 'CHF', provider: 'Stripe', flag: '🇨🇭' },
  'GB': { name: 'Großbritannien', currency: 'GBP', provider: 'Stripe', flag: '🇬🇧' },
  
  // Naher Osten (PayTabs)
  'JO': { name: 'Jordanien', currency: 'JOD', provider: 'PayTabs', flag: '🇯🇴' },
  'SA': { name: 'Saudi-Arabien', currency: 'SAR', provider: 'PayTabs', flag: '🇸🇦' },
  'AE': { name: 'VAE', currency: 'AED', provider: 'PayTabs', flag: '🇦🇪' },
  'KW': { name: 'Kuwait', currency: 'KWD', provider: 'PayTabs', flag: '🇰🇼' },
  'BH': { name: 'Bahrain', currency: 'BHD', provider: 'PayTabs', flag: '🇧🇭' },
  'QA': { name: 'Katar', currency: 'QAR', provider: 'PayTabs', flag: '🇶🇦' },
  'OM': { name: 'Oman', currency: 'OMR', provider: 'PayTabs', flag: '🇴🇲' },
  'EG': { name: 'Ägypten', currency: 'EGP', provider: 'PayTabs', flag: '🇪🇬' },
  'LB': { name: 'Libanon', currency: 'LBP', provider: 'PayTabs', flag: '🇱🇧' },
  
  // Andere
  'US': { name: 'USA', currency: 'USD', provider: 'Stripe', flag: '🇺🇸' },
  'CA': { name: 'Kanada', currency: 'CAD', provider: 'Stripe', flag: '🇨🇦' },
  'AU': { name: 'Australien', currency: 'AUD', provider: 'Stripe', flag: '🇦🇺' },
  'IN': { name: 'Indien', currency: 'INR', provider: 'Razorpay', flag: '🇮🇳' },
}

export function RestaurantLocationSettings({ restaurantId }: RestaurantLocationSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [locationData, setLocationData] = useState({
    country: 'DE',
    city: '',
    street: '',
    postalCode: '',
    currency: 'EUR'
  })

  useEffect(() => {
    fetchLocationData()
  }, [restaurantId])

  const fetchLocationData = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        setLocationData({
          country: data.country || 'DE',
          city: data.city || '',
          street: data.street || '',
          postalCode: data.postalCode || '',
          currency: data.settings?.currency || 'EUR'
        })
        setSaved(true)
      }
    } catch (error) {
      console.error('Error fetching location data:', error)
    }
  }

  const saveLocationData = async () => {
    try {
      setLoading(true)
      setSaved(false)
      
      const countryInfo = COUNTRY_PAYMENT_INFO[locationData.country as keyof typeof COUNTRY_PAYMENT_INFO]
      
      if (!countryInfo) {
        toast.error('Ungültiges Land ausgewählt')
        return
      }
      
      console.log('Saving location data:', {
        restaurantId,
        country: locationData.country,
        city: locationData.city,
        street: locationData.street,
        postalCode: locationData.postalCode,
        currency: countryInfo.currency
      })
      
      // Update Restaurant mit allen Daten inkl. Settings
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: locationData.country,
          city: locationData.city || null,
          street: locationData.street || null,
          postalCode: locationData.postalCode || null,
          settings: {
            currency: countryInfo.currency
          }
        })
      })

      const responseData = await response.json()
      console.log('Save response:', responseData)

      if (!response.ok) {
        console.error('Save error:', responseData)
        throw new Error(responseData.error || 'Fehler beim Speichern')
      }

      setSaved(true)
      toast.success('Standort-Einstellungen erfolgreich gespeichert!')
      
      // Reload data to confirm save
      setTimeout(() => {
        fetchLocationData()
      }, 500)
      
    } catch (error: any) {
      console.error('Error saving location data:', error)
      toast.error(error.message || 'Fehler beim Speichern der Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const countryInfo = COUNTRY_PAYMENT_INFO[countryCode as keyof typeof COUNTRY_PAYMENT_INFO]
    if (countryInfo) {
      setLocationData({
        ...locationData,
        country: countryCode,
        currency: countryInfo.currency
      })
      setSaved(false)
    }
  }

  const selectedCountry = COUNTRY_PAYMENT_INFO[locationData.country as keyof typeof COUNTRY_PAYMENT_INFO]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Standort & Zahlungsregion
        </CardTitle>
        <CardDescription>
          Ihr Standort bestimmt automatisch den optimalen Zahlungsanbieter
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Einstellungen gespeichert. Zahlungsanbieter: {selectedCountry?.provider}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="country">Land auswählen</Label>
            <select
              id="country"
              className="w-full px-3 py-2 border rounded-md"
              value={locationData.country}
              onChange={(e) => handleCountryChange(e.target.value)}
            >
              <optgroup label="Europa (Stripe)">
                {Object.entries(COUNTRY_PAYMENT_INFO)
                  .filter(([_, info]) => info.provider === 'Stripe' && info.currency === 'EUR')
                  .map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.flag} {info.name}
                    </option>
                  ))}
              </optgroup>
              
              <optgroup label="Naher Osten (PayTabs)">
                {Object.entries(COUNTRY_PAYMENT_INFO)
                  .filter(([_, info]) => info.provider === 'PayTabs')
                  .map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.flag} {info.name}
                    </option>
                  ))}
              </optgroup>
              
              <optgroup label="Andere Länder">
                {Object.entries(COUNTRY_PAYMENT_INFO)
                  .filter(([_, info]) => 
                    info.provider === 'Stripe' && info.currency !== 'EUR' ||
                    info.provider === 'Razorpay'
                  )
                  .map(([code, info]) => (
                    <option key={code} value={code}>
                      {info.flag} {info.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Zeige automatische Einstellungen */}
          {selectedCountry && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Zahlungsanbieter:</span>
                <span className="font-medium">
                  {selectedCountry.provider === 'Stripe' && '💳 Stripe'}
                  {selectedCountry.provider === 'PayTabs' && '🌍 PayTabs'}
                  {selectedCountry.provider === 'Razorpay' && '🇮🇳 Razorpay'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Währung:</span>
                <span className="font-medium">{selectedCountry.currency}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Unterstützte Methoden:</span>
                <span className="text-sm">
                  {selectedCountry.provider === 'Stripe' && 'Kreditkarte, SEPA, Apple/Google Pay'}
                  {selectedCountry.provider === 'PayTabs' && 'Kreditkarte, Mada, Apple Pay'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">
                Stadt {selectedCountry?.provider !== 'PayTabs' && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="city"
                value={locationData.city}
                onChange={(e) => {
                  setLocationData({ ...locationData, city: e.target.value })
                  setSaved(false)
                }}
                placeholder="z.B. Berlin, Amman"
                required={selectedCountry?.provider !== 'PayTabs'}
              />
            </div>
            
            <div>
              <Label htmlFor="postalCode">
                Postleitzahl {selectedCountry?.provider === 'PayTabs' && <span className="text-gray-400 text-xs">(optional)</span>}
              </Label>
              <Input
                id="postalCode"
                value={locationData.postalCode}
                onChange={(e) => {
                  setLocationData({ ...locationData, postalCode: e.target.value })
                  setSaved(false)
                }}
                placeholder={selectedCountry?.provider === 'PayTabs' ? "Optional" : "z.B. 10115"}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="street">
              Straße {selectedCountry?.provider === 'PayTabs' && <span className="text-gray-400 text-xs">(optional)</span>}
            </Label>
            <Input
              id="street"
              value={locationData.street}
              onChange={(e) => {
                setLocationData({ ...locationData, street: e.target.value })
                setSaved(false)
              }}
              placeholder={selectedCountry?.provider === 'PayTabs' ? "Optional für Länder im Nahen Osten" : "Straße und Hausnummer"}
            />
          </div>

          <Button 
            onClick={saveLocationData}
            disabled={loading || saved}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {saved ? 'Gespeichert' : 'Standort speichern'}
          </Button>
        </div>

        {/* Info Box */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Automatische Anpassung:</strong> Basierend auf Ihrem Land wählt das System automatisch den besten Zahlungsanbieter. 
            Deutsche Restaurants nutzen Stripe, jordanische Restaurants PayTabs.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}