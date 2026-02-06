import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GuestMenuViewWrapped from '@/components/guest/guest-menu-view-wrapped'
import TableNotFound from '@/components/guest/table-not-found'
import { GuestLanguageProvider } from '@/contexts/guest-language-context'

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
            // variants und extras sind embedded documents in MongoDB,
            // werden automatisch mit dem MenuItem geladen
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
  console.log('Restaurant loaded for guest page:', {
    name: restaurant.name,
    country: restaurant.country,
    settings: restaurant.settings,
    slug: restaurant.slug
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

  // Determine initial language based on restaurant country or language settings
  let initialLanguage: 'de' | 'en' | 'ar' = 'de'
  if (restaurant.country === 'JO' || restaurant.language === 'ar') {
    initialLanguage = 'ar'
  } else if (restaurant.language === 'en') {
    initialLanguage = 'en'
  }

  // Wenn Tischnummer erforderlich ist und Tisch nicht existiert
  if (restaurant.settings?.requireTableNumber && !table) {
    return (
      <GuestLanguageProvider initialLanguage={initialLanguage}>
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