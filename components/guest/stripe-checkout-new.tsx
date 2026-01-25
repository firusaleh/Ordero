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
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  CreditCard, 
  Check, 
  AlertCircle,
  Apple,
  Smartphone,
  Users,
  ArrowLeft
} from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { toast } from 'sonner'
import SplitBill from './split-bill'
import PayTabsCheckout from './paytabs-checkout'

// Initialisiere Stripe
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CartItem {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  variantId?: string
  variantName?: string
  extraIds: string[]
  extraNames: string[]
  extraPrices: number[]
  notes?: string
}

interface CartData {
  items: CartItem[]
  subtotal: number
  tax: number
  tip: number
}

interface StripeCheckoutProps {
  amount: number
  currency: string
  restaurantId: string
  tableId?: string
  tableNumber?: number
  tip: number
  cartData: CartData
  onSuccess: (pendingPaymentId: string, orderNumber: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

interface CheckoutFormProps extends StripeCheckoutProps {
  clientSecret: string
  pendingPaymentId: string
}

type PaymentMethod = 'apple_pay' | 'google_pay' | 'card'

// Hauptkomponente für Checkout
function CheckoutForm({
  amount,
  currency,
  restaurantId,
  tip,
  clientSecret,
  pendingPaymentId,
  onSuccess,
  onError,
  onCancel
}: CheckoutFormProps) {
  const { t } = useGuestLanguage()
  const stripe = useStripe()
  const elements = useElements()
  
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('apple_pay')
  const [showSplitBill, setShowSplitBill] = useState(false)
  const [splitDetails, setSplitDetails] = useState<any[]>([])

  const totalAmount = amount + tip

  const paymentMethods = [
    {
      id: 'apple_pay' as PaymentMethod,
      name: 'Apple Pay',
      icon: <Apple className="h-5 w-5" />,
      bgColor: 'bg-black text-white'
    },
    {
      id: 'google_pay' as PaymentMethod,
      name: 'Google Pay',
      icon: <div className="font-bold text-lg">G Pay</div>,
      bgColor: 'bg-white border border-gray-300'
    },
    {
      id: 'card' as PaymentMethod,
      name: 'Kreditkarte / Visa',
      icon: <CreditCard className="h-5 w-5" />,
      bgColor: 'bg-white border border-gray-300'
    }
  ]

  const handleSubmit = async () => {
    if (!stripe || !elements) {
      setErrorMessage('Stripe wurde noch nicht geladen.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: {
              address: {
                country: 'DE'
              }
            }
          }
        },
        redirect: 'if_required'
      })

