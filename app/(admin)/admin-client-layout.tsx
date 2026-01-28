'use client'

import { ReactNode } from 'react'
import AdminSidebar from '@/components/layout/admin-sidebar'
import AdminHeader from '@/components/layout/admin-header'

export default function AdminClientLayout({
  children,
}: {
  children: ReactNode
}) {
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