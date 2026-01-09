import { ReactNode } from 'react'
import OnboardingHeader from '@/components/onboarding/onboarding-header'

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <OnboardingHeader />
        {children}
      </div>
    </div>
  )
}