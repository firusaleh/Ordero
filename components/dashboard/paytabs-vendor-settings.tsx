'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  CreditCard,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Wallet,
  ArrowUpRight,
  Calendar
} from 'lucide-react'
import { toast } from 'sonner'
import { JORDAN_BANKS } from '@/lib/paytabs-marketplace'

interface PayTabsVendorSettingsProps {
  restaurantId: string
  restaurantName: string
}

export function PayTabsVendorSettings({ 
  restaurantId,
  restaurantName 
}: PayTabsVendorSettingsProps) {
  const [loading, setLoading] = useState(false)
  const [vendorData, setVendorData] = useState({
    vendorId: '',
    status: 'pending',
    balance: {
      available: 0,
      pending: 0,
      currency: 'JOD'
    },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      iban: '',
      swiftCode: ''
    },
    settlementSchedule: 'daily',
    lastPayout: null as Date | null,
    nextPayout: null as Date | null
  })

  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    fetchVendorData()
  }, [restaurantId])

  const fetchVendorData = async () => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/paytabs-vendor`)
      if (response.ok) {
        const data = await response.json()
        setVendorData(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Vendor-Daten:', error)
    }
  }

  const createVendorAccount = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/paytabs-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          ...vendorData.bankDetails
        })
      })

      if (response.ok) {
        const data = await response.json()
        setVendorData({ ...vendorData, vendorId: data.vendorId, status: 'active' })
        toast.success('Bankdaten erfolgreich gespeichert!')
      } else {
        throw new Error('Fehler beim Erstellen')
      }
    } catch (error) {
      toast.error('Fehler beim Erstellen des Vendor-Kontos')
    } finally {
      setLoading(false)
    }
  }

  const updateBankDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/paytabs-vendor`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData.bankDetails)
      })

      if (response.ok) {
        toast.success('Bankdaten aktualisiert')
        setIsEditing(false)
      } else {
        throw new Error('Fehler beim Aktualisieren')
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Bankdaten')
    } finally {
      setLoading(false)
    }
  }

  const requestPayout = async () => {
    if (vendorData.balance.available <= 0) {
      toast.error('Kein verfügbares Guthaben für Auszahlung')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/paytabs-vendor/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('Auszahlung wurde initiiert')
        fetchVendorData() // Refresh balance
      } else {
        throw new Error('Fehler bei Auszahlung')
      }
    } catch (error) {
      toast.error('Fehler bei der Auszahlungsanfrage')
    } finally {
      setLoading(false)
    }
  }

  if (!vendorData.vendorId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            PayTabs Auszahlungen (Naher Osten)
          </CardTitle>
          <CardDescription>
            Bankdaten für automatische Auszahlungen von PayTabs-Zahlungen (Kreditkarte, lokale Zahlungsmethoden)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Bitte hinterlegen Sie Ihre Bankdaten für automatische PayTabs-Auszahlungen.
              Diese werden für Zahlungen aus dem Nahen Osten (Jordanien, Saudi-Arabien, VAE) verwendet.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bank">Bank auswählen</Label>
              <select
                id="bank"
                className="w-full px-3 py-2 border rounded-md"
                value={vendorData.bankDetails.bankName}
                onChange={(e) => {
                  const bank = JORDAN_BANKS.find(b => b.name === e.target.value)
                  setVendorData({
                    ...vendorData,
                    bankDetails: {
                      ...vendorData.bankDetails,
                      bankName: e.target.value,
                      swiftCode: bank?.swiftCode || ''
                    }
                  })
                }}
              >
                <option value="">Bank wählen...</option>
                {JORDAN_BANKS.map(bank => (
                  <option key={bank.code} value={bank.name}>
                    {bank.name}
                  </option>
                ))}
                <option value="other">Andere Bank...</option>
              </select>
            </div>
            
            {/* Zeige manuelle Eingabe nur wenn "Andere Bank" gewählt wurde */}
            {vendorData.bankDetails.bankName === 'other' && (
              <>
                <div>
                  <Label htmlFor="customBankName">Bank Name</Label>
                  <Input
                    id="customBankName"
                    placeholder="Name Ihrer Bank"
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      bankDetails: {
                        ...vendorData.bankDetails,
                        bankName: e.target.value
                      }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="swiftCode">SWIFT/BIC Code</Label>
                  <Input
                    id="swiftCode"
                    placeholder="z.B. ARABJOAX"
                    value={vendorData.bankDetails.swiftCode}
                    onChange={(e) => setVendorData({
                      ...vendorData,
                      bankDetails: {
                        ...vendorData.bankDetails,
                        swiftCode: e.target.value
                      }
                    })}
                  />
                </div>
              </>
            )}

            <div>
              <Label htmlFor="iban">IBAN</Label>
              <Input
                id="iban"
                placeholder="z.B. DE89 3704 0044 0532 0130 00 oder JO94 CBJO 0010 0000 0000 0131 0003 02"
                value={vendorData.bankDetails.iban}
                onChange={(e) => setVendorData({
                  ...vendorData,
                  bankDetails: {
                    ...vendorData.bankDetails,
                    iban: e.target.value
                  }
                })}
              />
            </div>

            <div>
              <Label htmlFor="accountNumber">Kontonummer</Label>
              <Input
                id="accountNumber"
                placeholder="Ihre Kontonummer"
                value={vendorData.bankDetails.accountNumber}
                onChange={(e) => setVendorData({
                  ...vendorData,
                  bankDetails: {
                    ...vendorData.bankDetails,
                    accountNumber: e.target.value
                  }
                })}
              />
            </div>

            <div>
              <Label htmlFor="schedule">Auszahlungsplan</Label>
              <select
                id="schedule"
                className="w-full px-3 py-2 border rounded-md"
                value={vendorData.settlementSchedule}
                onChange={(e) => setVendorData({
                  ...vendorData,
                  settlementSchedule: e.target.value
                })}
              >
                <option value="daily">Täglich</option>
                <option value="weekly">Wöchentlich</option>
                <option value="monthly">Monatlich</option>
                <option value="manual">Manuell</option>
              </select>
            </div>

            <Button 
              onClick={createVendorAccount}
              disabled={loading || !vendorData.bankDetails.bankName || !vendorData.bankDetails.iban}
              className="w-full"
            >
              <Building2 className="h-4 w-4 mr-2" />
              Bankdaten speichern
            </Button>
          </div>
          
          {/* Info Box */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">PayTabs Auszahlungsplan:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Tägliche/Wöchentliche Auszahlungen</li>
              <li>• Bearbeitungszeit: 1-2 Werktage</li>
              <li>• Unterstützte Währungen: JOD, SAR, AED</li>
              <li>• Gebühr: 2.5% Plattformgebühr</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Guthaben-Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Verfügbares Guthaben
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vendorData.balance.available.toFixed(2)} {vendorData.balance.currency}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Bereit für Auszahlung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Ausstehende Zahlungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {vendorData.balance.pending.toFixed(2)} {vendorData.balance.currency}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In Bearbeitung
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Nächste Auszahlung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">
                {vendorData.nextPayout 
                  ? new Date(vendorData.nextPayout).toLocaleDateString('de-DE')
                  : vendorData.settlementSchedule === 'manual' ? 'Manuell' : 'Geplant'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {vendorData.settlementSchedule === 'daily' && 'Täglich um 00:00 Uhr'}
              {vendorData.settlementSchedule === 'weekly' && 'Jeden Montag'}
              {vendorData.settlementSchedule === 'monthly' && 'Am 1. des Monats'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bankdaten */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bankverbindung</CardTitle>
              <CardDescription>
                Ihre hinterlegten Bankdaten für Auszahlungen
              </CardDescription>
            </div>
            <Badge variant={vendorData.status === 'active' ? 'default' : 'secondary'}>
              {vendorData.status === 'active' ? 'Aktiv' : 'Ausstehend'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Bank:</span>
                <span className="font-medium">{vendorData.bankDetails.bankName}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">IBAN:</span>
                <span className="font-medium font-mono">{vendorData.bankDetails.iban}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">Kontonummer:</span>
                <span className="font-medium">{vendorData.bankDetails.accountNumber}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">SWIFT:</span>
                <span className="font-medium">{vendorData.bankDetails.swiftCode}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Auszahlungsplan:</span>
                <span className="font-medium">
                  {vendorData.settlementSchedule === 'daily' && 'Täglich'}
                  {vendorData.settlementSchedule === 'weekly' && 'Wöchentlich'}
                  {vendorData.settlementSchedule === 'monthly' && 'Monatlich'}
                  {vendorData.settlementSchedule === 'manual' && 'Manuell'}
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  Bankdaten ändern
                </Button>
                {vendorData.settlementSchedule === 'manual' && (
                  <Button
                    onClick={requestPayout}
                    disabled={loading || vendorData.balance.available <= 0}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Auszahlung anfordern
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bearbeitungsformular wie oben */}
              <div className="flex gap-2">
                <Button onClick={updateBankDetails} disabled={loading}>
                  Speichern
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gebührenübersicht */}
      <Card>
        <CardHeader>
          <CardTitle>Gebührenstruktur</CardTitle>
          <CardDescription>
            Transparente Preisgestaltung für Ihre Transaktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Ihre Auszahlung (97.5%)</span>
              </div>
              <span className="font-semibold text-green-600">97.5%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>Oriido Plattformgebühr</span>
              </div>
              <span className="font-semibold text-blue-600">2.5%</span>
            </div>
            <Alert>
              <AlertDescription className="text-sm">
                <strong>Beispiel:</strong> Bei einer Bestellung von 100 JOD erhalten Sie 97.50 JOD direkt auf Ihr Bankkonto.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}