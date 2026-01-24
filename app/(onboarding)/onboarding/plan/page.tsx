"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Stepper from '@/components/onboarding/stepper'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, name: 'Restaurant', description: 'Grunddaten', href: '/onboarding' },
  { id: 2, name: 'Plan', description: 'Wählen', href: '/onboarding/plan' },
  { id: 3, name: 'Speisekarte', description: 'Erstellen', href: '/onboarding/menu' },
  { id: 4, name: 'Tische', description: 'QR-Codes', href: '/onboarding/tables' },
  { id: 5, name: 'Fertig', description: 'Los geht\'s', href: '/onboarding/complete' },
]

const plans = [
  {
    id: 'trial',
    name: 'Trial',
    price: '0',
    duration: '100 Bestellungen',
    description: 'Testen Sie Oriido kostenlos',
    features: [
      'Alle Features inklusive',
      'Bis zu 100 Bestellungen',
      'Unbegrenzte Tische',
      'E-Mail Support',
      'Keine Kreditkarte erforderlich',
    ],
    recommended: false,
    current: true,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '79',
    duration: 'pro Monat',
    description: 'Perfekt für wachsende Restaurants',
    features: [
      'Alles aus Trial',
      'POS-Integration',
      'Priority Support',
      'Erweiterte Statistiken',
      'Mitarbeiter-Accounts',
    ],
    recommended: true,
    current: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '149',
    duration: 'pro Monat',
    description: 'Für große Restaurants & Ketten',
    features: [
      'Alles aus Standard',
      'Mehrere Standorte',
      '24/7 Support',
      'API-Zugang',
      'Custom Branding',
    ],
    recommended: false,
    current: false,
  },
]

export default function PlanSelectionPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState('trial')
  const [isLoading, setIsLoading] = useState(false)

  const handleContinue = async () => {
    setIsLoading(true)
    
    try {
      // Für jetzt überspringen wir die Zahlung und setzen mit Trial fort
      if (selectedPlan !== 'trial') {
        toast.info('Zahlung wird später eingerichtet', {
          description: 'Sie starten mit der kostenlosen Testversion.',
        })
      }
      
      router.push('/onboarding/menu')
    } catch (error) {
      toast.error('Fehler', {
        description: 'Bitte versuchen Sie es erneut.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Stepper steps={steps} currentStep={1} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Wählen Sie Ihren Plan</h1>
        <p className="text-gray-600">
          Sie starten automatisch mit der 14-tägigen kostenlosen Testversion. Upgrade jederzeit möglich.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative cursor-pointer transition-all',
              selectedPlan === plan.id && 'ring-2 ring-blue-600',
              plan.recommended && 'border-blue-600'
            )}
            onClick={() => setSelectedPlan(plan.id)}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-blue-600">Empfohlen</Badge>
              </div>
            )}
            {plan.current && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Aktuell</Badge>
              </div>
            )}
            
            <CardHeader>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">€{plan.price}</span>
                <span className="text-gray-600 ml-1">/{plan.duration}</span>
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            
            <CardFooter>
              <Button
                variant={selectedPlan === plan.id ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlan(plan.id)
                }}
              >
                {selectedPlan === plan.id ? 'Ausgewählt' : 'Auswählen'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                Gewählter Plan: {plans.find(p => p.id === selectedPlan)?.name}
              </p>
              <p className="text-sm text-gray-600">
                {selectedPlan === 'trial' 
                  ? 'Sie können jederzeit upgraden'
                  : 'Die Zahlung wird nach der Testversion fällig'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/onboarding')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Weiter...
                  </>
                ) : (
                  <>
                    Weiter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}