'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Smartphone, Check, AlertCircle } from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { toast } from 'sonner'

// Initialisiere Stripe (wird gecacht)
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface StripeCheckoutProps {
  amount: number
  currency: string
  orderId: string
  restaurantId: string
  tip: number
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

interface CheckoutFormProps extends StripeCheckoutProps {
  clientSecret: string
}

// Hauptkomponente für Checkout
function CheckoutForm({ 
  amount, 
  currency, 
  orderId, 
  restaurantId, 
  tip, 
  clientSecret,
  onSuccess, 
  onError,
  onCancel
}: CheckoutFormProps) {
  const { t } = useGuestLanguage()
  const stripe = useStripe()
  const elements = useElements()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')

  const totalAmount = amount + tip

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      setErrorMessage(t('stripe.loading'))
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)
    setPaymentStatus('processing')

    try {
      // Bestätige die Zahlung
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'DE' // Land muss angegeben werden, da es im PaymentElement ausgeblendet wurde
              }
            }
          }
        },
        redirect: 'if_required' // Verhindert automatischen Redirect für 3D Secure
      })

      if (error) {
        console.error('Stripe payment error:', error)
        setPaymentStatus('failed')
        
        let userErrorMessage = 'Zahlung fehlgeschlagen'
        switch (error.code) {
          case 'card_declined':
            userErrorMessage = t('stripe.cardDeclined')
            break
          case 'insufficient_funds':
            userErrorMessage = 'Nicht genügend Guthaben auf der Karte verfügbar.'
            break
          case 'expired_card':
            userErrorMessage = t('stripe.cardExpired')
            break
          case 'incorrect_cvc':
            userErrorMessage = t('stripe.cvcInvalid')
            break
          case 'processing_error':
            userErrorMessage = t('stripe.processingError')
            break
          default:
            userErrorMessage = error.message || t('stripe.unknownError')
        }
        
        setErrorMessage(userErrorMessage)
        onError(userErrorMessage)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        setPaymentStatus('succeeded')
        
        // Informiere Backend über erfolgreiche Zahlung (Stripe Connect Route)
        try {
          const confirmResponse = await fetch('/api/stripe-connect/create-payment', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentIntentId: paymentIntent.id
            })
          })

          const confirmResult = await confirmResponse.json()
          
          if (confirmResult.success) {
            toast.success(t('guest.toast.paymentConfirmed'))
            onSuccess(paymentIntent.id)
          } else {
            throw new Error(confirmResult.error || 'Zahlungsbestätigung fehlgeschlagen')
          }
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError)
          // Zahlung war erfolgreich, aber Backend-Bestätigung fehlgeschlagen
          toast.error(t('guest.toast.paymentButConfirmFailed'))
          onError(t('guest.toast.confirmationFailed'))
        }
      } else {
        setPaymentStatus('failed')
        setErrorMessage(t('stripe.paymentFailed'))
        onError(t('stripe.paymentFailed'))
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setPaymentStatus('failed')
      setErrorMessage(t('stripe.unexpectedError'))
      onError(t('stripe.unexpectedError'))
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader2 className="h-5 w-5 animate-spin" />
      case 'succeeded':
        return <Check className="h-5 w-5 text-green-600" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <CreditCard className="h-5 w-5" />
    }
  }

  const getStatusText = () => {
    switch (paymentStatus) {
      case 'processing':
        return t('stripe.processing')
      case 'succeeded':
        return t('payment.succeeded') || 'Zahlung erfolgreich!'
      case 'failed':
        return t('payment.failed') || 'Zahlung fehlgeschlagen'
      default:
        return t('payment.payNow') || 'Jetzt bezahlen'
    }
  }

  return (
    <div className="space-y-4">
      {/* Zahlungsübersicht */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t('payment.securePayment')}
            <Badge variant="outline" className="ml-auto">
              <Smartphone className="h-3 w-3 mr-1" />
              Apple Pay & Google Pay
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>{t('common.subtotal')}</span>
            <span>€{amount.toFixed(2)}</span>
          </div>
          {tip > 0 && (
            <div className="flex justify-between text-sm font-medium text-green-600">
              <span>{t('checkout.tip')}</span>
              <span>€{tip.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>{t('common.total')}</span>
            <span>€{totalAmount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Payment Element */}
      <Card>
        <CardHeader>
          <CardTitle>{t('payment.paymentDetails')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border rounded-lg">
              <PaymentElement
                options={{
                  layout: 'tabs',
                  wallets: {
                    applePay: 'auto',
                    googlePay: 'auto'
                  },
                  paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
                  fields: {
                    billingDetails: {
                      address: {
                        country: 'never'
                      }
                    }
                  }
                }}
              />
            </div>
            
            {errorMessage && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              
              <Button
                type="submit"
                disabled={!stripe || isProcessing || paymentStatus === 'succeeded'}
                className="flex-1 flex items-center gap-2"
              >
                {getStatusIcon()}
                {getStatusText()}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Sicherheitshinweis */}
      <div className="text-xs text-center text-gray-500 space-y-1">
        <p>🔒 {t('payment.secureInfo')}</p>
        <p>💳 {t('payment.supportedCards')}</p>
        <p>📱 {t('stripe.autoDisplay')}</p>
      </div>
    </div>
  )
}

// Wrapper-Komponente mit Stripe Elements Provider
export default function StripeCheckout(props: StripeCheckoutProps) {
  const { t } = useGuestLanguage()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prüfe ob Stripe konfiguriert ist
  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t('stripe.notAvailable')}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs">
                  Dev: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY fehlt in .env.local
                </div>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  // Erstelle Payment Intent beim Laden der Komponente
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // WICHTIG: Verwende stripe-connect Route für korrekte Geldverteilung!
        const response = await fetch('/api/stripe-connect/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: props.orderId,
            amount: Math.round((props.amount + props.tip) * 100), // Konvertiere zu Cents
            currency: props.currency.toLowerCase(),
            restaurantId: props.restaurantId
          })
        })

        const result = await response.json()
        
        if (result.clientSecret) {
          setClientSecret(result.clientSecret)
          console.log('Payment Intent created with fixed platform fee:', {
            total: result.amount,
            platformFeeCents: result.platformFee,
            platformFeeEUR: result.platformFeeEUR || (result.platformFee / 100),
            restaurantAmount: result.restaurantAmount
          })
        } else {
          throw new Error(result.error || t('stripe.paymentIntentFailed'))
        }
      } catch (err) {
        console.error('Create payment intent failed:', err)
        setError(err instanceof Error ? err.message : t('stripe.initFailed'))
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [props.orderId, props.amount, props.currency, props.restaurantId, props.tip])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('stripe.preparing')}</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !clientSecret) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || t('stripe.initFailed')}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={props.onCancel} variant="outline" className="w-full">
              {t('common.back')}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#3b82f6',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '8px'
      },
      rules: {
        '.Label': {
          fontWeight: '500'
        },
        '.Tab': {
          border: '1px solid #e5e7eb',
          boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.04)'
        },
        '.Tab:hover': {
          backgroundColor: '#f9fafb'
        },
        '.Tab--selected': {
          borderColor: '#3b82f6',
          boxShadow: '0px 1px 1px rgba(59, 130, 246, 0.1), 0px 0px 0px 1px #3b82f6'
        }
      }
    },
    loader: 'auto' as const
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <CheckoutForm {...props} clientSecret={clientSecret} />
    </Elements>
  )
}