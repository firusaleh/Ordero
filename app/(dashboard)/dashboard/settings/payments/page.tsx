import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import PaymentsSettingsClient from './client'

export default async function PaymentsSettingsPage() {
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
    <PaymentsSettingsClient 
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      userRole={session.user.role || 'USER'}
    />
  )
}