import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/sidebar'
import DashboardHeader from '@/components/layout/dashboard-header'
import { getSelectedRestaurant } from '@/app/actions/restaurants'

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  // Hole das aktuell ausgewählte Restaurant
  const currentRestaurant = await getSelectedRestaurant()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="lg:pl-64 rtl:lg:pl-0 rtl:lg:pr-64">
        <DashboardHeader currentRestaurantId={currentRestaurant?.id} />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}