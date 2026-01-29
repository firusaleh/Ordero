'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/language-context'
import { 
  Settings, 
  Store, 
  Bell, 
  Zap, 
  ArrowRight,
  Palette,
  Globe,
  Shield,
  Database,
  CreditCard,
  MapPin
} from 'lucide-react'


export default function SettingsPage() {
  const router = useRouter()
  const { t } = useLanguage()

  const settingsCategories = [
    {
      title: t('settings.general.title'),
      description: t('settings.general.description'),
      href: '/dashboard/settings/general',
      icon: Settings,
      color: 'bg-blue-500'
    },
    {
      title: t('settings.location.title'),
      description: t('settings.location.description'),
      href: '/dashboard/settings/location',
      icon: MapPin,
      color: 'bg-red-500',
      badge: 'WICHTIG'
    },
    {
      title: t('settings.features.title'),
      description: t('settings.features.description'),
      href: '/dashboard/settings/features',
      icon: Bell,
      color: 'bg-purple-500'
    },
    {
      title: t('settings.payments.title'),
      description: t('settings.payments.description'),
      href: '/dashboard/settings/payments',
      icon: CreditCard,
      color: 'bg-emerald-500',
      badge: 'NEU'
    },
    {
      title: t('settings.fees.title'),
      description: t('settings.fees.description'),
      href: '/dashboard/settings/fees',
      icon: CreditCard,
      color: 'bg-amber-500',
      badge: 'NEU'
    },
    {
      title: t('settings.customFees.title'),
      description: t('settings.customFees.description'),
      href: '/dashboard/settings/custom-fees',
      icon: CreditCard,
      color: 'bg-orange-500',
      badge: 'NEU'
    },
    {
      title: t('settings.pos.title'),
      description: t('settings.pos.description'),
      href: '/dashboard/settings/pos',
      icon: Zap,
      color: 'bg-green-500',
      badge: 'NEU'
    },
    {
      title: t('settings.design.title'),
      description: t('settings.design.description'),
      href: '/dashboard/settings/design',
      icon: Palette,
      color: 'bg-pink-500'
    },
    {
      title: t('settings.language.title'),
      description: t('settings.language.description'),
      href: '/dashboard/settings/localization',
      icon: Globe,
      color: 'bg-indigo-500'
    },
    {
      title: t('settings.security.title'),
      description: t('settings.security.description'),
      href: '/dashboard/settings/security',
      icon: Shield,
      color: 'bg-red-500'
    },
    {
      title: t('settings.data.title'),
      description: t('settings.data.description'),
      href: '/dashboard/settings/data',
      icon: Database,
      color: 'bg-gray-500',
      disabled: true
    }
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600">{t('settings.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsCategories.map((category) => {
          const Icon = category.icon
          return (
            <Card 
              key={category.href}
              className={`relative hover:shadow-lg transition-shadow ${
                category.disabled ? 'opacity-60' : 'cursor-pointer'
              }`}
              onClick={() => !category.disabled && router.push(category.href)}
            >
              {category.badge && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {category.badge}
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${category.color} bg-opacity-10 w-fit`}>
                    <Icon className={`h-6 w-6 ${category.color.replace('bg-', 'text-')}`} />
                  </div>
                  {!category.disabled && (
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <CardTitle className="text-lg mt-3">{category.title}</CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
              </CardHeader>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('settings.help.title')}</CardTitle>
          <CardDescription>
            {t('settings.help.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => window.open('https://docs.oriido.com', '_blank')}
            >
              {t('common.documentation')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open('mailto:support@oriido.com', '_blank')}
            >
              {t('common.support')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}