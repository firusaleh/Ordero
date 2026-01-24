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
import { useLanguage } from '@/contexts/language-context'
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
  const { t } = useLanguage()
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
        throw new Error(errorData.error || t('common.errorSaving'))
      }

      toast.success(t('settings.general.basicInfoSaved') || t('common.savedSuccessfully'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.errorSaving'))
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
        throw new Error(errorData.error || t('common.errorSaving'))
      }

      toast.success(t('settings.general.addressSaved') || t('common.savedSuccessfully'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('common.errorSaving'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.general.title')}</h1>
        <p className="text-gray-600">{t('settings.general.description')}</p>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {t('common.basicInformation')}
          </TabsTrigger>
          <TabsTrigger value="address" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t('common.address')}
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('common.openingHours')}
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            {t('common.paymentMethods')}
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            {t('common.designAppearance')}
          </TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {t('common.basicInformation')}
              </CardTitle>
              <CardDescription>
                {t('common.generalInformation')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t('settings.general.restaurantName')} *</Label>
                  <Input
                    id="name"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                    placeholder={t('common.placeholder.restaurantName')}
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">{t('common.cuisine')}</Label>
                  <Input
                    id="cuisine"
                    value={restaurant.cuisine}
                    onChange={(e) => setRestaurant({ ...restaurant, cuisine: e.target.value })}
                    placeholder={t('common.placeholder.cuisine')}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  value={restaurant.description}
                  onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })}
                  rows={4}
                  placeholder={t('common.placeholder.description')}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {t('common.notes.descriptionNote')}
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t('common.contactInformation')}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">{t('common.phoneNumber')}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={restaurant.phone}
                      onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                      placeholder={t('common.placeholder.phone')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">{t('common.emailAddress')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurant.email}
                      onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })}
                      placeholder={t('common.placeholder.email')}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="website">{t('common.website')}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={restaurant.website}
                    onChange={(e) => setRestaurant({ ...restaurant, website: e.target.value })}
                    placeholder={t('common.placeholder.website')}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {t('common.notes.websiteNote')}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveBasicInfo} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.saveBasicInfo')}
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
                {t('common.address')}
              </CardTitle>
              <CardDescription>
                {t('settings.location.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="street">{t('common.streetAndNumber')} *</Label>
                <Input
                  id="street"
                  value={restaurant.street}
                  onChange={(e) => setRestaurant({ ...restaurant, street: e.target.value })}
                  placeholder={t('common.placeholder.street')}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="postalCode">{t('common.postalCode')} *</Label>
                  <Input
                    id="postalCode"
                    value={restaurant.postalCode}
                    onChange={(e) => setRestaurant({ ...restaurant, postalCode: e.target.value })}
                    placeholder={t('common.placeholder.postalCode')}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="city">{t('common.city')} *</Label>
                  <Input
                    id="city"
                    value={restaurant.city}
                    onChange={(e) => setRestaurant({ ...restaurant, city: e.target.value })}
                    placeholder={t('common.placeholder.city')}
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">{t('common.notes.addressImportanceTitle')}</h4>
                <p className="text-sm text-blue-800">
                  {t('common.notes.addressImportance')}
                </p>
                <ul className="text-sm text-blue-800 mt-2 ml-4 list-disc">
                  <li>{t('common.notes.addressPoints.delivery')}</li>
                  <li>{t('common.notes.addressPoints.localSearch')}</li>
                  <li>{t('common.notes.addressPoints.legalImprint')}</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveAddress} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('common.saving')}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t('common.saveAddress')}
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