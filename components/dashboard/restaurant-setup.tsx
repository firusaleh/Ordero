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
  Rocket,
  Power
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

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
  const { t } = useLanguage()
  const [setupProgress, setSetupProgress] = useState(0)
  
  // Definiere alle Setup-Schritte
  const setupSteps: SetupStep[] = [
    // Basis-Informationen
    {
      id: 'basic-info',
      title: t('setup.basic.basicInfo.title'),
      description: t('setup.basic.basicInfo.description'),
      icon: Store,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.name && restaurant.description && restaurant.phone),
      required: true,
      category: 'basic'
    },
    {
      id: 'address',
      title: t('setup.basic.address.title'),
      description: t('setup.basic.address.description'),
      icon: MapPin,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.street && restaurant.city && restaurant.postalCode),
      required: true,
      category: 'basic'
    },
    {
      id: 'contact',
      title: t('setup.basic.contact.title'),
      description: t('setup.basic.contact.description'),
      icon: Phone,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.phone && restaurant.email),
      required: true,
      category: 'basic'
    },
    
    // Speisekarte
    {
      id: 'categories',
      title: t('setup.menu.categories.title'),
      description: t('setup.menu.categories.description'),
      icon: Menu,
      href: '/dashboard/menu',
      completed: restaurant._count.categories > 0,
      required: true,
      category: 'menu'
    },
    {
      id: 'menu-items',
      title: t('setup.menu.items.title'),
      description: t('setup.menu.items.description'),
      icon: ChefHat,
      href: '/dashboard/menu',
      completed: restaurant._count.menuItems >= 5,
      required: true,
      category: 'menu'
    },
    
    // Betrieb
    {
      id: 'tables',
      title: t('setup.operation.tables.title'),
      description: t('setup.operation.tables.description'),
      icon: QrCode,
      href: '/dashboard/tables',
      completed: restaurant._count.tables > 0,
      required: true,
      category: 'operation'
    },
    {
      id: 'opening-hours',
      title: t('setup.operation.hours.title'),
      description: t('setup.operation.hours.description'),
      icon: Clock,
      href: '/dashboard/settings',
      completed: (() => {
        try {
          const hours = restaurant.settings?.openingHours
          
          // Debug logging
          console.log('[Opening Hours Debug] Raw hours:', hours)
          console.log('[Opening Hours Debug] Type:', typeof hours)
          
          if (!hours) {
            console.log('[Opening Hours Debug] No hours found')
            return false
          }
          
          const parsed = typeof hours === 'string' ? JSON.parse(hours) : hours
          console.log('[Opening Hours Debug] Parsed:', parsed)
          
          // Prüfe ob es ein Objekt mit Wochentagen ist
          if (typeof parsed === 'object' && !Array.isArray(parsed)) {
            // Prüfe ob mindestens ein Tag geöffnet ist und Zeitfenster hat
            const result = Object.values(parsed).some((day: any) => 
              day?.isOpen === true && 
              day?.timeSlots && 
              Array.isArray(day.timeSlots) && 
              day.timeSlots.length > 0 &&
              day.timeSlots.some((slot: any) => slot?.open && slot?.close)
            )
            console.log('[Opening Hours Debug] Validation result:', result)
            return result
          }
          
          // Fallback für Array-Format (altes Format)
          if (Array.isArray(parsed)) {
            console.log('[Opening Hours Debug] Array format detected')
            return parsed.some((day: any) => 
              day.isOpen === true && day.openTime && day.closeTime
            )
          }
          
          console.log('[Opening Hours Debug] Unknown format')
          return false
        } catch (e) {
          console.error('[Opening Hours Debug] Error:', e)
          return false
        }
      })(),
      required: false,
      category: 'operation'
    },
    {
      id: 'payment',
      title: t('setup.operation.payment.title'),
      description: t('setup.operation.payment.description'),
      icon: CreditCard,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.settings?.acceptCash || restaurant.settings?.acceptCard),
      required: true,
      category: 'operation'
    },
    
    // Erweitert
    {
      id: 'design',
      title: t('setup.advanced.design.title'),
      description: t('setup.advanced.design.description'),
      icon: Palette,
      href: '/dashboard/settings',
      completed: Boolean(restaurant.logo || restaurant.primaryColor),
      required: false,
      category: 'advanced'
    },
    {
      id: 'staff',
      title: t('setup.advanced.staff.title'),
      description: t('setup.advanced.staff.description'),
      icon: Users,
      href: '/dashboard/staff',
      completed: false,
      required: false,
      category: 'advanced'
    },
    {
      id: 'notifications',
      title: t('setup.advanced.notifications.title'),
      description: t('setup.advanced.notifications.description'),
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
      toast.error(t('setup.errors.incompleteSteps'))
      return
    }

    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/go-live`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success(t('setup.success.goLive'))
        router.refresh()
      }
    } catch (error) {
      toast.error(t('setup.errors.activationFailed'))
    }
  }

  const handleGoOffline = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/go-offline`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Restaurant wurde offline genommen')
        router.refresh()
      }
    } catch (error) {
      toast.error('Fehler beim Offline-Nehmen')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('setup.title')}</h1>
          <p className="text-gray-600 mt-2">
            {t('setup.subtitle')}
          </p>
        </div>
        
        {restaurant.status === 'ACTIVE' ? (
          <div className="flex gap-2 items-center">
            <Badge className="bg-green-100 text-green-800">
              Online
            </Badge>
            <Button
              size="lg"
              variant="destructive"
              onClick={handleGoOffline}
            >
              <Power className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              Offline nehmen
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            {restaurant.status === 'INACTIVE' && (
              <Badge variant="secondary">
                Offline
              </Badge>
            )}
            <Button
              size="lg"
              disabled={setupProgress < 100}
              onClick={handleGoLive}
              className={setupProgress === 100 ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              <Rocket className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
              {setupProgress === 100 ? t('setup.goLive') : t('setup.completeSetup')}
            </Button>
          </div>
        )}
      </div>

      {/* Gesamt-Fortschritt */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>{t('setup.progress.title')}</CardTitle>
              <CardDescription>
                {t('setup.progress.description')
                  .replace('{{completed}}', setupSteps.filter(s => s.completed && s.required).length.toString())
                  .replace('{{total}}', setupSteps.filter(s => s.required).length.toString())}
              </CardDescription>
            </div>
            <div className="text-right rtl:text-left">
              <div className="text-3xl font-bold">{setupProgress}%</div>
              <Badge variant={setupProgress === 100 ? 'default' : 'secondary'}>
                {setupProgress === 100 ? t('setup.progress.ready') : t('setup.progress.inProgress')}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={setupProgress} className="h-3" />
          
          {setupProgress === 100 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 rtl:gap-x-reverse text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">{t('setup.congratulations')}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basis-Informationen */}
      <div>
        <div className="flex items-center gap-2 rtl:gap-x-reverse mb-4">
          <Store className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('setup.basic.title')}</h2>
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
                        <CardTitle className="text-base flex items-center gap-2 rtl:gap-x-reverse">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              {t('setup.required')}
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
                    {step.completed ? t('setup.edit') : t('setup.setup')}
                    <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Speisekarte */}
      <div>
        <div className="flex items-center gap-2 rtl:gap-x-reverse mb-4">
          <Menu className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('setup.menu.title')}</h2>
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
                        <CardTitle className="text-base flex items-center gap-2 rtl:gap-x-reverse">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              {t('setup.required')}
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
                      <span className="text-gray-500"> {t('setup.stats.categoriesCreated')}</span>
                    </div>
                  )}
                  {step.id === 'menu-items' && (
                    <div className="mb-3 text-sm">
                      <span className="font-medium">{restaurant._count.menuItems}</span>
                      <span className="text-gray-500"> {t('setup.stats.itemsCreated')}</span>
                    </div>
                  )}
                  
                  <Button 
                    variant={step.completed ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? t('setup.manage') : t('setup.create')}
                    <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Betrieb */}
      <div>
        <div className="flex items-center gap-2 rtl:gap-x-reverse mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('setup.operation.title')}</h2>
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
                        <CardTitle className="text-base flex items-center gap-2 rtl:gap-x-reverse">
                          {step.title}
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              {t('setup.required')}
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
                      <span className="text-gray-500"> {t('setup.stats.tablesCreated')}</span>
                    </div>
                  )}
                  
                  <Button 
                    variant={step.completed ? 'outline' : 'default'}
                    size="sm"
                    className="w-full"
                  >
                    {step.completed ? t('setup.edit') : t('setup.configure')}
                    <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Erweiterte Einstellungen */}
      <div>
        <div className="flex items-center gap-2 rtl:gap-x-reverse mb-4">
          <Shield className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold">{t('setup.advanced.title')}</h2>
          <Badge variant="secondary">{t('setup.optional')}</Badge>
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
                    {step.completed ? t('setup.customize') : t('setup.setup')}
                    <ArrowRight className="w-4 h-4 ml-2 rtl:ml-0 rtl:mr-2 rtl:rotate-180" />
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
          <CardTitle className="text-blue-900 flex items-center gap-2 rtl:gap-x-reverse">
            <AlertCircle className="w-5 h-5" />
            {t('setup.tips.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            • {t('setup.tips.tip1')}
          </p>
          <p className="text-sm text-blue-800">
            • {t('setup.tips.tip2')}
          </p>
          <p className="text-sm text-blue-800">
            • {t('setup.tips.tip3')}
          </p>
          <p className="text-sm text-blue-800">
            • {t('setup.tips.tip4')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}