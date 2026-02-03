import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentsSettingsClient from './client'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function PaymentsSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    redirect('/onboarding')
  }

  return (
    <PaymentsSettingsClient 
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      restaurantCountry={restaurant.country}
      userRole={session.user.role || 'USER'}
    />
  )
}