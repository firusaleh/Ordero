import { ReactNode } from 'react'

export default function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-block">
            <img src="/oriido-logo.png" alt="Oriido" className="h-20 w-auto mx-auto" />
          </a>
        </div>
        {children}
      </div>
    </div>
  )
}