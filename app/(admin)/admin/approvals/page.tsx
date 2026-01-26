import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import RestaurantApprovals from './restaurant-approvals'

export default async function ApprovalsPage() {
  const session = await auth()
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    redirect('/login')
  }

  return <RestaurantApprovals />
}