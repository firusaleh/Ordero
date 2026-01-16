'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { Loader2, Save, Calculator, Percent, DollarSign } from 'lucide-react'

interface FeesSettingsClientProps {
  restaurant: any
  settings: any
}

export default function FeesSettingsClient({ restaurant, settings }: FeesSettingsClientProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [serviceFeeEnabled, setServiceFeeEnabled] = useState(settings?.serviceFeeEnabled || false)
  const [serviceFeeType, setServiceFeeType] = useState(settings?.serviceFeeType || 'PERCENT')
  const [serviceFeePercent, setServiceFeePercent] = useState(settings?.serviceFeePercent || 10)
  const [serviceFeeAmount, setServiceFeeAmount] = useState(settings?.serviceFeeAmount || 0)
  const [taxRate, setTaxRate] = useState(settings?.taxRate || 19)
  const [includeTax, setIncludeTax] = useState(settings?.includeTax ?? true)
  
  const currency = settings?.currency || 'EUR'
  const currencySymbol = currency === 'JOD' ? 'JD' : 
                        currency === 'USD' ? '$' : 
                        currency === 'AED' ? 'AED' : '€'
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'settings',
          serviceFeeEnabled,
          serviceFeeType,
          serviceFeePercent,
          serviceFeeAmount,
          taxRate,
          includeTax
        }),
      })
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }
      
      toast.success('Gebühreneinstellungen gespeichert')
      router.refresh()
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setSaving(false)
    }
  }
  
  // Calculate example amounts
  const exampleSubtotal = 50
  const exampleServiceFee = serviceFeeEnabled ? 
    (serviceFeeType === 'PERCENT' ? (exampleSubtotal * serviceFeePercent / 100) : serviceFeeAmount) : 0
  const exampleTax = includeTax ? 
    (exampleSubtotal - (exampleSubtotal / (1 + taxRate / 100))) :
    (exampleSubtotal * (taxRate / 100))
  const exampleTotal = exampleSubtotal + (includeTax ? 0 : exampleTax) + exampleServiceFee
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gebühren & Steuern</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Service-Gebühren und Steuereinstellungen
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>

      {/* Service Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Service-Gebühr
          </CardTitle>
          <CardDescription>
            Fügen Sie eine Service-Gebühr zu allen Bestellungen hinzu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="service-fee-enabled">Service-Gebühr aktivieren</Label>
              <p className="text-sm text-muted-foreground">
                Eine zusätzliche Gebühr wird zu jeder Bestellung hinzugefügt
              </p>
            </div>
            <Switch
              id="service-fee-enabled"
              checked={serviceFeeEnabled}
              onCheckedChange={setServiceFeeEnabled}
            />
          </div>
          
          {serviceFeeEnabled && (
            <>
              <div className="space-y-4">
                <Label>Gebührentyp</Label>
                <RadioGroup value={serviceFeeType} onValueChange={setServiceFeeType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PERCENT" id="percent" />
                    <Label htmlFor="percent" className="flex items-center gap-2 cursor-pointer">
                      <Percent className="h-4 w-4" />
                      Prozentual vom Zwischensumme
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXED" id="fixed" />
                    <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4" />
                      Fester Betrag
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {serviceFeeType === 'PERCENT' ? (
                <div className="space-y-2">
                  <Label htmlFor="service-fee-percent">Service-Gebühr (%)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="service-fee-percent"
                      type="number"
                      min="0"
                      max="50"
                      step="0.5"
                      value={serviceFeePercent}
                      onChange={(e) => setServiceFeePercent(parseFloat(e.target.value) || 0)}
                      className="max-w-[120px]"
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bei {currencySymbol}{exampleSubtotal.toFixed(2)} = {currencySymbol}{(exampleSubtotal * serviceFeePercent / 100).toFixed(2)} Service-Gebühr
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="service-fee-amount">Service-Gebühr (Betrag)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="service-fee-amount"
                      type="number"
                      min="0"
                      step="0.50"
                      value={serviceFeeAmount}
                      onChange={(e) => setServiceFeeAmount(parseFloat(e.target.value) || 0)}
                      className="max-w-[120px]"
                    />
                    <span className="text-muted-foreground">{currencySymbol}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Feste Gebühr von {currencySymbol}{serviceFeeAmount.toFixed(2)} pro Bestellung
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Tax Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Steuereinstellungen
          </CardTitle>
          <CardDescription>
            Konfigurieren Sie die Mehrwertsteuer für Ihre Preise
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tax-rate">Steuersatz (%)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="tax-rate"
                type="number"
                min="0"
                max="30"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="max-w-[120px]"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="include-tax">Preise inkl. MwSt.</Label>
              <p className="text-sm text-muted-foreground">
                {includeTax ? 'Menüpreise enthalten bereits die MwSt.' : 'MwSt. wird zu den Menüpreisen hinzugefügt'}
              </p>
            </div>
            <Switch
              id="include-tax"
              checked={includeTax}
              onCheckedChange={setIncludeTax}
            />
          </div>
        </CardContent>
      </Card>

      {/* Example Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Beispielrechnung</CardTitle>
          <CardDescription>
            So sieht eine Bestellung mit Ihren aktuellen Einstellungen aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span>Zwischensumme</span>
              <span>{currencySymbol}{exampleSubtotal.toFixed(2)}</span>
            </div>
            {serviceFeeEnabled && (
              <div className="flex justify-between text-sm">
                <span>Service-Gebühr ({serviceFeeType === 'PERCENT' ? `${serviceFeePercent}%` : 'Fest'})</span>
                <span>+{currencySymbol}{exampleServiceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>MwSt. ({taxRate}% {includeTax ? 'inkl.' : 'zzgl.'})</span>
              <span>{includeTax ? `(${currencySymbol}${exampleTax.toFixed(2)})` : `+${currencySymbol}${exampleTax.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Gesamt</span>
              <span>{currencySymbol}{exampleTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}