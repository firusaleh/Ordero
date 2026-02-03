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

  // Check if restaurant is offline
  if (restaurant.status !== 'ACTIVE') {
    return (
      <GuestLanguageProvider>
        <RestaurantOffline restaurant={restaurant} />
      </GuestLanguageProvider>
    )
  }

  // Restaurant is online, show normal page
  return (
    <GuestLanguageProvider>
      <RestaurantOnlineContent restaurant={restaurant} />
    </GuestLanguageProvider>
  )
}