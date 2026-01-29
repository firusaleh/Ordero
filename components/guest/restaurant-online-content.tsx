'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Phone, Globe, Clock, QrCode, ArrowRight, Calendar, ShoppingBag } from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSwitcher from '@/components/guest/language-switcher'

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  cuisine?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  phone?: string | null
  website?: string | null
  logo?: string | null
  banner?: string | null
  primaryColor?: string | null
  settings?: {
    openingHours?: string | null
  } | null
  _count: {
    tables: number
    menuItems: number
    categories: number
  }
}

interface RestaurantOnlineContentProps {
  restaurant: Restaurant
}

export default function RestaurantOnlineContent({ restaurant }: RestaurantOnlineContentProps) {
  const { t } = useGuestLanguage()
  const [tableNumber, setTableNumber] = useState('')

  const handleTableSubmit = () => {
    if (tableNumber.trim()) {
      window.location.href = `/r/${restaurant.slug}/tisch/${tableNumber}`
    }
  }

  const primaryColor = restaurant.primaryColor || '#3b82f6'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Image */}
      {restaurant.banner && (
        <div className="w-full h-48 md:h-64 relative">
          <img
            src={restaurant.banner}
            alt={`${restaurant.name} Banner`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-start">
            <div className="flex items-start gap-4 flex-1">
              {/* Logo */}
              {restaurant.logo && (
                <img
                  src={restaurant.logo}
                  alt={`${restaurant.name} Logo`}
                  className="w-16 h-16 md:w-20 md:h-20 object-contain rounded-lg border bg-white shadow-sm"
                  style={{ marginTop: restaurant.banner ? '-2rem' : '0' }}
                />
              )}
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>{restaurant.name}</h1>
                {restaurant.description && (
                  <p className="text-gray-600">{restaurant.description}</p>
                )}
                {restaurant.cuisine && (
                  <p className="text-sm text-gray-500 mt-2">
                    {t('guest.restaurantPage.cuisine')}: {restaurant.cuisine}
                  </p>
                )}
              </div>
            </div>
            <div className="ml-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Action Buttons */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Link href={`/${restaurant.slug}/reserve`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{t('guest.reservation.button')}</h3>
                    <p className="text-sm text-gray-600">{t('guest.reservation.buttonDesc')}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Link href={`/${restaurant.slug}/preorder`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ShoppingBag className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{t('guest.preorder.button')}</h3>
                    <p className="text-sm text-gray-600">{t('guest.preorder.buttonDesc')}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('guest.restaurantPage.restaurantInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(restaurant.street || restaurant.city) && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('guest.restaurantPage.address')}</p>
                    <p className="text-sm text-gray-600">
                      {restaurant.street && <span>{restaurant.street}<br /></span>}
                      {restaurant.postalCode && <span>{restaurant.postalCode} </span>}
                      {restaurant.city}
                    </p>
                  </div>
                </div>
              )}
              
              {restaurant.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('guest.restaurantPage.phone')}</p>
                    <a href={`tel:${restaurant.phone}`} className="text-sm text-blue-600 hover:underline">
                      {restaurant.phone}
                    </a>
                  </div>
                </div>
              )}
              
              {restaurant.website && (
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('guest.restaurantPage.website')}</p>
                    <a 
                      href={restaurant.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {restaurant.website}
                    </a>
                  </div>
                </div>
              )}
              
              {restaurant.settings?.openingHours && (
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">{t('guest.restaurantPage.openingHours')}</p>
                    <p className="text-sm text-gray-600">
                      {t('guest.restaurantPage.seeDetails')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('guest.restaurantPage.orderOnline')}</CardTitle>
              <CardDescription>
                {t('guest.restaurantPage.scanQR')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-8 bg-gray-100 rounded-lg text-center">
                <QrCode className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600">
                  {t('guest.restaurantPage.scanTableQR')}
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">{t('guest.restaurantPage.or')}</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  {t('guest.restaurantPage.enterTableNumber')}
                </p>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="number"
                    placeholder={t('guest.restaurantPage.tableNumber')}
                    className="flex-1 px-3 py-2 border rounded-md"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleTableSubmit()
                      }
                    }}
                  />
                  <Button onClick={handleTableSubmit}>
                    {t('guest.restaurantPage.continue')}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center text-sm text-gray-500">
                {restaurant._count.menuItems} {t('guest.restaurantPage.items')} • {restaurant._count.categories} {t('guest.restaurantPage.categories')}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {restaurant._count.categories}
                </div>
                <p className="text-sm text-gray-600">{t('guest.restaurantPage.categories')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {restaurant._count.menuItems}
                </div>
                <p className="text-sm text-gray-600">{t('guest.restaurantPage.dishes')}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {restaurant._count.tables}
                </div>
                <p className="text-sm text-gray-600">{t('guest.restaurantPage.tables')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}