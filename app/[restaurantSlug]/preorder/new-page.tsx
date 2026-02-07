import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PreOrderMenuView from '@/components/guest/preorder-menu-view'
import { GuestLanguageProvider } from '@/contexts/guest-language-context'

async function getRestaurantMenu(slug: string) {
  const restaurant = await prisma.restaurant.findUnique({
    where: { 
      slug,
      status: 'ACTIVE'
    },
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
  
  // Debug logging für Restaurant-Daten
  console.log('Restaurant loaded for preorder page:', {
    name: restaurant.name,
    country: restaurant.country,
    settings: restaurant.settings,
    slug: restaurant.slug
  })

  return restaurant
}

export default async function PreOrderPageNew({ 
  params 
}: { 
  params: Promise<{ 
    restaurantSlug: string
  }>
}) {
  const { restaurantSlug } = await params
  const restaurant = await getRestaurantMenu(restaurantSlug)

  if (!restaurant) {
    notFound()
  }

  return (
    <GuestLanguageProvider>
      <PreOrderMenuView restaurant={restaurant} />
    </GuestLanguageProvider>
  )
}