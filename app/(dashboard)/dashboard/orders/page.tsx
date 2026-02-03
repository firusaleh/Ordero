import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import OrdersViewRealtime from '@/components/dashboard/orders-view-realtime'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getRestaurantData(userId: string) {
  const restaurant = await getSelectedRestaurant()
  
  return restaurant
}

export default async function OrdersPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getRestaurantData(session.user.id)

  if (!restaurant) {
    redirect('/onboarding')
  }

  return <OrdersViewRealtime restaurantId={restaurant.id} />
}