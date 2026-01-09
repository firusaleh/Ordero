"use client"

import { SessionProvider } from "next-auth/react"
import { PusherProvider } from "./pusher-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { ReactNode } from "react"

interface ProvidersProps {
  children: ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={true}>
      <LanguageProvider>
        <PusherProvider>
          {children}
        </PusherProvider>
      </LanguageProvider>
    </SessionProvider>
  )
}