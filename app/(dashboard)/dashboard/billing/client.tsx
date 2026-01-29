'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'
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
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)
  
  // Land aus Restaurant-Daten
  const country = restaurant.country || 'DE'
  const currentPlan = restaurant.subscriptionPlan || 'DE_PAY_PER_ORDER'

  useEffect(() => {
    // Check for success/cancel params from Stripe
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast({
        title: t('billing.success'),
        description: t('billing.subscriptionActivated'),
      })
      // Clear params
      router.replace('/dashboard/billing')
    }

    if (canceled === 'true') {
      toast({
        title: t('billing.cancelled'),
        description: t('billing.paymentCancelled'),
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
            title: t('billing.planActivated'),
            description: t('billing.payPerOrderActivated'),
          })
          router.refresh()
        } else {
          throw new Error(t('billing.activationError'))
        }
      } else {
        // Für Deutschland: Kontaktaufnahme erforderlich
        toast({
          title: t('billing.contactUs'),
          description: t('billing.contactSalesTeam'),
        })
      }
    } catch (error) {
      toast({
        title: t('billing.error'),
        description: t('billing.activationError'),
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
        throw new Error(error.error || t('billing.errorOpeningPortal'))
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: t('billing.error'),
        description: error instanceof Error ? error.message : t('billing.portalError'),
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
    unit: t('billing.perOrder'),
    icon: Receipt,
    features: [
      t('billing.features.noMonthlyFee'),
      t('billing.features.perOrderJordan'),
      t('billing.features.automaticBilling'),
      t('billing.features.unlimitedMenuItems'),
      t('billing.features.unlimitedTables'),
      t('billing.features.fullFunctionality'),
      t('billing.features.emailWhatsappSupport'),
      t('billing.features.monthlyInvoice')
    ],
    buttonText: currentPlan === 'JO_PAY_PER_ORDER' ? t('billing.currentPlanButton') : t('billing.activatePlan'),
    isActive: currentPlan === 'JO_PAY_PER_ORDER',
    onClick: () => handleUpgrade('JO_PAY_PER_ORDER')
  }

  // Deutschland Pläne
  const germanyPlans = {
    payPerOrder: {
      id: 'DE_PAY_PER_ORDER',
      name: 'Pay-per-Order',
      price: '0,45',
      currency: '€',
      unit: 'pro Bestellung',
      setupFee: '250',
      icon: Receipt,
      features: [
        t('billing.features.noMonthlyFee'),
        t('billing.features.perOrderGermany'),
        t('billing.features.setupFeeGermany'),
        t('billing.features.unlimitedMenuItems'),
        t('billing.features.unlimitedTables'),
        t('billing.features.fullFunctionality'),
        t('billing.features.priorityEmailSupport'),
        t('billing.features.monthlyBilling')
      ],
      buttonText: currentPlan === 'DE_PAY_PER_ORDER' ? t('billing.currentPlanButton') : t('billing.selectPayPerOrder'),
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
        t('billing.features.unlimitedOrders'),
        t('billing.features.monthlyPrice'),
        t('billing.features.yearlyPrice'),
        t('billing.features.setupFeeGermany'),
        t('billing.features.unlimitedMenuItems'),
        t('billing.features.unlimitedTables'),
        t('billing.features.prioritySupportSLA'),
        t('billing.features.dedicatedAccountManager'),
        t('billing.features.freeUpdates')
      ],
      buttonText: currentPlan === 'DE_MONTHLY' ? t('billing.currentPlanButton') : t('billing.selectFlatrate'),
      isActive: currentPlan === 'DE_MONTHLY' || currentPlan === 'DE_YEARLY',
      onClick: () => handleUpgrade('DE_MONTHLY')
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('billing.title')}</h1>
        <p className="text-gray-600">
          {country === 'JO' 
            ? t('billing.planForJordan')
            : t('billing.planForGermany')}
        </p>
      </div>

      <Tabs defaultValue="subscription" className="space-y-6">
        <TabsList>
          <TabsTrigger value="subscription">{t('billing.subscription')}</TabsTrigger>
          <TabsTrigger value="payment">{t('billing.managePayments')}</TabsTrigger>
          {currentPlan && currentPlan !== 'INACTIVE' && (
            <TabsTrigger value="usage">{t('billing.usageStatistics')}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="subscription" className="space-y-6">
          {/* Current Plan Card */}
          {currentPlan && currentPlan !== 'INACTIVE' && (
            <Card>
              <CardHeader>
                <CardTitle>{t('billing.currentPlan')}</CardTitle>
                <CardDescription>
                  {t('billing.activeSubscription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      {currentPlan === 'JO_PAY_PER_ORDER' && t('billing.payPerOrderJordan')}
                      {currentPlan === 'DE_PAY_PER_ORDER' && t('billing.payPerOrderGermany')}
                      {currentPlan === 'DE_MONTHLY' && t('billing.flatrateMonthly')}
                      {currentPlan === 'DE_YEARLY' && t('billing.flatrateYearly')}
                    </h3>
                    <p className="text-gray-600">
                      {currentPlan === 'JO_PAY_PER_ORDER' && `0,10 JD ${t('billing.perOrder')}`}
                      {currentPlan === 'DE_PAY_PER_ORDER' && `0,35 € ${t('billing.perOrder')}`}
                      {currentPlan === 'DE_MONTHLY' && `279 € ${t('billing.perMonth')}`}
                      {currentPlan === 'DE_YEARLY' && `2.150 € ${t('billing.perYear')}`}
                    </p>
                  </div>
                  <Badge className="bg-green-500">{t('billing.active')}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Available Plans based on Country */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {!currentPlan || currentPlan === 'INACTIVE' ? t('billing.availablePlans') : t('billing.planOverview')}
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
                      <Badge className="bg-green-500">{t('billing.active')}</Badge>
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
                        <Badge className="bg-green-500">{t('billing.active')}</Badge>
                      )}
                    </div>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">{germanyPlans.payPerOrder.price}</span>
                        <span className="text-gray-500 ml-1">{germanyPlans.payPerOrder.currency}</span>
                        <span className="text-gray-500 ml-2">/ {germanyPlans.payPerOrder.unit}</span>
                      </div>
                      <Badge variant="secondary" className="inline-flex">
                        + {germanyPlans.payPerOrder.setupFee} € {t('billing.setupFee')}
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
                      {t('billing.popular')}
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
                          <span className="text-gray-500 ml-1">{germanyPlans.monthly.currency} {t('billing.perMonth')}</span>
                        </div>
                        <div className="flex items-baseline text-sm text-gray-600">
                          oder <span className="font-semibold mx-1">{germanyPlans.monthly.yearlyPrice} €</span> {t('billing.perYear')}
                        </div>
                      </div>
                      <Badge variant="secondary" className="inline-flex">
                        + {germanyPlans.monthly.setupFee} € {t('billing.setupFee')}
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
          {country === 'DE' && (!currentPlan || currentPlan === 'INACTIVE') && (
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
              {currentPlan && currentPlan !== 'INACTIVE' ? (
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
        {currentPlan && currentPlan !== 'INACTIVE' && (
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