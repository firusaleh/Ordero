'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  CreditCard, 
  AlertCircle,
  ExternalLink,
  Shield
} from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { toast } from 'sonner'

interface PayTabsCheckoutProps {
  amount: number
  currency: string
  orderId: string
  restaurantId: string
  tip: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

export default function PayTabsCheckout({
  amount,
  currency,
  orderId,
  restaurantId,
  tip,
  onSuccess,
  onError,
  onCancel
}: PayTabsCheckoutProps) {
  const { t } = useGuestLanguage()
  const [isLoading, setIsLoading] = useState(true)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const [transactionRef, setTransactionRef] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const totalAmount = amount + tip

  useEffect(() => {
    const createPaymentPage = async () => {
      try {
        const response = await fetch('/api/payment/create-paytabs-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId,
            amount,
            currency,
            restaurantId,
            tip,
            returnUrl: `${window.location.origin}/payment/paytabs-return`,
            callbackUrl: `${window.location.origin}/api/webhooks/paytabs`
          })
        })

        const result = await response.json()
        
        if (result.success && result.redirectUrl) {
          setRedirectUrl(result.redirectUrl)
          setTransactionRef(result.transactionRef)
        } else {
          throw new Error(result.error || t('paytabs.initFailed'))
        }
      } catch (err) {
        console.error('PayTabs initialization failed:', err)
        setError(err instanceof Error ? err.message : t('paytabs.generalInitFailed'))
        onError(err instanceof Error ? err.message : t('errors.general'))
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentPage()
  }, [orderId, amount, currency, restaurantId, tip, onError])

  const handlePayNow = () => {
    if (redirectUrl) {
      // Speichere die Transaction Ref für die Rückkehr
      sessionStorage.setItem('paytabs_transaction', JSON.stringify({
        transactionRef,
        orderId,
        restaurantId,
        amount: totalAmount
      }))
      
      // Weiterleitung zur PayTabs Payment Page
      window.location.href = redirectUrl
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{t('paytabs.preparing')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={onCancel} variant="outline" className="w-full mt-4">
          {t('paytabs.back')}
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      {/* Payment Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">{t('paytabs.paymentTitle')}</h2>
        <div className="text-4xl font-bold text-orange-500">
          {currency} {totalAmount.toFixed(2)}
        </div>
      </div>

      {/* PayTabs Information */}
      <Card className="p-6 bg-gradient-to-br from-green-50 to-blue-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">PayTabs Secure Payment</span>
            </div>
            <img 
              src="/images/paytabs-logo.png" 
              alt="PayTabs" 
              className="h-8"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>{t('paytabs.secureProcessing')}</p>
            <p>{t('paytabs.localMethods')}</p>
            <p>{t('paytabs.pciCertified')}</p>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-sm">
              {t('paytabs.redirectNotice')}
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Payment Methods Info */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">{t('paytabs.availableMethods')}</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>Visa / Mastercard</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>{t('paytabs.mada')}</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>American Express</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gray-500" />
            <span>Apple Pay</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handlePayNow}
          disabled={!redirectUrl}
          className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl group"
        >
          {t('paytabs.payNow')}
          <ExternalLink className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full h-12 text-gray-600"
        >
          {t('paytabs.cancel')}
        </Button>
      </div>

      {/* Security Info */}
      <div className="text-center text-xs text-gray-500 pt-4">
        {t('paytabs.secureFooter')}
      </div>
    </div>
  )
}