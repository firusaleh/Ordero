'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  CreditCard, 
  Banknote, 
  Smartphone,
  Globe,
  Save,
  Info,
  Shield,
  QrCode,
  Building
} from 'lucide-react'

interface PaymentMethodsProps {
  restaurantId: string
  initialData?: {
    acceptCash?: boolean
    acceptCard?: boolean
    acceptMobile?: boolean
    acceptOnline?: boolean
    minimumOrder?: number
    serviceFee?: number
    tipOptions?: number[]
    bankDetails?: {
      bankName?: string
      iban?: string
      bic?: string
    }
    stripePublicKey?: string
    paypalEmail?: string
  }
}

export default function PaymentMethods({ restaurantId, initialData }: PaymentMethodsProps) {
  const [settings, setSettings] = useState({
    acceptCash: initialData?.acceptCash ?? true,
    acceptCard: initialData?.acceptCard ?? false,
    acceptMobile: initialData?.acceptMobile ?? false,
    acceptOnline: initialData?.acceptOnline ?? false,
    minimumOrder: initialData?.minimumOrder || 0,
    serviceFee: initialData?.serviceFee || 0,
    tipOptions: initialData?.tipOptions || [5, 10, 15, 20],
    bankDetails: {
      bankName: initialData?.bankDetails?.bankName || '',
      iban: initialData?.bankDetails?.iban || '',
      bic: initialData?.bankDetails?.bic || ''
    },
    stripePublicKey: initialData?.stripePublicKey || '',
    paypalEmail: initialData?.paypalEmail || ''
  })
  const [loading, setLoading] = useState(false)

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
        toast.success('Zahlungseinstellungen gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Zahlungseinstellungen')
    } finally {
      setLoading(false)
    }
  }

  const updateTipOption = (index: number, value: number) => {
    const newTipOptions = [...settings.tipOptions]
    newTipOptions[index] = value
    setSettings(prev => ({ ...prev, tipOptions: newTipOptions }))
  }

  return (
    <div className="space-y-6">
      {/* Zahlungsarten */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Akzeptierte Zahlungsarten
          </CardTitle>
          <CardDescription>
            Wählen Sie aus, welche Zahlungsmethoden Sie akzeptieren
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
                <Label className="text-base">Bargeld</Label>
                <p className="text-sm text-gray-500">Barzahlung bei Lieferung oder Abholung</p>
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
                <Label className="text-base">Kartenzahlung</Label>
                <p className="text-sm text-gray-500">Kredit- und Debitkarten vor Ort</p>
              </div>
            </div>
            <Switch
              checked={settings.acceptCard}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptCard: checked }))
              }
            />
          </div>

          {/* Mobile Payment */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <Label className="text-base">Mobile Payment</Label>
                <p className="text-sm text-gray-500">Apple Pay, Google Pay, Samsung Pay</p>
              </div>
            </div>
            <Switch
              checked={settings.acceptMobile}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptMobile: checked }))
              }
            />
          </div>

          {/* Online Payment */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Globe className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <Label className="text-base">Online-Zahlung</Label>
                <p className="text-sm text-gray-500">Stripe, PayPal, Sofortüberweisung</p>
              </div>
            </div>
            <Switch
              checked={settings.acceptOnline}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, acceptOnline: checked }))
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Online Payment Configuration */}
      {settings.acceptOnline && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Online-Zahlungsanbieter
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Ihre Online-Zahlungsanbieter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe */}
            <div>
              <Label htmlFor="stripeKey">Stripe Public Key</Label>
              <Input
                id="stripeKey"
                type="text"
                placeholder="pk_live_..."
                value={settings.stripePublicKey}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, stripePublicKey: e.target.value }))
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Erhalten Sie von Ihrem Stripe Dashboard
              </p>
            </div>

            {/* PayPal */}
            <div>
              <Label htmlFor="paypalEmail">PayPal E-Mail</Label>
              <Input
                id="paypalEmail"
                type="email"
                placeholder="ihr-restaurant@beispiel.de"
                value={settings.paypalEmail}
                onChange={(e) => 
                  setSettings(prev => ({ ...prev, paypalEmail: e.target.value }))
                }
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ihre PayPal Business E-Mail-Adresse
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bankverbindung */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Bankverbindung
          </CardTitle>
          <CardDescription>
            Für Überweisungen und Rechnungen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank</Label>
            <Input
              id="bankName"
              type="text"
              placeholder="z.B. Deutsche Bank"
              value={settings.bankDetails.bankName}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              type="text"
              placeholder="DE89 3704 0044 0532 0130 00"
              value={settings.bankDetails.iban}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  bankDetails: { ...prev.bankDetails, iban: e.target.value }
                }))
              }
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="bic">BIC/SWIFT</Label>
            <Input
              id="bic"
              type="text"
              placeholder="DEUTDEDBFRA"
              value={settings.bankDetails.bic}
              onChange={(e) => 
                setSettings(prev => ({ 
                  ...prev, 
                  bankDetails: { ...prev.bankDetails, bic: e.target.value }
                }))
              }
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bestelleinstellungen */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Bestelleinstellungen
          </CardTitle>
          <CardDescription>
            Mindestbestellwert und Gebühren
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="minimumOrder">Mindestbestellwert (€)</Label>
            <Input
              id="minimumOrder"
              type="number"
              min="0"
              step="0.50"
              value={settings.minimumOrder}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, minimumOrder: parseFloat(e.target.value) || 0 }))
              }
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              0 = Kein Mindestbestellwert
            </p>
          </div>

          <div>
            <Label htmlFor="serviceFee">Servicegebühr (€)</Label>
            <Input
              id="serviceFee"
              type="number"
              min="0"
              step="0.10"
              value={settings.serviceFee}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, serviceFee: parseFloat(e.target.value) || 0 }))
              }
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Wird zu jeder Bestellung hinzugefügt
            </p>
          </div>

          <div>
            <Label>Trinkgeld-Optionen (%)</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {settings.tipOptions.map((tip, index) => (
                <Input
                  key={index}
                  type="number"
                  min="0"
                  max="100"
                  value={tip}
                  onChange={(e) => updateTipOption(index, parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vorschläge für Trinkgeld beim Checkout
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900 flex items-center gap-2">
            <Info className="w-5 h-5" />
            Wichtige Informationen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-blue-800">
            • Online-Zahlungen erfordern ein verifiziertes Geschäftskonto beim Anbieter
          </p>
          <p className="text-sm text-blue-800">
            • Testen Sie alle Zahlungsmethoden gründlich vor dem Live-Gang
          </p>
          <p className="text-sm text-blue-800">
            • Beachten Sie die Gebühren der verschiedenen Zahlungsanbieter
          </p>
          <p className="text-sm text-blue-800">
            • Stellen Sie sicher, dass Ihre Bankdaten korrekt sind
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={saveSettings}
          disabled={loading}
        >
          {loading ? (
            <>Speichern...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Zahlungseinstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}