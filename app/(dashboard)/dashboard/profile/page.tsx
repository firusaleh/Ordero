import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import ProfileViewTranslated from '@/components/dashboard/profile-view-translated'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return <ProfileViewTranslated user={session.user} />
}