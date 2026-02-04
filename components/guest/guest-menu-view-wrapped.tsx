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
  // Determine initial language based on restaurant country or language settings
  let initialLanguage: 'de' | 'en' | 'ar' = 'de'
  if (props.restaurant.country === 'JO' || props.restaurant.language === 'ar') {
    initialLanguage = 'ar'
  } else if (props.restaurant.language === 'en') {
    initialLanguage = 'en'
  }

  return (
    <GuestLanguageProvider initialLanguage={initialLanguage}>
      <GuestMenuViewMockup {...props} />
      <Toaster position="bottom-center" richColors />
    </GuestLanguageProvider>
  )
}