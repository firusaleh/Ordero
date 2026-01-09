import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import AdminRestaurantSettings from '@/components/admin/restaurant-settings'

interface PageProps {
  params: Promise<{
    restaurantId: string
  }>
}

async function getRestaurant(restaurantId: string) {
  if (!restaurantId) {
    return null
  }
  
  try {
    const restaurant = await prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        owner: true,
        settings: true,
        categories: true,
        tables: true,
        menuItems: true,
        _count: {
          select: {
            orders: true,
            menuItems: true,
            tables: true,
            categories: true
          }
        }
      }
    })
    return restaurant
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return null
  }
}

export default async function AdminRestaurantSettingsPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const resolvedParams = await params
  const restaurant = await getRestaurant(resolvedParams.restaurantId)

  if (!restaurant) {
    notFound()
  }

  return <AdminRestaurantSettings restaurant={restaurant as any} />
}