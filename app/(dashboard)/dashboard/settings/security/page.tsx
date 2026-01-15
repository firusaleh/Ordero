import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SecuritySettingsClient from './client'

export default async function SecuritySettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return <SecuritySettingsClient />
}