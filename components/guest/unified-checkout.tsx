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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  CreditCard,
  Banknote,
  Heart,
  AlertCircle,
  Apple,
  Check
} from 'lucide-react'
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

interface CartData {
  items: CartItem[]
  subtotal: number
  tax: number
  tip: number
}

interface UnifiedCheckoutProps {
  restaurantId: string
  tableId?: string
  tableNumber?: number
  subtotal: number
  tax: number
  currency?: string
  currencySymbol?: string
  cartItems: CartItem[]
  onSuccess: (pendingPaymentId: string, orderNumber: string) => void
  onCashOrder: (tipPercent: number, tipAmount: number) => void
  onError: (error: string) => void
  onCancel: () => void
  isProcessingCash?: boolean
}

type PaymentMethod = 'apple_pay' | 'google_pay' | 'card' | 'cash'

// Inner checkout form component (has access to Stripe context)
function CheckoutForm({
  subtotal,
  tax,
  currency,
  currencySymbol,
  pendingPaymentId,
  onSuccess,
  onCashOrder,
  onError,
  onCancel,
  isProcessingCash
}: {
  subtotal: number
  tax: number
  currency: string
  currencySymbol: string
  pendingPaymentId: string
  onSuccess: (pendingPaymentId: string, orderNumber: string) => void
  onCashOrder: (tipPercent: number, tipAmount: number) => void
  onError: (error: string) => void
  onCancel: () => void
  isProcessingCash?: boolean
}) {
  const { t } = useGuestLanguage()
  const stripe = useStripe()
  const elements = useElements()

  const [tipPercent, setTipPercent] = useState<number>(10)
  const [customTip, setCustomTip] = useState<string>('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false)
  const [availableExpressMethods, setAvailableExpressMethods] = useState<string[]>([])

  const baseAmount = subtotal + tax

  // Calculate tip amount
  const getTipAmount = (): number => {
    if (tipPercent === -1 && customTip) {
      return parseFloat(customTip) || 0
    }
    return baseAmount * (tipPercent / 100)
  }

  const tipAmount = getTipAmount()
  const total = baseAmount + tipAmount

  const tipOptions = [
    { value: 0, label: t('errors.noTip') || t('payment.noTip') || 'Kein Trinkgeld', icon: '😐' },
    { value: 5, label: '5%', icon: '🙂' },
    { value: 10, label: '10%', icon: '😊' },
    { value: 15, label: '15%', icon: '😃' },
    { value: 20, label: '20%', icon: '😍' },
  ]

  // Handle Express Checkout (Apple Pay / Google Pay) ready state
  const onExpressCheckoutReady = useCallback(({ availablePaymentMethods }: any) => {
    if (availablePaymentMethods) {
      const methods: string[] = []
      if (availablePaymentMethods.applePay) methods.push('apple_pay')
      if (availablePaymentMethods.googlePay) methods.push('google_pay')
      setAvailableExpressMethods(methods)
      setExpressCheckoutReady(methods.length > 0)
    }
  }, [])

  // Handle Express Checkout click
  const onExpressCheckoutClick = useCallback(({ resolve }: any) => {
    const options = {
      emailRequired: false,
      phoneNumberRequired: false,
    }
    resolve(options)
  }, [])

  // Handle Express Checkout confirm
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
        setErrorMessage(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
        onError(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
      } else {
        // Payment succeeded - poll for order number
        await pollForOrderCompletion()
      }
    } catch (err) {
      console.error('Express checkout error:', err)
      setErrorMessage(t('errors.unexpectedError') || 'Ein unerwarteter Fehler ist aufgetreten')
      onError(t('errors.unexpectedError') || 'Unerwarteter Fehler')
    } finally {
      setIsProcessing(false)
    }
  }, [stripe, elements, onError])

  // Poll for order completion after payment
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

  // Handle Card payment submit
  const handleCardSubmit = async () => {
    if (!stripe || !elements) {
      setErrorMessage(t('errors.stripeNotLoaded') || 'Stripe wurde noch nicht geladen.')
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
        setErrorMessage(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
        onError(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        await pollForOrderCompletion()
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setErrorMessage(t('errors.unexpectedError') || 'Ein unerwarteter Fehler ist aufgetreten')
      onError(t('errors.unexpectedError') || 'Unerwarteter Fehler')
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle Cash order
  const handleCashOrder = () => {
    onCashOrder(tipPercent === -1 ? 0 : tipPercent, tipAmount)
  }

  const paymentMethods = [
    {
      id: 'apple_pay' as PaymentMethod,
      name: 'Apple Pay',
      icon: <Apple className="h-5 w-5" />,
      bgColor: 'bg-black text-white',
      available: availableExpressMethods.includes('apple_pay')
    },
    {
      id: 'google_pay' as PaymentMethod,
      name: 'Google Pay',
      icon: <div className="font-bold text-sm">G Pay</div>,
      bgColor: 'bg-white border border-gray-300 text-gray-900',
      available: availableExpressMethods.includes('google_pay')
    },
    {
      id: 'card' as PaymentMethod,
      name: t('payment.creditCard') || 'Kreditkarte',
      icon: <CreditCard className="h-5 w-5" />,
      bgColor: 'bg-white border border-gray-300 text-gray-900',
      available: true
    },
    {
      id: 'cash' as PaymentMethod,
      name: t('payment.cash') || 'Bar',
      icon: <Banknote className="h-5 w-5" />,
      bgColor: 'bg-white border border-gray-300 text-gray-900',
      available: true
    }
  ]

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto">
      {/* Order Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('checkout.orderSummary') || 'Zusammenfassung'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{t('common.subtotal') || 'Zwischensumme'}</span>
            <span>{currencySymbol}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('checkout.taxes') || 'MwSt (19%)'}</span>
            <span>{currencySymbol}{tax.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between text-green-600 font-medium">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {t('checkout.tip') || 'Trinkgeld'}
                {tipPercent > 0 && ` (${tipPercent}%)`}
              </span>
              <span>{currencySymbol}{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
            <span>{t('common.total') || 'Gesamt'}</span>
            <span className="text-orange-500">{currencySymbol}{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tip Selection */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            {t('checkout.addTip') || 'Trinkgeld hinzufügen'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {tipOptions.map((option) => (
              <Button
                key={option.value}
                variant={tipPercent === option.value ? 'default' : 'outline'}
                onClick={() => {
                  setTipPercent(option.value)
                  setCustomTip('')
                }}
                className={`flex flex-col h-auto py-2 px-1 ${
                  tipPercent === option.value ? 'bg-orange-500 hover:bg-orange-600' : ''
                }`}
                size="sm"
              >
                <span className="text-lg">{option.icon}</span>
                <span className="text-xs font-medium">{option.label}</span>
              </Button>
            ))}
          </div>

          {/* Custom Tip */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant={tipPercent === -1 ? 'default' : 'outline'}
              onClick={() => setTipPercent(-1)}
              size="sm"
              className={tipPercent === -1 ? 'bg-orange-500 hover:bg-orange-600' : ''}
            >
              {t('checkout.customAmount') || 'Eigener Betrag'}
            </Button>
            {tipPercent === -1 && (
              <div className="flex items-center gap-1">
                <span>{currencySymbol}</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="w-20 px-2 py-1 border rounded text-sm"
                  placeholder="0.00"
                  min="0"
                  step="0.50"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{t('checkout.paymentMethod') || 'Zahlungsmethode'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {paymentMethods.filter(m => m.available).map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              disabled={isProcessing || isProcessingCash}
              className={`
                w-full flex items-center justify-between p-3 rounded-xl transition-all
                cursor-pointer hover:shadow-md disabled:opacity-50
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
                <span className="font-medium">{method.name}</span>
              </div>
              {selectedMethod === method.id && (
                <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}

          {/* Hidden Express Checkout Element for Apple Pay / Google Pay detection */}
          <div className="hidden">
            <ExpressCheckoutElement
              onReady={onExpressCheckoutReady}
              onClick={onExpressCheckoutClick}
              onConfirm={onExpressCheckoutConfirm}
            />
          </div>

          {/* Card Input - shown when card is selected */}
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
        </CardContent>
      </Card>

      {/* Error Message */}
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="space-y-3 pt-2">
        {selectedMethod === 'cash' ? (
          <Button
            onClick={handleCashOrder}
            disabled={isProcessingCash}
            className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            {isProcessingCash ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('checkout.processing') || t('stripe.preparing') || 'Verarbeitung...'}
              </>
            ) : (
              <>
                <Banknote className="mr-2 h-5 w-5" />
                {t('checkout.placeOrder') || 'Bestellung aufgeben'} ({currencySymbol}{total.toFixed(2)})
              </>
            )}
          </Button>
        ) : selectedMethod === 'card' ? (
          <Button
            onClick={handleCardSubmit}
            disabled={!stripe || isProcessing}
            className="w-full h-14 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t('checkout.processing') || t('stripe.preparing') || 'Verarbeitung...'}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-5 w-5" />
                {t('checkout.payNow') || 'Jetzt bezahlen'} ({currencySymbol}{total.toFixed(2)})
              </>
            )}
          </Button>
        ) : (selectedMethod === 'apple_pay' || selectedMethod === 'google_pay') ? (
          <div className="w-full">
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
                  applePay: selectedMethod === 'apple_pay' ? 'always' : 'never',
                  googlePay: selectedMethod === 'google_pay' ? 'always' : 'never'
                }
              }}
            />
            {isProcessing && (
              <div className="flex items-center justify-center mt-2">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>{t('checkout.processing') || t('stripe.preparing') || 'Verarbeitung...'}</span>
              </div>
            )}
          </div>
        ) : (
          <Button
            disabled
            className="w-full h-14 text-lg font-semibold bg-gray-300 text-gray-600 rounded-xl"
          >
            {t('checkout.selectPaymentMethod') || 'Zahlungsmethode auswählen'}
          </Button>
        )}

        <Button
          variant="ghost"
          onClick={onCancel}
          disabled={isProcessing || isProcessingCash}
          className="w-full h-10 text-gray-600"
        >
          {t('errors.cancelled') || t('buttons.cancel') || 'Abbrechen'}
        </Button>
      </div>

      {/* Security Info */}
      <div className="text-center text-xs text-gray-500 pb-2">
        {selectedMethod !== 'cash' && '🔒 '}
        {selectedMethod === 'cash'
          ? t('checkout.payAtRestaurant') || 'Bezahlung erfolgt im Restaurant'
          : t('checkout.securePayment') || 'Sichere Zahlung über Stripe'
        }
      </div>
    </div>
  )
}

// Main component with Stripe Elements wrapper
export default function UnifiedCheckout(props: UnifiedCheckoutProps) {
  const { t } = useGuestLanguage()
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [pendingPaymentId, setPendingPaymentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    restaurantId,
    tableId,
    tableNumber,
    subtotal,
    tax,
    currency = 'EUR',
    currencySymbol = '€',
    cartItems,
    onSuccess,
    onCashOrder,
    onError,
    onCancel,
    isProcessingCash
  } = props

  // Check if Stripe is available
  if (!stripePromise) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t('errors.notAvailable') || 'Online-Zahlung nicht verfügbar. Bitte wählen Sie Barzahlung.'}
          </AlertDescription>
        </Alert>
        <Button onClick={onCancel} variant="outline" className="w-full mt-4">
          {t('errors.back') || t('buttons.back') || 'Zurück'}
        </Button>
      </div>
    )
  }

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const baseAmount = subtotal + tax
        // We'll update the payment intent amount if tip changes, but start with base
        const initialAmount = Math.round(baseAmount * 100) // Convert to cents

        const cartData: CartData = {
          items: cartItems,
          subtotal,
          tax,
          tip: 0 // Will be updated when user selects tip
        }

        const response = await fetch('/api/stripe-connect/create-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantId,
            tableId,
            tableNumber,
            amount: initialAmount,
            currency: currency.toLowerCase(),
            cartData
          })
        })

        const result = await response.json()

        if (result.clientSecret && result.pendingPaymentId) {
          setClientSecret(result.clientSecret)
          setPendingPaymentId(result.pendingPaymentId)
        } else {
          throw new Error(result.error || t('errors.paymentInitError') || 'Payment konnte nicht initialisiert werden')
        }
      } catch (err) {
        console.error('Create payment intent failed:', err)
        setError(err instanceof Error ? err.message : t('errors.paymentInitError') || 'Payment konnte nicht initialisiert werden')
      } finally {
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [restaurantId, tableId, tableNumber, subtotal, tax, currency, cartItems])

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
        <p className="text-gray-600">{t('stripe.preparing') || 'Zahlung wird vorbereitet...'}</p>
      </div>
    )
  }

  if (error || !clientSecret || !pendingPaymentId) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || t('errors.paymentInitError') || 'Payment konnte nicht initialisiert werden'}
          </AlertDescription>
        </Alert>
        <Button onClick={onCancel} variant="outline" className="w-full mt-4">
          {t('errors.back') || t('buttons.back') || 'Zurück'}
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
        subtotal={subtotal}
        tax={tax}
        currency={currency}
        currencySymbol={currencySymbol}
        pendingPaymentId={pendingPaymentId}
        onSuccess={onSuccess}
        onCashOrder={onCashOrder}
        onError={onError}
        onCancel={onCancel}
        isProcessingCash={isProcessingCash}
      />
    </Elements>
  )
}
