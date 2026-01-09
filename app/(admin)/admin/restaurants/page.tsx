import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AdminRestaurantsView from '@/components/admin/restaurants-view'

async function getRestaurants() {
  const restaurants = await prisma.restaurant.findMany({
    include: {
      owner: true,
      _count: {
        select: {
          orders: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Berechne Monatsumsätze
  const restaurantsWithRevenue = await Promise.all(
    restaurants.map(async (restaurant) => {
      const monthStart = new Date()
      monthStart.setDate(1)
      monthStart.setHours(0, 0, 0, 0)

      const monthlyOrders = await prisma.order.findMany({
        where: {
          restaurantId: restaurant.id,
          createdAt: {
            gte: monthStart
          },
          paymentStatus: 'PAID'
        },
        select: {
          total: true
        }
      })

      const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + (order.total || 0), 0)

      return {
        ...restaurant,
        monthlyRevenue,
        totalOrders: restaurant._count.orders
      }
    })
  )

  return restaurantsWithRevenue
}

export default async function AdminRestaurantsPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/admin')
  }

  const restaurants = await getRestaurants()

  return <AdminRestaurantsView restaurants={restaurants} />
}