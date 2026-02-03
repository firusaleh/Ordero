import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import RestaurantSetup from '@/components/dashboard/restaurant-setup'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getRestaurantData(userId: string) {
  const restaurant = await getSelectedRestaurant()

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