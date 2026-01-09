import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import RestaurantSetup from '@/components/dashboard/restaurant-setup'

async function getRestaurantData(userId: string) {
  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: userId },
        { staff: { some: { userId } } }
      ]
    },
    include: {
      settings: true,
      categories: true,
      menuItems: true,
      tables: true,
      _count: {
        select: {
          categories: true,
          menuItems: true,
          tables: true,
          orders: true
        }
      }
    }
  })

  return restaurant
}

export default async function SetupPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getRestaurantData(session.user.id)

  if (!restaurant) {
    redirect('/onboarding')
  }

  return <RestaurantSetup restaurant={restaurant} />
}