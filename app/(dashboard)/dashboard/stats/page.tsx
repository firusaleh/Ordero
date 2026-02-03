import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StatsClient from '@/components/dashboard/stats-client'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getRestaurantId(userId: string) {
  const restaurant = await getSelectedRestaurant()
  
  return restaurant?.id
}

export default async function StatsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurantId = await getRestaurantId(session.user.id)
  
  if (!restaurantId) {
    redirect('/onboarding')
  }

  return <StatsClient restaurantId={restaurantId} />
}