'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { PusherProvider } from './providers/pusher-provider'
import { LanguageProvider } from '@/contexts/language-context'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <PusherProvider>
          {children}
        </PusherProvider>
      </LanguageProvider>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
          },
        }}
      />
    </SessionProvider>
  )
}