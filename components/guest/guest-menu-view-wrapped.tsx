'use client'

import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import GuestMenuViewBeautiful from './guest-menu-view-beautiful'

interface GuestMenuViewWrappedProps {
  restaurant: any
  table: any
  tableNumber: number
}

export default function GuestMenuViewWrapped(props: GuestMenuViewWrappedProps) {
  return (
    <GuestLanguageProvider>
      <GuestMenuViewBeautiful {...props} />
    </GuestLanguageProvider>
  )
}