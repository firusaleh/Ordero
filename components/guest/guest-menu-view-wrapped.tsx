'use client'

import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import { Toaster } from 'sonner'
import GuestMenuViewMockup from './guest-menu-view-mockup'

interface GuestMenuViewWrappedProps {
  restaurant: any
  table: any
  tableNumber: number
}

export default function GuestMenuViewWrapped(props: GuestMenuViewWrappedProps) {
  return (
    <GuestLanguageProvider>
      <GuestMenuViewMockup {...props} />
      <Toaster position="bottom-center" richColors />
    </GuestLanguageProvider>
  )
}