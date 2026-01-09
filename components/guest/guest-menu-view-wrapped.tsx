'use client'

import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import GuestMenuViewSimple from './guest-menu-view-simple'

interface GuestMenuViewWrappedProps {
  restaurant: any
  table: any
  tableNumber: number
}

export default function GuestMenuViewWrapped(props: GuestMenuViewWrappedProps) {
  return (
    <GuestLanguageProvider>
      <GuestMenuViewSimple {...props} />
    </GuestLanguageProvider>
  )
}