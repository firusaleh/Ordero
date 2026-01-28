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
import { useLanguage } from '@/contexts/language-context'
import { translations } from '@/lib/i18n/translations'
import { Loader2, Save, Calculator, Percent, DollarSign } from 'lucide-react'

interface FeesSettingsClientProps {
  restaurant: any
  settings: any
}

export default function FeesSettingsClient({ restaurant, settings }: FeesSettingsClientProps) {
  const { language, setLanguage } = useLanguage()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  // Use translations directly since t() seems to have issues
  const getTranslation = (path: string): string => {
    const keys = path.split('.')
    let value: any = translations[language]
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Fallback to German
        value = translations.de
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k]
          } else {
            return path
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : path
  }
  
  const t = getTranslation
  
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
        throw new Error(t('common.errorSaving'))
      }
      
      toast.success(t('settings.fees.feesSaved'))
      router.refresh()
    } catch (error) {
      toast.error(t('common.errorSaving'))
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
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.fees.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.fees.description')}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>

      {/* Service Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {t('settings.fees.serviceFeeSettings')}
          </CardTitle>
          <CardDescription>
            {t('settings.fees.serviceFeeDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="service-fee-enabled">{t('settings.fees.enableServiceFee')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('settings.fees.serviceFeeNote')}
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
                <Label>{t('settings.fees.feeType')}</Label>
                <RadioGroup value={serviceFeeType} onValueChange={setServiceFeeType}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PERCENT" id="percent" />
                    <Label htmlFor="percent" className="flex items-center gap-2 cursor-pointer">
                      <Percent className="h-4 w-4" />
                      {t('settings.fees.percentOfSubtotal')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXED" id="fixed" />
                    <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                      <DollarSign className="h-4 w-4" />
                      {t('settings.fees.fixedAmountFee')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {serviceFeeType === 'PERCENT' ? (
                <div className="space-y-2">
                  <Label htmlFor="service-fee-percent">{t('settings.fees.serviceFeePercent')}</Label>
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
                    {t('settings.fees.atAmount')} {currencySymbol}{exampleSubtotal.toFixed(2)} {t('settings.fees.equals')} {currencySymbol}{(exampleSubtotal * serviceFeePercent / 100).toFixed(2)} {t('settings.fees.serviceFeeLabel')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="service-fee-amount">{t('settings.fees.serviceFeeAmount')}</Label>
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
                    {t('settings.fees.fixedFeeOf')} {currencySymbol}{serviceFeeAmount.toFixed(2)} {t('settings.fees.perOrder')}
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
            {t('settings.fees.taxSettings')}
          </CardTitle>
          <CardDescription>
            {t('settings.fees.taxSettingsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tax-rate">{t('settings.fees.vatRate')}</Label>
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
              <Label htmlFor="include-tax">{t('settings.fees.pricesIncludeTax')}</Label>
              <p className="text-sm text-muted-foreground">
                {includeTax ? t('settings.fees.taxIncludedNote') : t('settings.fees.taxExcludedNote')}
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
          <CardTitle>{t('settings.fees.exampleCalculation')}</CardTitle>
          <CardDescription>
            {t('settings.fees.exampleDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span>{t('settings.fees.subtotal')}</span>
              <span>{currencySymbol}{exampleSubtotal.toFixed(2)}</span>
            </div>
            {serviceFeeEnabled && (
              <div className="flex justify-between text-sm">
                <span>{t('settings.fees.serviceFeeLabel')} ({serviceFeeType === 'PERCENT' ? `${serviceFeePercent}%` : t('settings.fees.fixed')})</span>
                <span>+{currencySymbol}{exampleServiceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>{t('settings.fees.vatLabel')} ({taxRate}% {includeTax ? t('settings.fees.included') : t('settings.fees.additional')})</span>
              <span>{includeTax ? `(${currencySymbol}${exampleTax.toFixed(2)})` : `+${currencySymbol}${exampleTax.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>{t('settings.fees.total')}</span>
              <span>{currencySymbol}{exampleTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}