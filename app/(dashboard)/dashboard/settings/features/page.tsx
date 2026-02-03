import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FeaturesSettingsClient from './client'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function FeaturesSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    redirect('/onboarding')
  }

  return (
    <FeaturesSettingsClient 
      restaurantId={restaurant.id}
      initialLogo={restaurant.logo || undefined}
    />
  )
}