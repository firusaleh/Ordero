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

  // Check if restaurant is offline
  if (restaurant.status !== 'ACTIVE') {
    return (
      <GuestLanguageProvider>
        <RestaurantOffline restaurant={restaurant} />
      </GuestLanguageProvider>
    )
  }

  return (
    <GuestLanguageProvider>
      <PreOrderMenuView restaurant={restaurant} />
    </GuestLanguageProvider>
  )
}