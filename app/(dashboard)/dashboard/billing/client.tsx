'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  CreditCard, 
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  Receipt,
  Building2,
  TrendingUp
} from 'lucide-react'

interface BillingClientProps {
  restaurant: any
}

export default function BillingClient({ restaurant }: BillingClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  
  // Land aus Restaurant-Daten
  const country = restaurant.country || 'DE'
  const currentPlan = restaurant.subscriptionPlan || 'FREE'

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

  const handleUpgrade = async (planId: string) => {
    setLoading(true)
    try {
      // Für Deutschland: Weiterleitung zu Stripe oder manuelle Aktivierung
      // Für Jordanien: Automatische Aktivierung des Pay-per-Order Plans
      if (country === 'JO') {
        // API-Aufruf zur Aktivierung des jordanischen Plans
        const response = await fetch('/api/dashboard/activate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            restaurantId: restaurant.id,
            plan: 'JO_PAY_PER_ORDER' 
          })
        })
        
        if (response.ok) {
          toast({
            title: 'Plan aktiviert!',
            description: 'Der Pay-per-Order Plan wurde erfolgreich aktiviert. Die Abrechnung erfolgt automatisch bei jeder Bestellung.',
          })
          router.refresh()
        } else {
          throw new Error('Fehler bei der Aktivierung')
        }
      } else {
        // Für Deutschland: Kontaktaufnahme erforderlich
        toast({
          title: 'Kontaktieren Sie uns',
          description: 'Bitte kontaktieren Sie unser Sales-Team unter support@oriido.com für die Aktivierung dieses Plans.',
        })
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Es gab ein Problem bei der Aktivierung. Bitte versuchen Sie es später erneut.',
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

  // Jordanien Plan
  const jordanPlan = {
    id: 'JO_PAY_PER_ORDER',
    name: 'Pay-per-Order',
    price: '0,10',
    currency: 'JD',
    unit: 'pro Bestellung',
    icon: Receipt,
    features: [
      'Keine monatliche Grundgebühr',
      'Nur 0,10 JD pro erfolgter Bestellung',
      'Automatische Abrechnung bei jeder Bestellung',
      'Unbegrenzte Menü-Artikel',
      'Unbegrenzte Tische',
      'Vollständiger Funktionsumfang',
      'E-Mail & WhatsApp Support',
      'Monatliche Sammelrechnung'
    ],
    buttonText: currentPlan === 'JO_PAY_PER_ORDER' ? 'Aktueller Plan' : 'Plan aktivieren',
    isActive: currentPlan === 'JO_PAY_PER_ORDER',
    onClick: () => handleUpgrade('JO_PAY_PER_ORDER')
  }

  // Deutschland Pläne
  const germanyPlans = {
    payPerOrder: {
      id: 'DE_PAY_PER_ORDER',
      name: 'Pay-per-Order',
      price: '0,35',
      currency: '€',
      unit: 'pro Bestellung',
      setupFee: '250',
      icon: Receipt,
      features: [
        'Keine monatliche Grundgebühr',
        'Nur 0,35 € pro erfolgter Bestellung',
        'Einmalige Setup-Gebühr: 250 €',
        'Unbegrenzte Menü-Artikel',
        'Unbegrenzte Tische',
        'Vollständiger Funktionsumfang',
        'Priority E-Mail Support',
        'Monatliche Abrechnung nach Nutzung'
      ],
      buttonText: currentPlan === 'DE_PAY_PER_ORDER' ? 'Aktueller Plan' : 'Pay-per-Order wählen',
      isActive: currentPlan === 'DE_PAY_PER_ORDER',
      onClick: () => handleUpgrade('DE_PAY_PER_ORDER')
    },
    monthly: {
      id: 'DE_MONTHLY',
      name: 'Monatlich / Jährlich',
      monthlyPrice: '279',
      yearlyPrice: '2.150',
      currency: '€',
      setupFee: '250',
      icon: Calendar,
      popular: true,
      features: [
        'Unbegrenzte Bestellungen',
        'Monatlich: 279 € / Monat',
        'Jährlich: 2.150 € / Jahr (spare 1.198 €)',
        'Einmalige Setup-Gebühr: 250 €',
        'Unbegrenzte Menü-Artikel',
        'Unbegrenzte Tische',
        'Priority Support mit SLA',
        'Dedizierter Account Manager',
        'Kostenlose Updates & neue Features'
      ],
      buttonText: currentPlan === 'DE_MONTHLY' ? 'Aktueller Plan' : 'Flatrate wählen',
      isActive: currentPlan === 'DE_MONTHLY' || currentPlan === 'DE_YEARLY',
      onClick: () => handleUpgrade('DE_MONTHLY')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Abrechnung & Pläne</h1>
        <p className="text-gray-600">
          {country === 'JO' 
            ? 'Ihr Abrechnungsplan für Jordanien' 
            : 'Ihre Abrechnungspläne für Deutschland'}
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">Abonnement</TabsTrigger>
          <TabsTrigger value="payment">Zahlungen verwalten</TabsTrigger>
          {currentPlan !== 'FREE' && (
            <TabsTrigger value="usage">Nutzung & Statistiken</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan Card */}
          {currentPlan !== 'FREE' && (
            <Card>
              <CardHeader>
                <CardTitle>Aktueller Plan</CardTitle>
                <CardDescription>
                  Ihr aktives Abonnement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {currentPlan === 'JO_PAY_PER_ORDER' && 'Pay-per-Order Jordanien'}
                      {currentPlan === 'DE_PAY_PER_ORDER' && 'Pay-per-Order Deutschland'}
                      {currentPlan === 'DE_MONTHLY' && 'Flatrate Monatlich'}
                      {currentPlan === 'DE_YEARLY' && 'Flatrate Jährlich'}
                    </h3>
                    <p className="text-gray-600">
                      {currentPlan === 'JO_PAY_PER_ORDER' && '0,10 JD pro Bestellung'}
                      {currentPlan === 'DE_PAY_PER_ORDER' && '0,35 € pro Bestellung'}
                      {currentPlan === 'DE_MONTHLY' && '279 € / Monat'}
                      {currentPlan === 'DE_YEARLY' && '2.150 € / Jahr'}
                    </p>
                  </div>
                  <Badge className="bg-green-500">Aktiv</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans based on Country */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {currentPlan === 'FREE' ? 'Verfügbare Pläne' : 'Planübersicht'}
            </h2>
            
            {country === 'JO' ? (
              // Jordanien Plan
              <Card className={`max-w-2xl mx-auto ${jordanPlan.isActive ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {jordanPlan.name}
                    </CardTitle>
                    {jordanPlan.isActive && (
                      <Badge className="bg-green-500">Aktiv</Badge>
                    )}
                  </div>
                  <div className="flex items-baseline mt-2">
                    <span className="text-3xl font-bold">{jordanPlan.price}</span>
                    <span className="text-gray-500 ml-1">{jordanPlan.currency}</span>
                    <span className="text-gray-500 ml-2">/ {jordanPlan.unit}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {jordanPlan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    disabled={loading || jordanPlan.isActive}
                    variant={jordanPlan.isActive ? 'secondary' : 'default'}
                    onClick={jordanPlan.onClick}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      jordanPlan.buttonText
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              // Deutschland Pläne
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pay-per-Order Plan */}
                <Card className={germanyPlans.payPerOrder.isActive ? 'ring-2 ring-green-500' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5" />
                        {germanyPlans.payPerOrder.name}
                      </CardTitle>
                      {germanyPlans.payPerOrder.isActive && (
                        <Badge className="bg-green-500">Aktiv</Badge>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{germanyPlans.payPerOrder.price}</span>
                        <span className="text-gray-500 ml-1">{germanyPlans.payPerOrder.currency}</span>
                        <span className="text-gray-500 ml-2">/ {germanyPlans.payPerOrder.unit}</span>
                      </div>
                      <Badge variant="secondary" className="inline-flex">
                        + {germanyPlans.payPerOrder.setupFee} € Setup-Gebühr
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {germanyPlans.payPerOrder.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={germanyPlans.payPerOrder.isActive ? 'secondary' : 'outline'}
                      disabled={loading || germanyPlans.payPerOrder.isActive}
                      onClick={germanyPlans.payPerOrder.onClick}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        germanyPlans.payPerOrder.buttonText
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Monthly/Yearly Plan */}
                <Card className={`relative ${germanyPlans.monthly.isActive ? 'ring-2 ring-green-500' : 'ring-2 ring-blue-500'} shadow-lg`}>
                  {!germanyPlans.monthly.isActive && (
                    <Badge className="absolute -top-3 right-4 bg-blue-500">
                      Beliebt
                    </Badge>
                  )}
                  {germanyPlans.monthly.isActive && (
                    <Badge className="absolute -top-3 right-4 bg-green-500">
                      Aktiv
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      {germanyPlans.monthly.name}
                    </CardTitle>
                    <div className="space-y-2 mt-2">
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-2xl font-bold">{germanyPlans.monthly.monthlyPrice}</span>
                          <span className="text-gray-500 ml-1">{germanyPlans.monthly.currency} / Monat</span>
                        </div>
                        <div className="flex items-baseline text-sm text-gray-600">
                          oder <span className="font-semibold mx-1">{germanyPlans.monthly.yearlyPrice} €</span> / Jahr
                        </div>
                      </div>
                      <Badge variant="secondary" className="inline-flex">
                        + {germanyPlans.monthly.setupFee} € Setup-Gebühr
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {germanyPlans.monthly.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={loading || germanyPlans.monthly.isActive}
                      variant={germanyPlans.monthly.isActive ? 'secondary' : 'default'}
                      onClick={germanyPlans.monthly.onClick}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        germanyPlans.monthly.buttonText
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
          </div>

          {/* Info Note für Jordanien */}
          {country === 'JO' && currentPlan === 'JO_PAY_PER_ORDER' && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-green-900 mb-1">
                      Automatische Abrechnung aktiviert
                    </p>
                    <p className="text-sm text-green-800">
                      Bei jeder Bestellung werden automatisch 0,10 JD berechnet. Sie erhalten am Monatsende eine Sammelrechnung über alle Bestellungen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Comparison Note für Deutschland */}
          {country === 'DE' && currentPlan === 'FREE' && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      Welcher Plan passt zu Ihnen?
                    </p>
                    <p className="text-sm text-blue-800">
                      <strong>Pay-per-Order:</strong> Ideal für neue Restaurants oder bei saisonalen Schwankungen. Sie zahlen nur für tatsächliche Bestellungen.
                    </p>
                    <p className="text-sm text-blue-800 mt-2">
                      <strong>Flatrate:</strong> Perfekt für etablierte Restaurants mit regelmäßigem Bestellvolumen. Ab ~800 Bestellungen/Monat günstiger als Pay-per-Order.
                    </p>
                  </div>
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
                Verwalten Sie Ihre Zahlungsmethoden und Rechnungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentPlan !== 'FREE' ? (
                <>
                  {country === 'JO' && currentPlan === 'JO_PAY_PER_ORDER' ? (
                    <>
                      <p className="text-sm text-gray-600">
                        Die Abrechnung erfolgt automatisch bei jeder Bestellung. Sie erhalten monatlich eine Sammelrechnung per E-Mail.
                      </p>
                      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm font-semibold">Zahlungsinformationen:</p>
                        <p className="text-sm text-gray-600">Zahlungsmethode: Automatische Abrechnung</p>
                        <p className="text-sm text-gray-600">Rechnungsversand: Monatlich per E-Mail</p>
                        <p className="text-sm text-gray-600">Kontakt: support@oriido.com</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">
                        Verwalten Sie Ihr Abonnement, laden Sie Rechnungen herunter und aktualisieren Sie 
                        Ihre Zahlungsmethode über das Kundenportal.
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
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Keine aktive Zahlungsmethode</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Wählen Sie einen Plan aus, um mit der Einrichtung zu beginnen.
                  </p>
                  <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                    Plan auswählen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Tab für aktive Pläne */}
        {currentPlan !== 'FREE' && (
          <TabsContent value="usage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Nutzungsstatistiken
                </CardTitle>
                <CardDescription>
                  {country === 'JO' 
                    ? 'Ihre Bestellungen und Abrechnungen diesen Monat'
                    : 'Ihre Nutzung im aktuellen Abrechnungszeitraum'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bestellungen diesen Monat</p>
                    <p className="text-2xl font-bold">0</p>
                    {country === 'JO' && currentPlan === 'JO_PAY_PER_ORDER' && (
                      <p className="text-sm text-gray-600 mt-1">= 0,00 JD</p>
                    )}
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Aktive Menü-Artikel</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Aktive Tische</p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
                
                {country === 'JO' && currentPlan === 'JO_PAY_PER_ORDER' && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      Geschätzte Rechnung diesen Monat:
                    </p>
                    <p className="text-3xl font-bold text-blue-900">0,00 JD</p>
                    <p className="text-sm text-blue-700 mt-2">
                      Die finale Rechnung erhalten Sie am Monatsende per E-Mail.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}