'use client'

import { useState, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  ExpressCheckoutElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { toast } from 'sonner'

// Initialize Stripe
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

interface IntegratedCheckoutProps {
  restaurantId: string
  tableId?: string
  tableNumber?: number
  subtotal: number
  serviceFee: number
  tipAmount: number
  currency: string
  currencySymbol: string
  cartItems: CartItem[]
  selectedPaymentMethod: string
  selectedTipOption: string
  onTipChange: (option: string, amount: number) => void
  onPaymentMethodChange: (method: string) => void
  onSuccess: (pendingPaymentId: string, orderNumber: string) => void
  onCashOrder: () => void
  onError: (error: string) => void
  isProcessingCash: boolean
  primaryColor?: string
  t: (key: string) => string
  formatPrice: (price: number) => string
}

// Inner form with Stripe context
function CheckoutFormContent({
  subtotal,
  serviceFee,
  tipAmount,
  currency,
  currencySymbol,
  selectedPaymentMethod,
  selectedTipOption,
  onTipChange,
  onPaymentMethodChange,
  onSuccess,
  onCashOrder,
  onError,
  isProcessingCash,
  pendingPaymentId,
  primaryColor = '#FF6B35',
  t,
  formatPrice
}: IntegratedCheckoutProps & { pendingPaymentId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false)
  const [availableExpressMethods, setAvailableExpressMethods] = useState<{applePay: boolean, googlePay: boolean}>({
    applePay: false,
    googlePay: false
  })

  const total = subtotal + serviceFee + tipAmount

  // Express Checkout handlers
  const onExpressCheckoutReady = useCallback(({ availablePaymentMethods }: any) => {
    if (availablePaymentMethods) {
      setAvailableExpressMethods({
        applePay: !!availablePaymentMethods.applePay,
        googlePay: !!availablePaymentMethods.googlePay
      })
      setExpressCheckoutReady(
        !!availablePaymentMethods.applePay || !!availablePaymentMethods.googlePay
      )
    }
  }, [])

  const onExpressCheckoutClick = useCallback(({ resolve }: any) => {
    resolve({ emailRequired: false, phoneNumberRequired: false })
  }, [])

  const onExpressCheckoutConfirm = useCallback(async () => {
    if (!stripe || !elements) return

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required'
      })

      if (error) {
        setErrorMessage(error.message || 'Zahlung fehlgeschlagen')
        onError(error.message || 'Zahlung fehlgeschlagen')
      } else {
        await pollForOrderCompletion()
      }
    } catch (err) {
      console.error('Express checkout error:', err)
      setErrorMessage('Ein unerwarteter Fehler ist aufgetreten')
      onError('Unerwarteter Fehler')
    } finally {
      setIsProcessing(false)
    }
  }, [stripe, elements, onError])

  // Poll for order completion
  const pollForOrderCompletion = async () => {
    try {
      let orderNumber = ''
      let attempts = 0
      const maxAttempts = 30

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

        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }

      if (!orderNumber) {
        throw new Error('Timeout waiting for order confirmation')
      }

      toast.success(t('checkout.paymentSuccess') || 'Zahlung erfolgreich!')
      onSuccess(pendingPaymentId, orderNumber)
    } catch (confirmError) {
      console.error('Payment confirmation error:', confirmError)
      toast.error(t('checkout.confirmationDelayed') || 'Zahlung erfolgreich, aber Bestellbestätigung verzögert.')
      onSuccess(pendingPaymentId, '')
    }
  }

  // Handle Card payment
  const handleCardPayment = async () => {
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
              address: { country: 'DE' }
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
        await pollForOrderCompletion()
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setErrorMessage('Ein unerwarteter Fehler ist aufgetreten')
      onError('Unerwarteter Fehler')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle pay button click
  const handlePayClick = () => {
    if (selectedPaymentMethod === 'CASH') {
      onCashOrder()
    } else if (selectedPaymentMethod === 'CARD') {
      handleCardPayment()
    }
    // Apple Pay and Google Pay are handled by ExpressCheckoutElement
  }

  const tipOptions = [
    { value: '0', percent: 0, emoji: '😐' },
    { value: '5', percent: 5, emoji: '🙂' },
    { value: '10', percent: 10, emoji: '😊' },
    { value: '15', percent: 15, emoji: '😃' },
    { value: '20', percent: 20, emoji: '😍' },
  ]

  return (
    <div className="bg-white">
      {/* Hidden Express Checkout for detection */}
      <div className="hidden">
        <ExpressCheckoutElement
          onReady={onExpressCheckoutReady}
          onClick={onExpressCheckoutClick}
          onConfirm={onExpressCheckoutConfirm}
        />
      </div>

      {/* Price Breakdown */}
      <div className="px-6 py-6 border-b">
        <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-xl">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">{t('payment.subtotal')}</span>
            <span className="text-gray-900">{formatPrice(subtotal)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{t('payment.serviceFee')}</span>
              <span className="text-gray-900">{formatPrice(serviceFee)}</span>
            </div>
          )}
          {tipAmount > 0 && (
            <div className="flex justify-between items-center text-sm text-green-600">
              <span>{t('checkout.tip') || 'Trinkgeld'}</span>
              <span>{formatPrice(tipAmount)}</span>
            </div>
          )}
          <div className="flex justify-between items-center font-semibold pt-2 border-t">
            <span>{t('payment.total') || 'Gesamt'}</span>
            <span className="text-xl" style={{ color: primaryColor }}>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Tip Options */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('payment.tipQuestion')}</p>
          <div className="grid grid-cols-5 gap-2">
            {tipOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onTipChange(option.value, subtotal * (option.percent / 100))}
                className={`py-3 px-2 rounded-xl transition-all flex flex-col items-center gap-1 ${
                  selectedTipOption === option.value
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={selectedTipOption === option.value ? { backgroundColor: primaryColor } : {}}
              >
                <span className="text-xl">{option.emoji}</span>
                <span className="text-xs font-medium">
                  {option.percent === 0 ? (t('payment.noTip') || 'Nein') : `${option.percent}%`}
                </span>
                {option.percent > 0 && (
                  <span className="text-xs opacity-75">
                    {currencySymbol}{(subtotal * option.percent / 100).toFixed(2)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-6 py-4 bg-gray-50">
        <p className="text-sm font-semibold text-gray-700 mb-3">{t('payment.selectMethod')}</p>
        <div className="space-y-2">
          {/* Apple Pay - only show if available */}
          {availableExpressMethods.applePay && (
            <button
              className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                selectedPaymentMethod === 'APPLE_PAY' ? 'bg-orange-50' : 'border-transparent hover:border-gray-300'
              }`}
              style={selectedPaymentMethod === 'APPLE_PAY' ? { borderColor: primaryColor } : {}}
              onClick={() => onPaymentMethodChange('APPLE_PAY')}
            >
              <div className="w-12 h-8 bg-black rounded-lg flex items-center justify-center text-white text-lg">

              </div>
              <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.applePay')}</span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPaymentMethod === 'APPLE_PAY' ? primaryColor : '#e5e7eb' }}
              >
                {selectedPaymentMethod === 'APPLE_PAY' && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          )}

          {/* Google Pay - only show if available */}
          {availableExpressMethods.googlePay && (
            <button
              className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                selectedPaymentMethod === 'GOOGLE_PAY' ? 'bg-orange-50' : 'border-transparent hover:border-gray-300'
              }`}
              style={selectedPaymentMethod === 'GOOGLE_PAY' ? { borderColor: primaryColor } : {}}
              onClick={() => onPaymentMethodChange('GOOGLE_PAY')}
            >
              <div className="w-12 h-8 bg-white border rounded-lg flex items-center justify-center font-bold text-xs">
                G Pay
              </div>
              <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.googlePay')}</span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: selectedPaymentMethod === 'GOOGLE_PAY' ? primaryColor : '#e5e7eb' }}
              >
                {selectedPaymentMethod === 'GOOGLE_PAY' && <Check className="h-3 w-3 text-white" />}
              </div>
            </button>
          )}

          {/* Credit Card */}
          <button
            className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
              selectedPaymentMethod === 'CARD' ? 'bg-orange-50' : 'border-transparent hover:border-gray-300'
            }`}
            style={selectedPaymentMethod === 'CARD' ? { borderColor: primaryColor } : {}}
            onClick={() => onPaymentMethodChange('CARD')}
          >
            <div className="w-12 h-8 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white">
              💳
            </div>
            <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.creditCard')}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedPaymentMethod === 'CARD' ? primaryColor : '#e5e7eb' }}
            >
              {selectedPaymentMethod === 'CARD' && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>

          {/* Cash */}
          <button
            className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
              selectedPaymentMethod === 'CASH' ? 'bg-orange-50' : 'border-transparent hover:border-gray-300'
            }`}
            style={selectedPaymentMethod === 'CASH' ? { borderColor: primaryColor } : {}}
            onClick={() => onPaymentMethodChange('CASH')}
          >
            <div className="w-12 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
              💵
            </div>
            <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.cash')}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedPaymentMethod === 'CASH' ? primaryColor : '#e5e7eb' }}
            >
              {selectedPaymentMethod === 'CASH' && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>
        </div>

        {/* Card Input - shown inline when Card is selected */}
        {selectedPaymentMethod === 'CARD' && (
          <div className="mt-4 p-4 bg-white rounded-xl border">
            <PaymentElement
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card'],
                fields: {
                  billingDetails: {
                    address: { country: 'never' }
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

        {/* Apple Pay / Google Pay button - shown when selected */}
        {(selectedPaymentMethod === 'APPLE_PAY' || selectedPaymentMethod === 'GOOGLE_PAY') && (
          <div className="mt-4">
            <ExpressCheckoutElement
              onReady={onExpressCheckoutReady}
              onClick={onExpressCheckoutClick}
              onConfirm={onExpressCheckoutConfirm}
              options={{
                buttonType: {
                  applePay: 'buy',
                  googlePay: 'buy'
                },
                buttonTheme: {
                  applePay: 'black',
                  googlePay: 'black'
                },
                buttonHeight: 56,
                paymentMethods: {
                  applePay: selectedPaymentMethod === 'APPLE_PAY' ? 'always' : 'never',
                  googlePay: selectedPaymentMethod === 'GOOGLE_PAY' ? 'always' : 'never'
                }
              }}
            />
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Pay Button - shown for Card and Cash */}
        {(selectedPaymentMethod === 'CARD' || selectedPaymentMethod === 'CASH') && (
          <Button
            onClick={handlePayClick}
            disabled={isProcessing || isProcessingCash || (selectedPaymentMethod === 'CARD' && !stripe)}
            className="w-full text-white rounded-2xl py-5 text-lg font-bold mt-6 shadow-lg flex items-center justify-center gap-2"
            style={{
              background: `linear-gradient(to right, ${primaryColor}, ${primaryColor}dd)`
            }}
          >
            {isProcessing || isProcessingCash ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t('checkout.processing') || 'Verarbeitung...'}
              </>
            ) : (
              <>
                {selectedPaymentMethod === 'CASH' ? t('payment.placeOrder') : t('payment.payNow')}
                {' • '}{formatPrice(total)}
                <span className="ml-1">→</span>
              </>
            )}
          </Button>
        )}

        {/* Security note */}
        <p className="text-xs text-center text-gray-500 mt-4">
          {selectedPaymentMethod === 'CASH'
            ? t('checkout.payAtRestaurant') || 'Bezahlung erfolgt im Restaurant'
            : '🔒 ' + (t('checkout.securePayment') || 'Sichere Zahlung über Stripe')
          }
        </p>
      </div>
    </div>
  )
}

// Main component - wraps with Stripe Elements
export default function IntegratedCheckout(props: IntegratedCheckoutProps) {
  const { t } = useGuestLanguage()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { restaurantId, tableId, tableNumber, subtotal, serviceFee, tipAmount, currency, cartItems } = props

  // Check if Stripe is available
  if (!stripePromise) {
    // Fall back to cash-only mode
    return (
      <div className="p-6">
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('checkout.onlinePaymentUnavailable') || 'Online-Zahlung nicht verfügbar.'}
          </AlertDescription>
        </Alert>
        {/* Render cash-only checkout */}
        <Button
          onClick={props.onCashOrder}
          disabled={props.isProcessingCash}
          className="w-full"
          style={{ backgroundColor: props.primaryColor }}
        >
          {props.isProcessingCash ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : null}
          {t('payment.placeOrder')} - {t('payment.cash')}
        </Button>
      </div>
    )
  }

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const total = subtotal + serviceFee + tipAmount
        const amountInCents = Math.round(total * 100)

        const response = await fetch('/api/stripe-connect/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            tableId,
            tableNumber,
            amount: amountInCents,
            currency: currency.toLowerCase(),
            cartData: {
              items: cartItems,
              subtotal,
              tax: serviceFee, // Using serviceFee as tax for now
              tip: tipAmount
            }
          })
        })

        const result = await response.json()

        if (result.clientSecret && result.pendingPaymentId) {
          setClientSecret(result.clientSecret)
          setPendingPaymentId(result.pendingPaymentId)
        } else {
          throw new Error(result.error || 'Payment konnte nicht initialisiert werden')
        }
      } catch (err) {
        console.error('Create payment intent failed:', err)
        setError(err instanceof Error ? err.message : 'Payment konnte nicht initialisiert werden')
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [restaurantId, tableId, tableNumber, subtotal, serviceFee, tipAmount, currency, cartItems])

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: props.primaryColor }} />
        <p className="text-gray-600">{t('checkout.preparingPayment') || 'Zahlung wird vorbereitet...'}</p>
      </div>
    )
  }

  if (error || !clientSecret || !pendingPaymentId) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || t('checkout.initializationFailed') || 'Payment konnte nicht initialisiert werden'}
          </AlertDescription>
        </Alert>
        {/* Allow cash payment as fallback */}
        <Button
          onClick={props.onCashOrder}
          disabled={props.isProcessingCash}
          className="w-full"
          style={{ backgroundColor: props.primaryColor }}
        >
          {t('payment.placeOrder')} - {t('payment.cash')}
        </Button>
      </div>
    )
  }

  const stripeOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: props.primaryColor || '#f97316',
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
      <CheckoutFormContent {...props} pendingPaymentId={pendingPaymentId} />
    </Elements>
  )
}
