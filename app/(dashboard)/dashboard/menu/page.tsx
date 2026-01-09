import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MenuManager from '@/components/dashboard/menu-manager'

async function getMenuData(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { staff: { some: { userId } } }
      ]
    }
  })

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

  return { restaurant, categories }
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

  return <MenuManager 
    restaurantId={data.restaurant.id} 
    initialCategories={data.categories}
  />
}