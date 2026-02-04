import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import RestaurantOffline from '@/components/guest/restaurant-offline'
import RestaurantOnlineContent from '@/components/guest/restaurant-online-content'

// Revalidate every 60 seconds to ensure fresh data
export const revalidate = 60

interface RestaurantPageProps {
  params: Promise<{ restaurantSlug: string }>
}

async function getRestaurant(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      settings: true,
      _count: {
        select: {
          tables: true,
          menuItems: true,
          categories: true
        }
      }
    }
  })

  return restaurant
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurant(restaurantSlug)

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

  // Restaurant is online, show normal page
  return (
    <GuestLanguageProvider initialLanguage={initialLanguage}>
      <RestaurantOnlineContent restaurant={restaurant} />
    </GuestLanguageProvider>
  )
}