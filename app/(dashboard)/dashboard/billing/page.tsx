'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { SUBSCRIPTION_FEATURES } from '@/lib/stripe'
import { 
  CreditCard, 
  Download, 
  Check,
  X,
  Calendar,
  TrendingUp,
  Euro,
  FileText,
  AlertCircle,
  Loader2,
  Crown,
  Rocket,
  Sparkles
} from 'lucide-react'

export default function BillingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentPlan, setCurrentPlan] = useState('FREE')
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    // Check for success/cancel params from Stripe
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast({
        title: 'Erfolgreich!',
        description: 'Ihr Abonnement wurde erfolgreich aktiviert.',
      })
      // Clear params
      router.replace('/dashboard/billing')
    }

    if (canceled === 'true') {
      toast({
        title: 'Abgebrochen',
        description: 'Die Zahlung wurde abgebrochen.',
        variant: 'destructive'
      })
      // Clear params  
      router.replace('/dashboard/billing')
    }
  }, [searchParams, toast, router])

  const handleUpgrade = async (plan: 'STANDARD' | 'PREMIUM') => {
    setLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Checkout-Session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Es gab ein Problem beim Upgrade. Bitte versuchen Sie es später erneut.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Öffnen des Kundenportals')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Es gab ein Problem beim Öffnen des Kundenportals.',
        variant: 'destructive'
      })
    } finally {
      setPortalLoading(false)
    }
  }

  const plans = [
    {
      id: 'FREE',
      name: SUBSCRIPTION_FEATURES.FREE.name,
      price: SUBSCRIPTION_FEATURES.FREE.price,
      icon: Sparkles,
      features: SUBSCRIPTION_FEATURES.FREE.features,
      buttonText: 'Aktueller Plan',
      disabled: true
    },
    {
      id: 'STANDARD',
      name: SUBSCRIPTION_FEATURES.STANDARD.name,
      price: SUBSCRIPTION_FEATURES.STANDARD.price,
      icon: Rocket,
      popular: true,
      features: SUBSCRIPTION_FEATURES.STANDARD.features,
      buttonText: 'Upgrade auf Standard',
      onClick: () => handleUpgrade('STANDARD')
    },
    {
      id: 'PREMIUM',
      name: SUBSCRIPTION_FEATURES.PREMIUM.name,
      price: SUBSCRIPTION_FEATURES.PREMIUM.price,
      icon: Crown,
      features: SUBSCRIPTION_FEATURES.PREMIUM.features,
      buttonText: 'Upgrade auf Premium',
      onClick: () => handleUpgrade('PREMIUM')
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abrechnung & Pläne</h1>
        <p className="text-gray-600">Verwalten Sie Ihr Abonnement und Zahlungen</p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="payment">Zahlungen verwalten</TabsTrigger>
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle>Aktueller Plan</CardTitle>
              <CardDescription>
                Ihr aktuelles Abonnement und verfügbare Upgrades
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {SUBSCRIPTION_FEATURES[currentPlan as keyof typeof SUBSCRIPTION_FEATURES].name} Plan
                  </h3>
                  <p className="text-gray-600">
                    {currentPlan === 'FREE' 
                      ? 'Kostenlos - 50 Bestellungen/Monat'
                      : `${SUBSCRIPTION_FEATURES[currentPlan as keyof typeof SUBSCRIPTION_FEATURES].price} € / Monat`
                    }
                  </p>
                </div>
                <Badge className="bg-green-500">Aktiv</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Available Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Verfügbare Pläne</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const Icon = plan.icon
                return (
                  <Card 
                    key={plan.id} 
                    className={`relative ${plan.popular ? 'ring-2 ring-blue-500 shadow-lg' : ''}`}
                  >
                    {plan.popular && (
                      <Badge className="absolute -top-3 right-4 bg-blue-500">
                        Beliebt
                      </Badge>
                    )}
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="w-5 h-5" />
                          {plan.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-baseline mt-2">
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-gray-500 ml-1">
                          {plan.price > 0 ? '€/Monat' : ''}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plan.features.map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={currentPlan === plan.id ? 'secondary' : 'default'}
                        disabled={plan.disabled || loading}
                        onClick={plan.onClick}
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          plan.buttonText
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Usage Stats */}
          {currentPlan === 'FREE' && (
            <Card>
              <CardHeader>
                <CardTitle>Nutzung diesen Monat</CardTitle>
                <CardDescription>
                  Ihr aktuelles Kontingent im Free Plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Bestellungen</span>
                      <span>23 / 50</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '46%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Menü-Artikel</span>
                      <span>15 / 20</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Tische</span>
                      <span>4 / 5</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="inline w-4 h-4 mr-1" />
                    Sie erreichen bald Ihre Limits. Upgraden Sie für unbegrenzte Nutzung!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Zahlungsverwaltung</CardTitle>
              <CardDescription>
                Verwalten Sie Ihre Zahlungsmethoden, Rechnungen und Abonnement-Details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan !== 'FREE' ? (
                <>
                  <p className="text-sm text-gray-600">
                    Verwalten Sie Ihr Abonnement, laden Sie Rechnungen herunter und aktualisieren Sie 
                    Ihre Zahlungsmethode über das Stripe-Kundenportal.
                  </p>
                  <Button 
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Lade Kundenportal...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Kundenportal öffnen
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Keine aktive Zahlungsmethode</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Upgraden Sie auf einen kostenpflichtigen Plan, um Zahlungen zu verwalten.
                  </p>
                  <Button onClick={() => handleUpgrade('STANDARD')}>
                    Jetzt upgraden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}