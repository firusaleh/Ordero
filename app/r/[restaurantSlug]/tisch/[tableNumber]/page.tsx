import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import GuestMenuViewWrapped from '@/components/guest/guest-menu-view-wrapped'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Tisch nicht gefunden</h1>
            <p className="text-gray-600 mb-6">
              Tisch {tableNum} existiert nicht oder ist nicht aktiv.
            </p>
            <a 
              href={`/r/${restaurantSlug}`}
              className="text-blue-600 hover:underline"
            >
              Zurück zur Restaurant-Seite
            </a>
          </div>
        </div>
      </div>
    )
  }

  return <GuestMenuViewWrapped 
    restaurant={restaurant} 
    table={table}
    tableNumber={tableNum}
  />
}