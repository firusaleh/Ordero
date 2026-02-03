import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MenuWrapper from '@/components/dashboard/menu-wrapper'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getMenuData(userId: string) {
  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    return null
  }

  const categories = await prisma.category.findMany({
    where: {
      restaurantId: restaurant.id
    },
    include: {
      menuItems: {
        orderBy: {
          sortOrder: 'asc'
        }
      }
    },
    orderBy: {
      sortOrder: 'asc'
    }
  })

  // Check if POS is configured and active
  const hasPOS = !!(restaurant.settings?.posSystem && restaurant.settings?.posApiKey)

  return {
    restaurant,
    categories,
    posSettings: hasPOS ? {
      posSystem: restaurant.settings!.posSystem!,
      lastSync: restaurant.settings!.posLastSync ?? null
    } : null
  }
}

export default async function MenuPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getMenuData(session.user.id)

  if (!data) {
    redirect('/onboarding')
  }

  return <MenuWrapper
    restaurantId={data.restaurant.id}
    initialCategories={data.categories}
    posSettings={data.posSettings}
  />
}