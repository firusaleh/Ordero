'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Globe,
  Shield,
  Info
} from 'lucide-react'
import { toast } from 'sonner'

interface PayTabsSettingsProps {
  restaurantId: string
}

export function PayTabsSettings({ restaurantId }: PayTabsSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState({
    acceptPaytabs: false,
    paytabsProfileId: '',
    paytabsServerKey: '',
    paytabsClientKey: '',
    paytabsRegion: 'JOR',
    paytabsCurrency: 'JOD'
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/payment-settings`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings || settings)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error)
    }
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/payment-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        toast.success('PayTabs-Einstellungen gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/paytabs/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: settings.paytabsProfileId,
          serverKey: settings.paytabsServerKey
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('PayTabs-Verbindung erfolgreich!')
      } else {
        toast.error('PayTabs-Verbindung fehlgeschlagen')
      }
    } catch (error) {
      toast.error('Verbindungstest fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                PayTabs Integration
              </CardTitle>
              <CardDescription>
                Akzeptieren Sie Zahlungen in Jordanien und dem Nahen Osten
              </CardDescription>
            </div>
            <Switch
              checked={settings.acceptPaytabs}
              onCheckedChange={(checked) => 
                setSettings({ ...settings, acceptPaytabs: checked })
              }
            />
          </div>
        </CardHeader>
        
        {settings.acceptPaytabs && (
          <CardContent className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                PayTabs ist die führende Zahlungslösung für den Nahen Osten. 
                Perfekt für Restaurants in Jordanien, Saudi-Arabien, VAE und anderen arabischen Ländern.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="profileId">Profile ID</Label>
                <Input
                  id="profileId"
                  type="text"
                  placeholder="Ihre PayTabs Profile ID"
                  value={settings.paytabsProfileId}
                  onChange={(e) => 
                    setSettings({ ...settings, paytabsProfileId: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="serverKey">Server Key</Label>
                <Input
                  id="serverKey"
                  type="password"
                  placeholder="Ihr PayTabs Server Key"
                  value={settings.paytabsServerKey}
                  onChange={(e) => 
                    setSettings({ ...settings, paytabsServerKey: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="clientKey">Client Key (Optional)</Label>
                <Input
                  id="clientKey"
                  type="password"
                  placeholder="Ihr PayTabs Client Key für Frontend"
                  value={settings.paytabsClientKey}
                  onChange={(e) => 
                    setSettings({ ...settings, paytabsClientKey: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="region">Region</Label>
                  <select
                    id="region"
                    className="w-full px-3 py-2 border rounded-md"
                    value={settings.paytabsRegion}
                    onChange={(e) => 
                      setSettings({ ...settings, paytabsRegion: e.target.value })
                    }
                  >
                    <option value="JOR">Jordanien</option>
                    <option value="SAU">Saudi-Arabien</option>
                    <option value="UAE">VAE</option>
                    <option value="EGY">Ägypten</option>
                    <option value="KWT">Kuwait</option>
                    <option value="BHR">Bahrain</option>
                    <option value="OMN">Oman</option>
                    <option value="QAT">Katar</option>
                    <option value="LBN">Libanon</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="currency">Währung</Label>
                  <select
                    id="currency"
                    className="w-full px-3 py-2 border rounded-md"
                    value={settings.paytabsCurrency}
                    onChange={(e) => 
                      setSettings({ ...settings, paytabsCurrency: e.target.value })
                    }
                  >
                    <option value="JOD">JOD - Jordanischer Dinar</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="AED">AED - VAE Dirham</option>
                    <option value="EGP">EGP - Ägyptisches Pfund</option>
                    <option value="KWD">KWD - Kuwait-Dinar</option>
                    <option value="BHD">BHD - Bahrain-Dinar</option>
                    <option value="OMR">OMR - Oman Rial</option>
                    <option value="QAR">QAR - Katar Riyal</option>
                    <option value="LBP">LBP - Libanesisches Pfund</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={testConnection}
                variant="outline"
                disabled={loading || !settings.paytabsProfileId || !settings.paytabsServerKey}
              >
                <Shield className="h-4 w-4 mr-2" />
                Verbindung testen
              </Button>
              
              <Button
                onClick={saveSettings}
                disabled={loading}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Einstellungen speichern
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {settings.acceptPaytabs && settings.paytabsProfileId && (
        <Card>
          <CardHeader>
            <CardTitle>Unterstützte Zahlungsmethoden</CardTitle>
            <CardDescription>
              Diese Zahlungsmethoden sind in Ihrer Region verfügbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CreditCard className="h-5 w-5 text-blue-600" />
                <span>Visa / Mastercard</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Globe className="h-5 w-5 text-green-600" />
                <span>Mada (مدى)</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
                <span>American Express</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Globe className="h-5 w-5 text-orange-600" />
                <span>UnionPay</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <CreditCard className="h-5 w-5 text-red-600" />
                <span>STC Pay</span>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg">
                <Globe className="h-5 w-5 text-blue-500" />
                <span>Apple Pay</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>PayTabs Konto erforderlich:</strong> Sie benötigen ein aktives PayTabs-Händlerkonto. 
          Registrieren Sie sich unter{' '}
          <a 
            href="https://merchant.paytabs.com/merchant/register" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            merchant.paytabs.com
          </a>
        </AlertDescription>
      </Alert>
    </div>
  )
}