'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard,
  Building2,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface StripeBankSettingsProps {
  restaurantId: string
  restaurantName: string
}

export function StripeBankSettings({ 
  restaurantId,
  restaurantName 
}: StripeBankSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bankData, setBankData] = useState({
    accountHolderName: '',
    accountHolderType: 'individual', // individual or company
    bankName: '',
    iban: '',
    bic: '',
    country: 'DE',
    currency: 'EUR'
  })

  // Lade gespeicherte Bankdaten
  useEffect(() => {
    fetchBankData()
  }, [restaurantId])

  const fetchBankData = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/bank-settings?provider=stripe`)
      if (response.ok) {
        const data = await response.json()
        if (data.bankSettings) {
          setBankData(data.bankSettings)
          setSaved(true)
        }
      }
    } catch (error) {
      console.error('Error fetching bank data:', error)
    }
  }

  const saveBankData = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/restaurants/${restaurantId}/bank-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'stripe',
          bankSettings: bankData
        })
      })

      if (response.ok) {
        setSaved(true)
        toast.success('Stripe-Bankdaten erfolgreich gespeichert!')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error saving bank data:', error)
      toast.error('Fehler beim Speichern der Bankdaten')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Stripe Auszahlungen (Europa)
        </CardTitle>
        <CardDescription>
          Bankdaten für automatische Auszahlungen von Stripe-Zahlungen (Kreditkarte, SEPA, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {saved && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Bankdaten sind hinterlegt. Auszahlungen erfolgen automatisch.
            </AlertDescription>
          </Alert>
        )}

        {!saved && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bitte hinterlegen Sie Ihre Bankdaten für automatische Stripe-Auszahlungen.
              Diese werden für SEPA-Überweisungen innerhalb Europas verwendet.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="accountHolderName">Kontoinhaber</Label>
            <Input
              id="accountHolderName"
              placeholder={`z.B. ${restaurantName} GmbH`}
              value={bankData.accountHolderName}
              onChange={(e) => setBankData({
                ...bankData,
                accountHolderName: e.target.value
              })}
            />
          </div>

          <div>
            <Label htmlFor="accountHolderType">Kontotyp</Label>
            <select
              id="accountHolderType"
              className="w-full px-3 py-2 border rounded-md"
              value={bankData.accountHolderType}
              onChange={(e) => setBankData({
                ...bankData,
                accountHolderType: e.target.value
              })}
            >
              <option value="individual">Privatkonto</option>
              <option value="company">Geschäftskonto</option>
            </select>
          </div>

          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="z.B. Deutsche Bank, Commerzbank, Sparkasse"
              value={bankData.bankName}
              onChange={(e) => setBankData({
                ...bankData,
                bankName: e.target.value
              })}
            />
          </div>

          <div>
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              placeholder="DE89 3704 0044 0532 0130 00"
              value={bankData.iban}
              onChange={(e) => setBankData({
                ...bankData,
                iban: e.target.value.toUpperCase()
              })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Für SEPA-Überweisungen innerhalb der EU
            </p>
          </div>

          <div>
            <Label htmlFor="bic">BIC/SWIFT</Label>
            <Input
              id="bic"
              placeholder="z.B. DEUTDEFF oder COBADEFF"
              value={bankData.bic}
              onChange={(e) => setBankData({
                ...bankData,
                bic: e.target.value.toUpperCase()
              })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Land</Label>
              <select
                id="country"
                className="w-full px-3 py-2 border rounded-md"
                value={bankData.country}
                onChange={(e) => setBankData({
                  ...bankData,
                  country: e.target.value
                })}
              >
                <option value="DE">Deutschland</option>
                <option value="AT">Österreich</option>
                <option value="CH">Schweiz</option>
                <option value="NL">Niederlande</option>
                <option value="FR">Frankreich</option>
                <option value="IT">Italien</option>
                <option value="ES">Spanien</option>
              </select>
            </div>

            <div>
              <Label htmlFor="currency">Währung</Label>
              <select
                id="currency"
                className="w-full px-3 py-2 border rounded-md"
                value={bankData.currency}
                onChange={(e) => setBankData({
                  ...bankData,
                  currency: e.target.value
                })}
              >
                <option value="EUR">EUR - Euro</option>
                <option value="CHF">CHF - Schweizer Franken</option>
                <option value="GBP">GBP - Britisches Pfund</option>
              </select>
            </div>
          </div>

          <Button 
            onClick={saveBankData}
            disabled={loading || !bankData.accountHolderName || !bankData.iban || !bankData.bic}
            className="w-full"
          >
            <Building2 className="h-4 w-4 mr-2" />
            {saved ? 'Bankdaten aktualisieren' : 'Bankdaten speichern'}
          </Button>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Stripe Auszahlungsplan:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Tägliche automatische Auszahlungen</li>
            <li>• Bearbeitungszeit: 2-3 Werktage</li>
            <li>• Mindestbetrag: 1 EUR</li>
            <li>• Gebühr: 2.5% Plattformgebühr</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}