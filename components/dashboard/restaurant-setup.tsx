'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle,
  Circle,
  Store,
  Menu,
  Table,
  Clock,
  CreditCard,
  Users,
  Settings,
  Globe,
  MapPin,
  Phone,
  Mail,
  Palette,
  Image,
  AlertCircle,
  ArrowRight,
  ChefHat,
  QrCode,
  Bell,
  Shield,
  Rocket
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RestaurantSetupProps {
  restaurant: any
}

interface SetupStep {
  id: string
  title: string
  description: string
  icon: any
  href: string
  completed: boolean
  required: boolean
  category: 'basic' | 'menu' | 'operation' | 'advanced'
}

export default function RestaurantSetup({ restaurant }: RestaurantSetupProps) {
  const router = useRouter()
  const [setupProgress, setSetupProgress] = useState(0)
  
  // Definiere alle Setup-Schritte
  const setupSteps: SetupStep[] = [
    // Basis-Informationen
    {
      id: 'basic-info',
      title: 'Grunddaten',
      description: 'Restaurant-Name, Beschreibung und Kontaktdaten',
      icon: Store,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.name && restaurant.description && restaurant.phone),
      required: true,
      category: 'basic'
    },
    {
      id: 'address',
      title: 'Adresse',
      description: 'Vollständige Adresse für Kunden',
      icon: MapPin,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.street && restaurant.city && restaurant.postalCode),
      required: true,
      category: 'basic'
    },
    {
      id: 'contact',
      title: 'Kontakt',
      description: 'Telefon, E-Mail und Website',
      icon: Phone,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.phone && restaurant.email),
      required: true,
      category: 'basic'
    },
    
    // Speisekarte
    {
      id: 'categories',
      title: 'Kategorien',
      description: 'Speisekarten-Kategorien anlegen',
      icon: Menu,
      href: '/dashboard/menu',
      completed: restaurant._count.categories > 0,
      required: true,
      category: 'menu'
    },
    {
      id: 'menu-items',
      title: 'Speisen & Getränke',
      description: 'Mindestens 5 Artikel anlegen',
      icon: ChefHat,
      href: '/dashboard/menu',
      completed: restaurant._count.menuItems >= 5,
      required: true,
      category: 'menu'
    },
    
    // Betrieb
    {
      id: 'tables',
      title: 'Tische & QR-Codes',
      description: 'Tische anlegen und QR-Codes generieren',
      icon: QrCode,
      href: '/dashboard/tables',
      completed: restaurant._count.tables > 0,
      required: true,
      category: 'operation'
    },
    {
      id: 'opening-hours',
      title: 'Öffnungszeiten',
      description: 'Geschäftszeiten festlegen',
      icon: Clock,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.settings?.openingHours),
      required: false,
      category: 'operation'
    },
    {
      id: 'payment',
      title: 'Zahlungsmethoden',
      description: 'Akzeptierte Zahlungsarten konfigurieren',
      icon: CreditCard,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.settings?.acceptCash || restaurant.settings?.acceptCard),
      required: true,
      category: 'operation'
    },
    
    // Erweitert
    {
      id: 'design',
      title: 'Design & Aussehen',
      description: 'Logo, Farben und Bilder',
      icon: Palette,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.logo || restaurant.primaryColor),
      required: false,
      category: 'advanced'
    },
    {
      id: 'staff',
      title: 'Mitarbeiter',
      description: 'Team-Mitglieder hinzufügen',
      icon: Users,
      href: '/dashboard/staff',
      completed: false,
      required: false,
      category: 'advanced'
    },
    {
      id: 'notifications',
      title: 'Benachrichtigungen',
      description: 'E-Mail und Sound-Benachrichtigungen',
      icon: Bell,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.settings?.emailNotifications),
      required: false,
      category: 'advanced'
    }
  ]

  // Berechne Fortschritt
  useEffect(() => {
    const requiredSteps = setupSteps.filter(step => step.required)
    const completedRequired = requiredSteps.filter(step => step.completed)
    const progress = Math.round((completedRequired.length / requiredSteps.length) * 100)
    setSetupProgress(progress)
  }, [restaurant])

  const getStepsByCategory = (category: string) => {
    return setupSteps.filter(step => step.category === category)
  }

  const getCategoryProgress = (category: string) => {
    const steps = getStepsByCategory(category)
    const completed = steps.filter(step => step.completed)
    return {
      completed: completed.length,
      total: steps.length,
      percentage: Math.round((completed.length / steps.length) * 100)
    }
  }

  const handleGoLive = async () => {
    if (setupProgress < 100) {
      toast.error('Bitte schließen Sie alle erforderlichen Schritte ab')
      return
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/go-live`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Restaurant ist jetzt live! 🎉')
        router.push('/dashboard')
      }
    } catch (error) {
      toast.error('Fehler beim Aktivieren')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Restaurant einrichten</h1>
          <p className="text-gray-600 mt-2">
            Vervollständigen Sie die Einrichtung, um online zu gehen
          </p>
        </div>
        
        <Button
          size="lg"
          disabled={setupProgress < 100}
          onClick={handleGoLive}
          className={setupProgress === 100 ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          <Rocket className="w-4 h-4 mr-2" />
          {setupProgress === 100 ? 'Jetzt Live gehen!' : 'Einrichtung abschließen'}
        </Button>
      </div>

      {/* Gesamt-Fortschritt */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Gesamt-Fortschritt</CardTitle>
              <CardDescription>
                {setupSteps.filter(s => s.completed && s.required).length} von {setupSteps.filter(s => s.required).length} erforderlichen Schritten abgeschlossen
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{setupProgress}%</div>
              <Badge variant={setupProgress === 100 ? 'default' : 'secondary'}>
                {setupProgress === 100 ? 'Bereit' : 'In Bearbeitung'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={setupProgress} className="h-3" />
          
          {setupProgress === 100 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Glückwunsch! Ihr Restaurant ist bereit für Bestellungen.</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basis-Informationen */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Basis-Informationen</h2>
          <Badge variant="outline">
            {getCategoryProgress('basic').completed}/{getCategoryProgress('basic').total}
          </Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {getStepsByCategory('basic').map(step => {
            const Icon = step.icon
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  step.completed ? 'border-green-200 bg-green-50/50' : ''
                }`}
                onClick={() => router.push(step.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.completed ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Erforderlich
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <Button 
                    variant={step.completed ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? 'Bearbeiten' : 'Einrichten'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Speisekarte */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Menu className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Speisekarte</h2>
          <Badge variant="outline">
            {getCategoryProgress('menu').completed}/{getCategoryProgress('menu').total}
          </Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {getStepsByCategory('menu').map(step => {
            const Icon = step.icon
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  step.completed ? 'border-green-200 bg-green-50/50' : ''
                }`}
                onClick={() => router.push(step.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.completed ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Erforderlich
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  
                  {/* Zusätzliche Stats für Speisekarte */}
                  {step.id === 'categories' && (
                    <div className="mb-3 text-sm">
                      <span className="font-medium">{restaurant._count.categories}</span>
                      <span className="text-gray-500"> Kategorien angelegt</span>
                    </div>
                  )}
                  {step.id === 'menu-items' && (
                    <div className="mb-3 text-sm">
                      <span className="font-medium">{restaurant._count.menuItems}</span>
                      <span className="text-gray-500"> Artikel angelegt</span>
                    </div>
                  )}
                  
                  <Button 
                    variant={step.completed ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? 'Verwalten' : 'Anlegen'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Betrieb */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Betrieb</h2>
          <Badge variant="outline">
            {getCategoryProgress('operation').completed}/{getCategoryProgress('operation').total}
          </Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {getStepsByCategory('operation').map(step => {
            const Icon = step.icon
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  step.completed ? 'border-green-200 bg-green-50/50' : ''
                }`}
                onClick={() => router.push(step.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.completed ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Erforderlich
                            </Badge>
                          )}
                        </CardTitle>
                      </div>
                    </div>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  
                  {/* Zusätzliche Stats für Tische */}
                  {step.id === 'tables' && restaurant._count.tables > 0 && (
                    <div className="mb-3 text-sm">
                      <span className="font-medium">{restaurant._count.tables}</span>
                      <span className="text-gray-500"> Tische angelegt</span>
                    </div>
                  )}
                  
                  <Button 
                    variant={step.completed ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? 'Bearbeiten' : 'Konfigurieren'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Erweiterte Einstellungen */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">Erweiterte Einstellungen</h2>
          <Badge variant="secondary">Optional</Badge>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {getStepsByCategory('advanced').map(step => {
            const Icon = step.icon
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  step.completed ? 'border-blue-200 bg-blue-50/50' : ''
                }`}
                onClick={() => router.push(step.href)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          step.completed ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {step.title}
                        </CardTitle>
                      </div>
                    </div>
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">{step.description}</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? 'Anpassen' : 'Einrichten'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Tipps für den Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            • Beginnen Sie mit den Grunddaten und arbeiten Sie sich nach unten vor
          </p>
          <p className="text-sm text-blue-800">
            • Laden Sie hochwertige Bilder Ihrer Speisen hoch - das erhöht die Bestellungen
          </p>
          <p className="text-sm text-blue-800">
            • Testen Sie den QR-Code Bestellvorgang selbst, bevor Sie live gehen
          </p>
          <p className="text-sm text-blue-800">
            • Schulen Sie Ihr Personal im Umgang mit dem System
          </p>
        </CardContent>
      </Card>
    </div>
  )
}