'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Home, MapPin, Phone, ArrowLeft, Coffee, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSwitcher from '@/components/guest/language-switcher'

interface RestaurantOfflineProps {
  restaurant: {
    name: string
    description?: string | null
    phone?: string | null
    street?: string | null
    city?: string | null
    postalCode?: string | null
    settings?: {
      openingHours?: string | null
    } | null
  }
}

export default function RestaurantOffline({ restaurant }: RestaurantOfflineProps) {
  const { t } = useGuestLanguage()
  
  // Parse opening hours if available
  let openingHours: any = null
  try {
    if (restaurant.settings?.openingHours) {
      openingHours = typeof restaurant.settings.openingHours === 'string' 
        ? JSON.parse(restaurant.settings.openingHours)
        : restaurant.settings.openingHours
    }
  } catch (e) {
    console.error('Error parsing opening hours:', e)
  }

  const dayNames: { [key: string]: string } = {
    monday: t('guest.days.monday'),
    tuesday: t('guest.days.tuesday'),
    wednesday: t('guest.days.wednesday'),
    thursday: t('guest.days.thursday'),
    friday: t('guest.days.friday'),
    saturday: t('guest.days.saturday'),
    sunday: t('guest.days.sunday')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('guest.back')}
              </Button>
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          {/* Status Card */}
          <Card className="shadow-xl border-0 mb-8">
            <CardHeader className="text-center pb-8">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coffee className="h-12 w-12 text-orange-500" />
              </div>
              <CardTitle className="text-3xl mb-3">{restaurant.name}</CardTitle>
              <div className="flex items-center justify-center gap-2 mb-4">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-orange-600 font-medium">
                  {t('guest.offline.status')}
                </span>
              </div>
              <CardDescription className="text-lg">
                {t('guest.offline.message')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Opening Hours */}
              {openingHours && (
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    {t('guest.offline.openingHours')}
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(openingHours).map(([day, hours]: [string, any]) => (
                      <div key={day} className="flex justify-between text-sm">
                        <span className="font-medium">{dayNames[day] || day}</span>
                        <span className="text-gray-600">
                          {hours.isOpen && hours.timeSlots && hours.timeSlots.length > 0 ? (
                            hours.timeSlots.map((slot: any, index: number) => (
                              <span key={index}>
                                {index > 0 && ', '}
                                {slot.open} - {slot.close}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400">{t('guest.offline.closed')}</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5 text-gray-600" />
                  {t('guest.offline.contactUs')}
                </h3>
                
                {restaurant.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('guest.offline.callUs')}</p>
                      <a href={`tel:${restaurant.phone}`} className="font-medium text-blue-600 hover:underline">
                        {restaurant.phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {(restaurant.street || restaurant.city) && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('guest.offline.visitUs')}</p>
                      <p className="font-medium">
                        {restaurant.street && <span>{restaurant.street}, </span>}
                        {restaurant.postalCode && <span>{restaurant.postalCode} </span>}
                        {restaurant.city}
                      </p>
                    </div>
                  </div>
                )}

                {/* Reservation Hint */}
                <div className="flex items-center gap-3 mt-6 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <p className="text-sm">
                    {t('guest.offline.reservationHint')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                {restaurant.phone && (
                  <Button className="flex-1" variant="default" asChild>
                    <a href={`tel:${restaurant.phone}`}>
                      <Phone className="h-4 w-4 mr-2" />
                      {t('guest.offline.callNow')}
                    </a>
                  </Button>
                )}
                <Button className="flex-1" variant="outline" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    {t('guest.offline.backHome')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Text */}
          <p className="text-center text-sm text-gray-500">
            {t('guest.offline.checkBackLater')}
          </p>
        </div>
      </div>
    </div>
  )
}