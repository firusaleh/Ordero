import { ReactNode } from 'react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-grid-gray-100/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />
      <div className="relative z-10">
        <header className="border-b bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <img src="/oriido-logo.png" alt="Oriido" className="h-12 w-auto" />
            </div>
            <div className="text-sm text-gray-600">
              Angemeldet als: {session.user.email}
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-12">
          {children}
        </main>
      </div>
    </div>
  )
}