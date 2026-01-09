'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Globe, Clock, DollarSign, Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Language } from '@/lib/i18n/translations'

export default function LocalizationSettingsPage() {
  const router = useRouter()
  const { language: currentLanguage, setLanguage: setGlobalLanguage } = useLanguage()
  const [language, setLanguage] = useState<Language>(currentLanguage)
  const [currency, setCurrency] = useState('EUR')
  const [timezone, setTimezone] = useState('Europe/Berlin')
  const [dateFormat, setDateFormat] = useState('DD.MM.YYYY')
  const [timeFormat, setTimeFormat] = useState('24h')

  useEffect(() => {
    setLanguage(currentLanguage)
  }, [currentLanguage])

  const handleSave = () => {
    setGlobalLanguage(language)
    toast.success('Sprach- und Regionseinstellungen gespeichert')
    // Seite neu laden, um die Sprache zu aktualisieren
    setTimeout(() => {
      window.location.reload()
    }, 500)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sprache & Region</h1>
          <p className="text-gray-600">Konfigurieren Sie Sprache, Währung und Zeitzone</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Globe className="inline-block h-5 w-5 mr-2" />
              Spracheinstellungen
            </CardTitle>
            <CardDescription>
              Wählen Sie die Standardsprache für Ihr Restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Hauptsprache</Label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'de' | 'en' | 'tr' | 'ar')}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="tr">Türkçe</option>
                <option value="ar">العربية</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Zusätzliche Sprachen</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>English</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Français</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Türkçe</span>
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Gäste können zwischen diesen Sprachen wählen
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <DollarSign className="inline-block h-5 w-5 mr-2" />
              Währung
            </CardTitle>
            <CardDescription>
              Standardwährung für Preise und Zahlungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Währung</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EUR">EUR - Euro (€)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="GBP">GBP - Britisches Pfund (£)</option>
                <option value="CHF">CHF - Schweizer Franken</option>
                <option value="TRY">TRY - Türkische Lira (₺)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Preisformat</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>1.234,56 €</option>
                <option>€ 1.234,56</option>
                <option>1,234.56 €</option>
                <option>€ 1,234.56</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Dezimalstellen</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>2 Stellen (12,50)</option>
                <option>0 Stellen (13)</option>
                <option>1 Stelle (12,5)</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Clock className="inline-block h-5 w-5 mr-2" />
              Zeit & Datum
            </CardTitle>
            <CardDescription>
              Zeitzone und Formatierung
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Zeitzone</Label>
              <select
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Europe/Berlin">Berlin (UTC+1)</option>
                <option value="Europe/London">London (UTC+0)</option>
                <option value="Europe/Paris">Paris (UTC+1)</option>
                <option value="Europe/Istanbul">Istanbul (UTC+3)</option>
                <option value="America/New_York">New York (UTC-5)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Zeitformat</Label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="24h">24-Stunden (14:30)</option>
                <option value="12h">12-Stunden (2:30 PM)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Datumsformat</Label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="DD.MM.YYYY">31.12.2024</option>
                <option value="MM/DD/YYYY">12/31/2024</option>
                <option value="YYYY-MM-DD">2024-12-31</option>
                <option value="DD/MM/YYYY">31/12/2024</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar className="inline-block h-5 w-5 mr-2" />
              Regionale Einstellungen
            </CardTitle>
            <CardDescription>
              Weitere lokale Anpassungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Erster Wochentag</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>Montag</option>
                <option>Sonntag</option>
                <option>Samstag</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Zahlenformat</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>1.234.567,89 (Deutsch)</option>
                <option>1,234,567.89 (Englisch)</option>
                <option>1 234 567,89 (Französisch)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Telefonnummernformat</Label>
              <select className="w-full px-3 py-2 border rounded-lg">
                <option>+49 30 12345678</option>
                <option>030 12345678</option>
                <option>+49 (30) 12345678</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button onClick={handleSave}>
          Änderungen speichern
        </Button>
      </div>
    </div>
  )
}