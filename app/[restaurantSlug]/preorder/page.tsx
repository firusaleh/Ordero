import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PreOrderMenuView from '@/components/guest/preorder-menu-view'
import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import RestaurantOffline from '@/components/guest/restaurant-offline'

interface PreOrderPageProps {
  params: Promise<{ restaurantSlug: string }>
}

async function getRestaurantMenu(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          menuItems: {
            where: { 
              isActive: true,
              isAvailable: true 
            },
            orderBy: { sortOrder: 'asc' }
          }
        }
      }
    }
  })

  if (!restaurant) {
    return null
  }
  
  // Filtere leere Kategorien heraus
  restaurant.categories = restaurant.categories.filter(
    category => category.menuItems && category.menuItems.length > 0
  )
  
  // Stelle sicher, dass Settings geladen sind
  if (!restaurant.settings) {
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id }
    })
    restaurant.settings = settings
  }
  
  return restaurant
}

export default async function PreOrderPage({ params }: PreOrderPageProps) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurantMenu(restaurantSlug)

  if (!restaurant) {
    notFound()
  }

  // Determine initial language based on restaurant country or language settings
  let initialLanguage: 'de' | 'en' | 'ar' = 'de'
  if (restaurant.country === 'JO' || restaurant.language === 'ar') {
    initialLanguage = 'ar'
  } else if (restaurant.language === 'en') {
    initialLanguage = 'en'
  }

  // Check if restaurant is offline
  if (restaurant.status !== 'ACTIVE') {
    return (
      <GuestLanguageProvider initialLanguage={initialLanguage}>
        <RestaurantOffline restaurant={restaurant} />
      </GuestLanguageProvider>
    )
  }

  return (
    <GuestLanguageProvider initialLanguage={initialLanguage}>
      <PreOrderMenuView restaurant={restaurant} />
    </GuestLanguageProvider>
  )
}