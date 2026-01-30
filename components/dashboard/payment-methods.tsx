'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Banknote, 
  Smartphone,
  Globe,
  Save,
  Loader2
} from 'lucide-react'
import { useLanguage } from '@/contexts/language-context'

interface PaymentMethodsProps {
  restaurantId: string
  initialData?: any
}

export default function PaymentMethods({ restaurantId, initialData }: PaymentMethodsProps) {
  const { t } = useLanguage()
  const [settings, setSettings] = useState({
    acceptCash: true,
    acceptCard: false,
    acceptPaypal: false,
    acceptStripe: false
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Lade aktuelle Einstellungen beim Start
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`/api/restaurants/${restaurantId}/payment-settings`)
        if (response.ok) {
          const data = await response.json()
          setSettings({
            acceptCash: data.acceptCash ?? true,
            acceptCard: data.acceptCard ?? false,
            acceptPaypal: data.acceptPaypal ?? false,
            acceptStripe: data.acceptStripe ?? false
          })
        }
      } catch (error) {
        console.error('Error loading payment settings:', error)
      } finally {
        setInitialLoading(false)
      }
    }

    loadSettings()
  }, [restaurantId])

  const saveSettings = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/payment-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success(t('settings.payments.saved') || 'Zahlungseinstellungen gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error(t('settings.payments.saveError') || 'Fehler beim Speichern der Zahlungseinstellungen')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">{t('common.loading') || 'Lädt...'}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zahlungsarten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('settings.payments.acceptedMethods') || 'Akzeptierte Zahlungsarten'}
          </CardTitle>
          <CardDescription>
            {t('settings.payments.description') || 'Wählen Sie aus, welche Zahlungsmethoden Sie akzeptieren'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bargeld */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Banknote className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <Label className="text-base">{t('settings.payments.cash') || 'Bargeld'}</Label>
                <p className="text-sm text-gray-500">
                  {t('settings.payments.cashDescription') || 'Barzahlung bei Lieferung oder Abholung'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.acceptCash}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptCash: checked }))
              }
            />
          </div>

          {/* Kartenzahlung */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <Label className="text-base">{t('settings.payments.card') || 'Kartenzahlung'}</Label>
                <p className="text-sm text-gray-500">
                  {t('settings.payments.cardDescription') || 'Kredit- und Debitkarten vor Ort'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.acceptCard}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptCard: checked }))
              }
            />
          </div>

          {/* Online Payment (Stripe) */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Globe className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-base">{t('settings.payments.stripe') || 'Stripe (Online)'}</Label>
                <p className="text-sm text-gray-500">
                  {t('settings.payments.stripeDescription') || 'Online-Zahlung mit Kreditkarte'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.acceptStripe}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptStripe: checked }))
              }
            />
          </div>

          {/* PayPal */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <Label className="text-base">PayPal</Label>
                <p className="text-sm text-gray-500">
                  {t('settings.payments.paypalDescription') || 'PayPal Online-Zahlungen (Kommt bald)'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.acceptPaypal}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptPaypal: checked }))
              }
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Speichern Button */}
      <div className="flex justify-end">
        <Button 
          onClick={saveSettings} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('common.saving') || 'Speichert...'}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {t('common.save') || 'Speichern'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}