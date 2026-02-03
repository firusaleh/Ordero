import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GuestMenuViewWrapped from '@/components/guest/guest-menu-view-wrapped'
import TableNotFound from '@/components/guest/table-not-found'
import { GuestLanguageProvider } from '@/contexts/guest-language-context'

// Revalidate every 60 seconds to ensure fresh menu data
export const revalidate = 60

async function getRestaurantMenu(slug: string, tableNumber: string) {
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
            orderBy: { sortOrder: 'asc' },
            // variants, extras und special properties sind embedded documents in MongoDB,
            // werden automatisch mit dem MenuItem geladen (inkl. isDailySpecial, isFeatured, specialPrice)
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
  
  // Debug logging für Restaurant-Daten
  console.log('Restaurant loaded for guest page:', {
    name: restaurant.name,
    country: restaurant.country,
    settings: restaurant.settings,
    slug: restaurant.slug
  })
  
  // Debug: Prüfe ob spezielle Properties vorhanden sind
  const dailySpecials = restaurant.categories.flatMap(cat => 
    cat.menuItems.filter(item => item.isDailySpecial)
  )
  const featuredItems = restaurant.categories.flatMap(cat => 
    cat.menuItems.filter(item => item.isFeatured)
  )
  
  console.log('Special menu items:', {
    dailySpecials: dailySpecials.map(item => ({
      name: item.name,
      isDailySpecial: item.isDailySpecial,
      specialPrice: item.specialPrice
    })),
    featuredItems: featuredItems.map(item => ({
      name: item.name,
      isFeatured: item.isFeatured
    }))
  })

  // Prüfe ob Tisch existiert
  const table = await prisma.table.findFirst({
    where: {
      restaurantId: restaurant.id,
      number: parseInt(tableNumber),
      isActive: true
    }
  })

  return { restaurant, table, tableNumber: parseInt(tableNumber) }
}

export default async function GuestMenuPage({ 
  params 
}: { 
  params: Promise<{ 
    restaurantSlug: string
    tableNumber: string
  }>
}) {
  const { restaurantSlug, tableNumber } = await params
  const data = await getRestaurantMenu(restaurantSlug, tableNumber)

  if (!data) {
    notFound()
  }

  const { restaurant, table, tableNumber: tableNum } = data

  // Wenn Tischnummer erforderlich ist und Tisch nicht existiert
  if (restaurant.settings?.requireTableNumber && !table) {
    return (
      <GuestLanguageProvider>
        <TableNotFound tableNumber={tableNum} restaurantSlug={restaurantSlug} />
      </GuestLanguageProvider>
    )
  }

  return <GuestMenuViewWrapped 
    restaurant={restaurant} 
    table={table}
    tableNumber={tableNum}
  />
}