      if (error) {
        console.error('Stripe payment error:', error)
        setErrorMessage(error.message || 'Zahlung fehlgeschlagen')
        onError(error.message || 'Zahlung fehlgeschlagen')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        try {
          // Poll for order creation (webhook creates the order)
          let orderNumber = ''
          let attempts = 0
          const maxAttempts = 30 // 30 seconds max

          while (attempts < maxAttempts) {
            const statusResponse = await fetch(`/api/payments/${pendingPaymentId}/status`)
            const statusResult = await statusResponse.json()

            if (statusResult.status === 'completed' && statusResult.orderNumber) {
              orderNumber = statusResult.orderNumber
              break
            }

            if (statusResult.status === 'failed') {
              throw new Error('Order creation failed')
            }

            // Wait 1 second before next poll
            await new Promise(resolve => setTimeout(resolve, 1000))
            attempts++
          }

          if (!orderNumber) {
            throw new Error('Timeout waiting for order confirmation')
          }

          toast.success('Zahlung erfolgreich!')
          onSuccess(pendingPaymentId, orderNumber)
        } catch (confirmError) {
          console.error('Payment confirmation error:', confirmError)
          toast.error('Zahlung erfolgreich, aber Bestellbestätigung verzögert.')
          // Still call success but with empty order number - order will be created by webhook
          onSuccess(pendingPaymentId, '')
        }
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setErrorMessage('Ein unerwarteter Fehler ist aufgetreten')
      onError('Unerwarteter Fehler')
    } finally {
      setIsProcessing(false)
    }
  }

  // Show split bill view if selected
  if (showSplitBill) {
    return (
      <SplitBill
        totalAmount={totalAmount}
        onProceed={(splits) => {
          setSplitDetails(splits)
          setShowSplitBill(false)
          // TODO: Handle split payments
          toast.info('Split bill feature coming soon!')
        }}
        onCancel={() => setShowSplitBill(false)}
      />
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6 p-4">
      {/* Payment Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Payment</h2>
        <div className="text-4xl font-bold text-orange-500">
          €{totalAmount.toFixed(2)}
        </div>
        
        {/* Split Bill Button */}
        <Button
          variant="outline"
          onClick={() => setShowSplitBill(true)}
          className="mt-2 gap-2"
        >
          <Users className="h-4 w-4" />
          Split the Bill
        </Button>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            disabled={isProcessing}
            className={`
              w-full flex items-center justify-between p-4 rounded-2xl transition-all
              cursor-pointer hover:shadow-md
              ${selectedMethod === method.id 
                ? 'ring-2 ring-orange-500 shadow-md' 
                : ''
              }
              ${method.id === 'apple_pay' && selectedMethod === 'apple_pay' 
                ? 'bg-black text-white' 
                : method.bgColor
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8">
                {method.icon}
              </div>
              <span className="font-medium text-lg">{method.name}</span>
            </div>
            {selectedMethod === method.id && (
              <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Stripe Payment Element direkt für Kreditkarte anzeigen */}
      {selectedMethod === 'card' && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <PaymentElement
            options={{
              layout: 'tabs',
              paymentMethodOrder: ['card'],
              fields: {
                billingDetails: {
                  address: {
                    country: 'never'
                  }
                }
              },
              wallets: {
                applePay: 'never',
                googlePay: 'never'
              }
            }}
          />
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={!stripe || isProcessing}
          className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-2xl"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            'Pay Now'
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing}
          className="w-full h-12 text-gray-600"
        >
          Cancel
        </Button>
      </div>

      {/* Security Info */}
      <div className="text-center text-xs text-gray-500 pt-4">
        🔒 Secure payment powered by Stripe
      </div>
    </div>
  )
}

// Wrapper-Komponente mit Stripe Elements Provider
export default function StripeCheckout(props: StripeCheckoutProps) {
  const { t } = useGuestLanguage()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  if (!stripePromise) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Online payment is not available. Please choose cash payment.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        // Create pending payment and get payment intent
        const response = await fetch('/api/stripe-connect/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId: props.restaurantId,
            tableId: props.tableId,
            tableNumber: props.tableNumber,
            amount: Math.round(props.amount * 100), // Convert to cents
            currency: props.currency.toLowerCase(),
            cartData: props.cartData
          })
        })

        const result = await response.json()
        console.log('Payment intent result:', result)

        if (result.clientSecret && result.pendingPaymentId) {
          setClientSecret(result.clientSecret)
          setPendingPaymentId(result.pendingPaymentId)
          console.log('Payment Intent created with fixed platform fee:', {
            pendingPaymentId: result.pendingPaymentId,
            total: result.amount,
            platformFeeCents: result.platformFee,
            platformFeeEUR: result.platformFeeEUR || (result.platformFee / 100),
            restaurantAmount: result.restaurantAmount
          })
        } else {
          throw new Error(result.error || 'Payment intent could not be created')
        }
      } catch (err) {
        console.error('Create payment intent failed:', err)
        setError(err instanceof Error ? err.message : 'Payment could not be initialized')
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [props.restaurantId, props.amount, props.currency, props.cartData])

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Preparing payment...</p>
      </div>
    )
  }

  if (error || !clientSecret || !pendingPaymentId) {
    return (
      <div className="max-w-md mx-auto p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Payment could not be initialized'}
          </AlertDescription>
        </Alert>
        <Button onClick={props.onCancel} variant="outline" className="w-full mt-4">
          Back
        </Button>
      </div>
    )
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#f97316',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '12px',
        spacingUnit: '4px'
      }
    },
    loader: 'auto' as const
  }

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      <CheckoutForm
        {...props}
        clientSecret={clientSecret}
        pendingPaymentId={pendingPaymentId}
      />
    </Elements>
  )
}