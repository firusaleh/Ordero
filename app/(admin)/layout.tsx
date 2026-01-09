import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/layout/admin-sidebar'
import AdminHeader from '@/components/layout/admin-header'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen bg-gray-900">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="text-white">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}