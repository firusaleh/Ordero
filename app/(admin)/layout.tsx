import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminClientLayout from './admin-client-layout'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }
  
  return <AdminClientLayout>{children}</AdminClientLayout>
}