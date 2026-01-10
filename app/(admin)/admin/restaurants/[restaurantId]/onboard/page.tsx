import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import RestaurantOnboarding from '@/components/admin/restaurant-onboarding'

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
        menuItems: true
      }
    })
    return restaurant
  } catch (error) {
    console.error('Error fetching restaurant:', error)
    return null
  }
}

export default async function RestaurantOnboardingPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/dashboard')
  }

  // In Next.js 15+ params is a Promise
  const resolvedParams = await params
  const restaurant = await getRestaurant(resolvedParams.restaurantId)

  if (!restaurant) {
    notFound()
  }

  return <RestaurantOnboarding restaurant={restaurant} />
}