import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import LocalizationSettingsClient from './client'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function LocalizationSettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    redirect('/onboarding')
  }

  return (
    <LocalizationSettingsClient 
      restaurantId={restaurant.id}
      initialSettings={{
        language: restaurant.settings?.language || 'de',
        currency: restaurant.settings?.currency || 'EUR',
        timezone: restaurant.settings?.timezone || 'Europe/Berlin',
        dateFormat: restaurant.settings?.dateFormat || 'DD.MM.YYYY',
        timeFormat: restaurant.settings?.timeFormat || '24h'
      }}
    />
  )
}