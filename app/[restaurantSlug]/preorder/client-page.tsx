'use client'

import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import PreOrderForm from '@/components/guest/preorder-form'
import LanguageSwitcher from '@/components/guest/language-switcher'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface Restaurant {
  id: string
  name: string
  description?: string | null
  logo?: string | null
  banner?: string | null
  primaryColor?: string | null
  phone?: string | null
  email?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  settings?: {
    language?: string | null
    currency?: string | null
  } | null
}

interface ClientPageContentProps {
  restaurant: Restaurant
  restaurantSlug: string
}

function ClientPageContent({ restaurant, restaurantSlug }: ClientPageContentProps) {
  const { t } = useGuestLanguage()
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="bg-cover bg-center h-48 relative"
        style={{ 
          backgroundImage: restaurant.banner ? `url(${restaurant.banner})` : undefined,
          backgroundColor: restaurant.primaryColor || '#3b82f6'
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 container mx-auto px-4 h-full">
          <div className="flex justify-between items-start pt-4">
            <div className="text-white flex-1 mt-8">
              {restaurant.logo && (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name}
                  className="h-16 w-16 rounded-lg mb-4 bg-white p-2"
                />
              )}
              <h1 className="text-3xl font-bold">{restaurant.name}</h1>
              {restaurant.description && (
                <p className="mt-2 text-white/90">{restaurant.description}</p>
              )}
            </div>
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* PreOrder Form */}
      <div className="container mx-auto px-4 py-8">
        <PreOrderForm 
          restaurantSlug={restaurantSlug}
          language={restaurant.settings?.language || 'de'}
        />
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">{t('guest.restaurantPage.phone')}</h3>
              <p className="text-sm text-gray-600">
                {restaurant.phone && <span className="block">{restaurant.phone}</span>}
                {restaurant.email && <span className="block">{restaurant.email}</span>}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{t('guest.restaurantPage.address')}</h3>
              <p className="text-sm text-gray-600">
                {restaurant.street && <span className="block">{restaurant.street}</span>}
                {restaurant.postalCode && restaurant.city && (
                  <span className="block">{restaurant.postalCode} {restaurant.city}</span>
                )}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Powered by</h3>
              <p className="text-sm text-gray-600">
                <a href="https://oriido.de" className="text-blue-600 hover:underline">
                  Oriido Restaurant System
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function ClientPreOrderPage({ restaurant, restaurantSlug }: ClientPageContentProps) {
  return (
    <GuestLanguageProvider>
      <ClientPageContent restaurant={restaurant} restaurantSlug={restaurantSlug} />
    </GuestLanguageProvider>
  )
}