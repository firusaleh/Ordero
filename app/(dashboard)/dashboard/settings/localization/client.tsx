'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Globe, Clock, DollarSign, Calendar, Save } from 'lucide-react'

interface LocalizationSettings {
  language: string
  currency: string
  timezone: string
  dateFormat: string
  timeFormat: string
}

interface LocalizationSettingsClientProps {
  restaurantId: string
  initialSettings: LocalizationSettings
}

const LANGUAGES = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
]

const CURRENCIES = [
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar' },
  { code: 'SAR', symbol: 'ر.س', name: 'Saudi Riyal' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' }
]

const TIMEZONES = [
  { value: 'Europe/Berlin', label: 'Berlin (GMT+1)' },
  { value: 'Europe/London', label: 'London (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
  { value: 'Europe/Vienna', label: 'Vienna (GMT+1)' },
  { value: 'Asia/Dubai', label: 'Dubai (GMT+4)' },
  { value: 'Asia/Amman', label: 'Amman (GMT+2)' },
  { value: 'Asia/Riyadh', label: 'Riyadh (GMT+3)' }
]

export default function LocalizationSettingsClient({ 
  restaurantId, 
  initialSettings 
}: LocalizationSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            language: settings.language,
            currency: settings.currency,
            timezone: settings.timezone,
            dateFormat: settings.dateFormat,
            timeFormat: settings.timeFormat
          }
        })
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast.success('Sprach- und Regionseinstellungen gespeichert')
    } catch (error) {
      toast.error('Einstellungen konnten nicht gespeichert werden')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sprache & Region</h1>
        <p className="text-gray-600">Konfigurieren Sie Sprache, Währung und Zeitzone</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Sprache
            </CardTitle>
            <CardDescription>
              Wählen Sie die Standardsprache für Ihr Restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Sprache</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Die Sprache gilt für das Dashboard und E-Mails
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Währung
            </CardTitle>
            <CardDescription>
              Wählen Sie die Standardwährung für Preise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Währung</Label>
              <Select
                value={settings.currency}
                onValueChange={(value) => setSettings({ ...settings, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono">{currency.symbol}</span>
                        <span>{currency.name} ({currency.code})</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Alle Preise werden in dieser Währung angezeigt
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Zeitzone
            </CardTitle>
            <CardDescription>
              Wählen Sie Ihre lokale Zeitzone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Zeitzone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => setSettings({ ...settings, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                Verwendet für Bestellzeiten und Berichte
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Datums- und Zeitformat
            </CardTitle>
            <CardDescription>
              Wählen Sie das Anzeigeformat für Datum und Zeit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Datumsformat</Label>
              <Select
                value={settings.dateFormat}
                onValueChange={(value) => setSettings({ ...settings, dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD.MM.YYYY">DD.MM.YYYY (31.12.2024)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Zeitformat</Label>
              <Select
                value={settings.timeFormat}
                onValueChange={(value) => setSettings({ ...settings, timeFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">24 Stunden (14:30)</SelectItem>
                  <SelectItem value="12h">12 Stunden (2:30 PM)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            'Speichern...'
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}