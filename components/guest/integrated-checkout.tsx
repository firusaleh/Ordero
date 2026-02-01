'use client'

import { useState, useEffect } from 'react'
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
import { Loader2, Check, AlertCircle, Users } from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { toast } from 'sonner'
import SplitBill from './split-bill'

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
  showSplitBill?: boolean
  onSplitBillToggle?: () => void
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
  clientSecret,
  primaryColor = '#FF6B35',
  t,
  formatPrice,
  showSplitBill,
  onSplitBillToggle
}: IntegratedCheckoutProps & { pendingPaymentId: string; clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showCustomTip, setShowCustomTip] = useState(false)
  const [customTipAmount, setCustomTipAmount] = useState('')
  const [expressCheckoutReady, setExpressCheckoutReady] = useState(false)
  const [expressCheckoutChecked, setExpressCheckoutChecked] = useState(false)

  const total = subtotal + serviceFee + tipAmount

  // Calculate round up amount
  const calculateRoundUp = () => {
    const nextFive = Math.ceil(subtotal / 5) * 5
    const nextTen = Math.ceil(subtotal / 10) * 10
    const roundedUp = (nextFive - subtotal) < (nextTen - subtotal) && (nextFive - subtotal) > 0.5 ? nextFive : nextTen
    return roundedUp - subtotal
  }

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
      setErrorMessage(t('errors.stripeNotLoaded') || 'Stripe wurde noch nicht geladen.')
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Update payment intent with final amount including tip
      const finalAmount = Math.round((subtotal + serviceFee + tipAmount) * 100)
      const paymentIntentId = clientSecret.split('_secret_')[0]

      const updateResponse = await fetch('/api/stripe-connect/update-payment-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId,
          amount: finalAmount
        })
      })

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json()
        throw new Error(errorData.error || 'Fehler beim Aktualisieren des Betrags')
      }

      // Confirm payment with updated amount
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
  }

  return (
    <div className="bg-white">
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
          <div className="flex justify-between items-center font-semibold pt-2 border-t">
            <span>{t('payment.totalBeforeTip') || 'Zwischensumme'}</span>
            <span className="text-xl" style={{ color: primaryColor }}>{formatPrice(subtotal + serviceFee)}</span>
          </div>
        </div>

        {/* Tip Options - 3 column grid like original Oriido */}
        <div className="mt-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t('payment.tipQuestion')}</p>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {/* No Tip */}
            <button
              onClick={() => {
                onTipChange('0', 0)
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === '0'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === '0' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">😐</span>
              <span className="text-xs font-medium">{t('payment.noTip') || 'Nein'}</span>
            </button>

            {/* 5% */}
            <button
              onClick={() => {
                onTipChange('5', subtotal * 0.05)
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === '5'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === '5' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">🙂</span>
              <span className="text-xs font-medium">5%</span>
              <span className="text-xs opacity-75">{currencySymbol}{(subtotal * 0.05).toFixed(2)}</span>
            </button>

            {/* 10% */}
            <button
              onClick={() => {
                onTipChange('10', subtotal * 0.10)
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === '10'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === '10' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">😊</span>
              <span className="text-xs font-medium">10%</span>
              <span className="text-xs opacity-75">{currencySymbol}{(subtotal * 0.10).toFixed(2)}</span>
            </button>

            {/* 15% */}
            <button
              onClick={() => {
                onTipChange('15', subtotal * 0.15)
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === '15'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === '15' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">😃</span>
              <span className="text-xs font-medium">15%</span>
              <span className="text-xs opacity-75">{currencySymbol}{(subtotal * 0.15).toFixed(2)}</span>
            </button>

            {/* 20% */}
            <button
              onClick={() => {
                onTipChange('20', subtotal * 0.20)
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === '20'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === '20' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">😍</span>
              <span className="text-xs font-medium">20%</span>
              <span className="text-xs opacity-75">{currencySymbol}{(subtotal * 0.20).toFixed(2)}</span>
            </button>

            {/* Round Up */}
            <button
              onClick={() => {
                onTipChange('round', calculateRoundUp())
                setShowCustomTip(false)
              }}
              className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                selectedTipOption === 'round'
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={selectedTipOption === 'round' ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-xl">💝</span>
              <span className="text-xs font-medium">{t('payment.roundUp') || 'Aufrunden'}</span>
              <span className="text-xs opacity-75">+{currencySymbol}{calculateRoundUp().toFixed(2)}</span>
            </button>
          </div>

          {/* Custom Amount Button */}
          <button
            onClick={() => {
              setShowCustomTip(!showCustomTip)
              onTipChange('custom', parseFloat(customTipAmount) || 0)
            }}
            className={`w-full py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              selectedTipOption === 'custom'
                ? 'text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            style={selectedTipOption === 'custom' ? { backgroundColor: primaryColor } : {}}
          >
            {t('payment.customAmount') || 'Eigener Betrag'}
          </button>

          {/* Custom Amount Input */}
          {showCustomTip && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-gray-600">{currencySymbol}</span>
              <input
                type="number"
                value={customTipAmount}
                onChange={(e) => {
                  const value = e.target.value
                  setCustomTipAmount(value)
                  const amount = parseFloat(value) || 0
                  onTipChange('custom', amount)
                }}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': primaryColor } as any}
                placeholder="0.00"
                min="0"
                step="0.50"
              />
            </div>
          )}

          {/* Tip Amount Display */}
          {tipAmount > 0 && (
            <div className="mt-3 p-3 bg-orange-50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{t('payment.tip') || 'Trinkgeld'}</span>
                <span className="font-semibold" style={{ color: primaryColor }}>
                  +{currencySymbol}{tipAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-100">
                <span className="text-sm font-semibold text-gray-700">{t('payment.total') || 'Gesamt'}</span>
                <span className="text-lg font-bold text-gray-900">
                  {currencySymbol}{(subtotal + serviceFee + tipAmount).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="px-5 py-4 bg-[#f8f8f8]">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          {t('payment.selectPaymentMethod') || 'Zahlungsmethode wählen'}
        </p>

        <div className="space-y-3">
          {/* Express Checkout (Apple Pay / Google Pay) - Native Stripe buttons */}
          <div className="bg-white rounded-2xl p-4 border">
            <p className="text-xs text-gray-500 mb-3">{t('payment.expressCheckout') || 'Schnellzahlung'}</p>
            <ExpressCheckoutElement
              onReady={({ availablePaymentMethods }) => {
                console.log('ExpressCheckout availablePaymentMethods:', availablePaymentMethods)
                setExpressCheckoutChecked(true)
                setExpressCheckoutReady(
                  !!(availablePaymentMethods?.applePay || availablePaymentMethods?.googlePay)
                )
              }}
              onClick={({ resolve }) => {
                resolve({})
              }}
              onConfirm={async () => {
                if (!stripe || !elements) {
                  onError('Stripe nicht geladen')
                  return
                }

                setIsProcessing(true)
                setErrorMessage(null)

                try {
                  // Confirm the payment with Stripe
                  const { error, paymentIntent } = await stripe.confirmPayment({
                    elements,
                    confirmParams: {
                      return_url: `${window.location.origin}/payment/success`,
                    },
                    redirect: 'if_required'
                  })

                  if (error) {
                    console.error('Express checkout payment error:', error)
                    setErrorMessage(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
                    onError(error.message || t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
                    return
                  }

                  if (paymentIntent?.status === 'succeeded') {
                    // Poll for order completion
                    await pollForOrderCompletion()
                  }
                } catch (err) {
                  console.error('Express checkout error:', err)
                  setErrorMessage(t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
                  onError(t('errors.paymentFailed') || 'Zahlung fehlgeschlagen')
                } finally {
                  setIsProcessing(false)
                }
              }}
              onCancel={() => {
                // User cancelled - do nothing
              }}
              options={{
                buttonHeight: 50,
                buttonTheme: {
                  applePay: 'black',
                  googlePay: 'black'
                },
                buttonType: {
                  applePay: 'buy',
                  googlePay: 'buy'
                },
                layout: {
                  maxColumns: 2,
                  maxRows: 1
                },
                paymentMethods: {
                  applePay: 'always',
                  googlePay: 'always',
                  link: 'never',
                  amazonPay: 'never'
                }
              }}
            />
            {!expressCheckoutReady && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                {expressCheckoutChecked
                  ? (t('payment.expressUnavailable') || 'Apple Pay / Google Pay nicht verfügbar auf diesem Gerät')
                  : (t('payment.expressLoading') || 'Apple Pay / Google Pay wird geladen...')
                }
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 border-t border-gray-300"></div>
            <span className="text-xs text-gray-500">{t('payment.or') || 'oder'}</span>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Credit Card Option */}
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
            <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.creditCard') || 'Kredit-/Debitkarte'}</span>
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ backgroundColor: selectedPaymentMethod === 'CARD' ? primaryColor : '#e5e7eb' }}
            >
              {selectedPaymentMethod === 'CARD' && <Check className="h-3 w-3 text-white" />}
            </div>
          </button>

          {/* Card Input - shown inline when Card is selected */}
          {selectedPaymentMethod === 'CARD' && (
            <div className="p-4 bg-white rounded-xl border">
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

        {/* Split Bill Button */}
        {onSplitBillToggle && (
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={onSplitBillToggle}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 border-2 border-dashed border-gray-300 hover:border-gray-400"
            >
              <Users className="h-5 w-5" />
              <span className="font-medium">{t('payment.splitBill') || 'Rechnung teilen'}</span>
            </Button>
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
                {t('checkout.processing') || 'Wird verarbeitet...'}
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
        {selectedPaymentMethod === 'CARD' && (
          <p className="text-xs text-center text-gray-500 mt-4">
            🔒 {t('errors.securePaymentVia') || 'Sichere Zahlung über'} Stripe
          </p>
        )}
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
        // Use initial tip amount (0) for payment intent creation
        // Tip will be updated when the payment is confirmed
        const initialTotal = subtotal + serviceFee
        const amountInCents = Math.round(initialTotal * 100)

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
              tax: serviceFee,
              tip: 0 // Initial tip is 0, will be updated on payment
            }
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
  }, [restaurantId, tableId, tableNumber, subtotal, serviceFee, currency, cartItems]) // Removed tipAmount from dependencies

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
            {error || t('errors.paymentInitError') || 'Payment konnte nicht initialisiert werden'}
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
      <CheckoutFormContent {...props} pendingPaymentId={pendingPaymentId} clientSecret={clientSecret} />
    </Elements>
  )
}
