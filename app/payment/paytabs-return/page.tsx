'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function PayTabsReturnContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing')
  const [message, setMessage] = useState('Zahlung wird überprüft...')

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get transaction data from session storage
        const sessionData = sessionStorage.getItem('paytabs_transaction')
        if (!sessionData) {
          throw new Error('Keine Transaktionsdaten gefunden')
        }

        const { transactionRef, orderId, restaurantId } = JSON.parse(sessionData)
        
        // Get PayTabs response parameters
        const tranRef = searchParams.get('tranRef') || searchParams.get('tran_ref')
        const respStatus = searchParams.get('respStatus') || searchParams.get('response_status')
        const respCode = searchParams.get('respCode') || searchParams.get('response_code')
        const respMessage = searchParams.get('respMessage') || searchParams.get('response_message')

        console.log('PayTabs return params:', {
          tranRef,
          respStatus,
          respCode,
          respMessage
        })

        // Check if payment was successful (status 'A' means Approved)
        if (respStatus === 'A' || respCode === '000') {
          // Verify payment on server
          const response = await fetch('/api/payment/verify-paytabs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transactionRef: tranRef || transactionRef,
              orderId,
              restaurantId
            })
          })

          const result = await response.json()
          
          if (result.success) {
            setStatus('success')
            setMessage('Zahlung erfolgreich!')
            
            // Clear session data
            sessionStorage.removeItem('paytabs_transaction')
            
            // Redirect to success page after 2 seconds
            setTimeout(() => {
              router.push(`/guest/order/${orderId}/success`)
            }, 2000)
          } else {
            throw new Error(result.error || 'Zahlungsbestätigung fehlgeschlagen')
          }
        } else {
          // Payment was declined or cancelled
          const errorMessage = respMessage || 'Zahlung wurde abgelehnt'
          throw new Error(errorMessage)
        }
      } catch (error) {
        console.error('Payment verification failed:', error)
        setStatus('failed')
        setMessage(error instanceof Error ? error.message : 'Zahlung fehlgeschlagen')
        
        // Redirect back to checkout after 3 seconds
        setTimeout(() => {
          router.back()
        }, 3000)
      }
    }

    verifyPayment()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center space-y-4">
          {status === 'processing' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
              <h2 className="text-xl font-semibold">Zahlung wird verarbeitet</h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
              <h2 className="text-xl font-semibold text-green-700">Zahlung erfolgreich!</h2>
              <p className="text-gray-600">{message}</p>
              <p className="text-sm text-gray-500">Sie werden weitergeleitet...</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-red-700">Zahlung fehlgeschlagen</h2>
              <p className="text-gray-600">{message}</p>
              <Button 
                onClick={() => router.back()} 
                className="mt-4"
              >
                Zurück zum Checkout
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function PayTabsReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
            <h2 className="text-xl font-semibold">Zahlung wird geladen...</h2>
          </div>
        </Card>
      </div>
    }>
      <PayTabsReturnContent />
    </Suspense>
  )
}