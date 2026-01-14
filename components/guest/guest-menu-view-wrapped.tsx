'use client'

import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import GuestMenuViewElegant from './guest-menu-view-elegant'

interface GuestMenuViewWrappedProps {
  restaurant: any
  table: any
  tableNumber: number
}

export default function GuestMenuViewWrapped(props: GuestMenuViewWrappedProps) {
  return (
    <GuestLanguageProvider>
      <GuestMenuViewElegant {...props} />
    </GuestLanguageProvider>
  )
}