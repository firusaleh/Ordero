'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Etwas ist schiefgelaufen!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Es ist ein unerwarteter Fehler aufgetreten. Bitte versuchen Sie es später erneut.
          </p>

          <div className="space-y-3">
            <Button
              onClick={reset}
              className="w-full"
            >
              Erneut versuchen
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              Zur Startseite
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && error.message && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
              <p className="text-xs font-mono text-gray-600">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs font-mono text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}