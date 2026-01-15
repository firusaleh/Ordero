import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import FeaturesSettingsClient from './client'

export default async function FeaturesSettingsPage() {
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
    }
  })

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