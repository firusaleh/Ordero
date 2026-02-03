import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import GeneralSettingsClient from './client'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

async function getRestaurantData(userId: string) {
  const restaurant = await getSelectedRestaurant()

  if (!restaurant) {
    return null
  }

  return restaurant
}

interface PageProps {
  params: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function GeneralSettingsPage({ params }: PageProps) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const restaurant = await getRestaurantData(session.user.id)

  if (!restaurant) {
    redirect('/onboarding')
  }

  // Transform the restaurant data to match the expected format
  const restaurantData = {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    description: restaurant.description,
    cuisine: restaurant.cuisine,
    street: restaurant.street,
    city: restaurant.city,
    postalCode: restaurant.postalCode,
    country: restaurant.country,
    phone: restaurant.phone,
    email: restaurant.email,
    website: restaurant.website,
    logo: restaurant.logo,
    coverImage: (restaurant as any).coverImage || restaurant.banner,
    primaryColor: restaurant.primaryColor
  }

  // Transform settings data
  const settingsData = restaurant.settings ? {
    orderingEnabled: restaurant.settings.orderingEnabled,
    requireTableNumber: restaurant.settings.requireTableNumber,
    allowTakeaway: restaurant.settings.allowTakeaway,
    emailNotifications: restaurant.settings.emailNotifications,
    soundNotifications: restaurant.settings.soundNotifications,
    currency: restaurant.settings.currency,
    language: restaurant.settings.language,
    openingHours: restaurant.settings.openingHours
  } : null

  return (
    <GeneralSettingsClient 
      restaurant={restaurantData}
      settings={settingsData}
    />
  )
}