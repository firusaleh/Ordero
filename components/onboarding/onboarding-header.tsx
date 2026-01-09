"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut, Loader2 } from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

export default function OnboardingHeader() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (error) {
      toast.error('Fehler beim Abmelden')
      setIsSigningOut(false)
    }
  }

  return (
    <div className="flex justify-end mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="text-gray-500 hover:text-gray-900"
      >
        {isSigningOut ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Abmelden...
          </>
        ) : (
          <>
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </>
        )}
      </Button>
    </div>
  )
}