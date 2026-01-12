'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Smartphone, Globe } from 'lucide-react'
import { toast } from 'sonner'

// Stripe Elements
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

interface UniversalCheckoutProps {
  orderId: string
  amount: number
  currency: string
  country?: string
  restaurantName: string
  onSuccess: () => void
  onError: (error: string) => void
}

export function UniversalCheckout({
  orderId,
  amount,
  currency,
  country = 'DE',
  restaurantName,
  onSuccess,
  onError
}: UniversalCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string>('')
  const [redirectUrl, setRedirectUrl] = useState<string>('')
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)

  // Automatische Provider-Auswahl basierend auf Land
  useEffect(() => {
    detectAndInitPayment()
  }, [country, currency])

  const detectAndInitPayment = async () => {
    try {
      setLoading(true)

      // Erstelle Payment Intent mit automatischer Provider-Auswahl
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          country
        })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Zahlung')
      }

      const data = await response.json()
      
      setProvider(data.provider)
      
      // Je nach Provider unterschiedliche Initialisierung
      if (data.provider === 'Stripe') {
        setClientSecret(data.clientSecret)
        // Lade Stripe nur wenn benötigt
        const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
        if (publishableKey && publishableKey !== 'your_stripe_publishable_key_here') {
          setStripePromise(loadStripe(publishableKey))
        }
      } else if (data.provider === 'PayTabs') {
        // PayTabs verwendet Redirect
        setRedirectUrl(data.redirectUrl)
      }
      
      toast.success(`Zahlungsanbieter: ${data.provider}`)
    } catch (error: any) {
      console.error('Payment init error:', error)
      onError(error.message)
    } finally {
      setLoading(false)
    }
  }

  // Render basierend auf Provider
  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Wähle besten Zahlungsanbieter...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // PayTabs Redirect
  if (provider === 'PayTabs' && redirectUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            PayTabs Zahlung
          </CardTitle>
          <CardDescription>
            Sichere Zahlung für {restaurantName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Sie werden zu PayTabs weitergeleitet für die sichere Zahlungsabwicklung.
            </AlertDescription>
          </Alert>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Zu zahlen:</p>
            <p className="text-2xl font-bold">
              {amount.toFixed(2)} {currency}
            </p>
          </div>

          <Button 
            className="w-full" 
            onClick={() => window.location.href = redirectUrl}
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Weiter zu PayTabs
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Unterstützt: Visa, Mastercard, Mada, Apple Pay
          </p>
        </CardContent>
      </Card>
    )
  }

  // Stripe Elements
  if (provider === 'Stripe' && clientSecret && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <StripeCheckoutForm 
          amount={amount}
          currency={currency}
          restaurantName={restaurantName}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    )
  }

  // Fallback
  return (
    <Card>
      <CardContent className="py-8">
        <Alert>
          <AlertDescription>
            Kein Zahlungsanbieter verfügbar für {country}/{currency}.
            Bitte wählen Sie eine andere Zahlungsmethode.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// Stripe Checkout Komponente
function StripeCheckoutForm({
  amount,
  currency,
  restaurantName,
  onSuccess,
  onError
}: {
  amount: number
  currency: string
  restaurantName: string
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!stripe || !elements) return

    setProcessing(true)

    try {
      const result = await stripe.confirmCardPayment(
        elements.getElement(CardElement)!.clientSecret!,
        {
          payment_method: {
            card: elements.getElement(CardElement)!
          }
        }
      )

      if (result.error) {
        throw new Error(result.error.message)
      }

      if (result.paymentIntent?.status === 'succeeded') {
        toast.success('Zahlung erfolgreich!')
        onSuccess()
      }
    } catch (error: any) {
      console.error('Payment error:', error)
      onError(error.message)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Stripe Zahlung
        </CardTitle>
        <CardDescription>
          Sichere Zahlung für {restaurantName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Zu zahlen:</p>
            <p className="text-2xl font-bold">
              {amount.toFixed(2)} {currency}
            </p>
          </div>

          <div className="p-3 border rounded-md">
            <CardElement 
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                },
              }}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || processing}
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verarbeite...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Jetzt zahlen
              </>
            )}
          </Button>

          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <Smartphone className="h-4 w-4" />
            <span>Apple Pay</span>
            <span>•</span>
            <span>Google Pay</span>
            <span>•</span>
            <span>SEPA</span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}