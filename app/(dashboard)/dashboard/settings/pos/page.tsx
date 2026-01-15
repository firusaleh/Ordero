import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import POSSettingsClient from './client'

export default async function POSSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      OR: [
        { ownerId: session.user.id },
        { staff: { some: { userId: session.user.id } } }
      ]
    },
    include: {
      settings: true
    }
  })

  if (!restaurant) {
    redirect('/onboarding')
  }

  // Get POS settings from restaurant settings
  const posSettings = {
    posSystem: restaurant.settings?.posSystem || null,
    posApiKey: restaurant.settings?.posApiKey || null,
    posRestaurantId: restaurant.settings?.posRestaurantId || null,
    syncEnabled: restaurant.settings?.posSyncEnabled || false,
    lastSync: restaurant.settings?.posLastSync || null
  }

  return (
    <POSSettingsClient 
      restaurantId={restaurant.id}
      initialSettings={posSettings}
    />
  )
}