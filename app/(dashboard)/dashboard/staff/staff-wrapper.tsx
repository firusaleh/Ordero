import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StaffManager from '@/components/dashboard/staff-manager'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function StaffWrapper() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  // Hole das erste Restaurant des Nutzers
  const restaurant = await getSelectedRestaurant() as any

  if (!restaurant) {
    redirect('/dashboard/restaurant-setup')
  }

  // Formatiere die Mitarbeiter-Daten
  const staffMembers = [
    // Owner als Manager hinzufügen
    {
      id: restaurant.owner.id,
      name: restaurant.owner.name || 'Restaurant Besitzer',
      email: restaurant.owner.email || '',
      role: 'manager' as const,
      isOwner: true,
      createdAt: restaurant.createdAt
    },
    // Mitarbeiter hinzufügen
    ...restaurant.staff.map((member: any) => ({
      id: member.id,
      name: member.user.name || member.user.email || 'Mitarbeiter',
      email: member.user.email || '',
      role: member.role.toLowerCase() as 'waiter' | 'kitchen' | 'manager',
      isOwner: false,
      createdAt: member.createdAt
    }))
  ]

  return <StaffManager 
    restaurantId={restaurant.id} 
    staffMembers={staffMembers}
    currentUserId={session.user.id}
    isOwner={restaurant.ownerId === session.user.id}
  />
}