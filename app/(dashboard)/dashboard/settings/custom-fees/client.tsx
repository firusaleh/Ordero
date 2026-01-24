'use client'

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { 
  Loader2, 
  Save, 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  Percent, 
  GripVertical,
  AlertCircle,
  X
} from 'lucide-react'

interface CustomFee {
  id?: string
  name: string
  description?: string
  type: 'PERCENT' | 'FIXED'
  value: number
  enabled: boolean
  sortOrder: number
  minOrderAmount?: number
  maxOrderAmount?: number
  applyToDelivery: boolean
  applyToDineIn: boolean
  applyToTakeaway: boolean
}

interface CustomFeesClientProps {
  restaurant: any
  settings: any
}

export default function CustomFeesClient({ restaurant, settings }: CustomFeesClientProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fees, setFees] = useState<CustomFee[]>(settings?.customFees || [])
  const [showFeeDialog, setShowFeeDialog] = useState(false)
  const [editingFee, setEditingFee] = useState<CustomFee | null>(null)
  
  const currency = settings?.currency || 'EUR'
  const currencySymbol = currency === 'JOD' ? 'JD' : 
                        currency === 'USD' ? '$' : 
                        currency === 'AED' ? 'AED' : '€'
  
  const [feeForm, setFeeForm] = useState<CustomFee>({
    name: '',
    description: '',
    type: 'PERCENT',
    value: 0,
    enabled: true,
    sortOrder: 0,
    applyToDelivery: true,
    applyToDineIn: true,
    applyToTakeaway: true
  })
  
  const handleAddFee = () => {
    setEditingFee(null)
    setFeeForm({
      name: '',
      description: '',
      type: 'PERCENT',
      value: 0,
      enabled: true,
      sortOrder: fees.length,
      applyToDelivery: true,
      applyToDineIn: true,
      applyToTakeaway: true
    })
    setShowFeeDialog(true)
  }
  
  const handleEditFee = (fee: CustomFee) => {
    setEditingFee(fee)
    setFeeForm(fee)
    setShowFeeDialog(true)
  }
  
  const handleSaveFee = () => {
    if (!feeForm.name) {
      toast.error(t('customFees.pleaseEnterName'))
      return
    }
    
    if (editingFee) {
      // Update existing fee
      setFees(fees.map(f => f.id === editingFee.id ? { ...feeForm, id: editingFee.id } : f))
    } else {
      // Add new fee
      setFees([...fees, { ...feeForm, id: `temp-${Date.now()}` }])
    }
    
    setShowFeeDialog(false)
    toast.success(editingFee ? t('customFees.feeUpdated') : t('customFees.feeAdded'))
  }
  
  const handleDeleteFee = (id: string | undefined) => {
    if (!id) return
    setFees(fees.filter(f => f.id !== id))
    toast.success(t('customFees.feeDeleted'))
  }
  
  const handleToggleFee = (id: string | undefined) => {
    if (!id) return
    setFees(fees.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f))
  }
  
  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/dashboard/custom-fees', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settingsId: settings.id,
          fees
        }),
      })
      
      if (!response.ok) {
        throw new Error(t('customFees.errorSaving'))
      }
      
      toast.success(t('customFees.feesSaved'))
      router.refresh()
    } catch (error) {
      toast.error(t('customFees.errorSavingFees'))
    } finally {
      setSaving(false)
    }
  }
  
  // Calculate example with all fees
  const exampleSubtotal = 50
  const calculateFeeAmount = (fee: CustomFee, subtotal: number) => {
    if (!fee.enabled) return 0
    if (fee.minOrderAmount && subtotal < fee.minOrderAmount) return 0
    if (fee.maxOrderAmount && subtotal > fee.maxOrderAmount) return 0
    
    return fee.type === 'PERCENT' ? (subtotal * fee.value / 100) : fee.value
  }
  
  const totalFees = fees.reduce((sum, fee) => sum + calculateFeeAmount(fee, exampleSubtotal), 0)
  const exampleTax = settings?.includeTax ? 
    (exampleSubtotal - (exampleSubtotal / (1 + (settings?.taxRate || 19) / 100))) :
    (exampleSubtotal * ((settings?.taxRate || 19) / 100))
  const exampleTotal = exampleSubtotal + (settings?.includeTax ? 0 : exampleTax) + totalFees
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('customFees.title')}</h1>
          <p className="text-muted-foreground">
            {t('customFees.description')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleAddFee}>
            <Plus className="mr-2 h-4 w-4" />
            {t('customFees.addFee')}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {t('customFees.save')}
          </Button>
        </div>
      </div>

      {/* Fees List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('customFees.activeFees')}</CardTitle>
          <CardDescription>
            {t('customFees.activeFeesDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fees.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium mb-1">{t('customFees.noFees')}</p>
              <p className="text-sm">{t('customFees.noFeesDesc')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => (
                <div 
                  key={fee.id} 
                  className={`border rounded-lg p-4 transition-opacity ${!fee.enabled ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <GripVertical className="h-5 w-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{fee.name}</h3>
                          {fee.type === 'PERCENT' ? (
                            <Badge variant="outline">
                              <Percent className="h-3 w-3 mr-1" />
                              {fee.value}%
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <DollarSign className="h-3 w-3 mr-1" />
                              {currencySymbol}{fee.value.toFixed(2)}
                            </Badge>
                          )}
                        </div>
                        {fee.description && (
                          <p className="text-sm text-muted-foreground mt-1">{fee.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {fee.minOrderAmount && (
                            <span>Min: {currencySymbol}{fee.minOrderAmount}</span>
                          )}
                          {fee.maxOrderAmount && (
                            <span>Max: {currencySymbol}{fee.maxOrderAmount}</span>
                          )}
                          <div className="flex items-center gap-2">
                            {fee.applyToDineIn && <span className="text-green-600">Vor Ort</span>}
                            {fee.applyToTakeaway && <span className="text-blue-600">Abholung</span>}
                            {fee.applyToDelivery && <span className="text-purple-600">Lieferung</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={fee.enabled}
                        onCheckedChange={() => handleToggleFee(fee.id)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditFee(fee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFee(fee.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Example Calculation */}
      <Card>
        <CardHeader>
          <CardTitle>Beispielrechnung</CardTitle>
          <CardDescription>
            So sieht eine Bestellung mit {fees.filter(f => f.enabled).length} aktiven Gebühren aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 p-4 bg-muted rounded-lg">
            <div className="flex justify-between">
              <span>Zwischensumme</span>
              <span>{currencySymbol}{exampleSubtotal.toFixed(2)}</span>
            </div>
            {fees.filter(f => f.enabled).map(fee => {
              const amount = calculateFeeAmount(fee, exampleSubtotal)
              if (amount === 0) return null
              return (
                <div key={fee.id} className="flex justify-between text-sm">
                  <span>
                    {fee.name} 
                    {fee.type === 'PERCENT' && ` (${fee.value}%)`}
                  </span>
                  <span>+{currencySymbol}{amount.toFixed(2)}</span>
                </div>
              )
            })}
            <div className="flex justify-between text-sm">
              <span>MwSt. ({settings?.taxRate || 19}% {settings?.includeTax ? 'inkl.' : 'zzgl.'})</span>
              <span>
                {settings?.includeTax ? `(${currencySymbol}${exampleTax.toFixed(2)})` : `+${currencySymbol}${exampleTax.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Gesamt</span>
              <span>{currencySymbol}{exampleTotal.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fee Dialog */}
      <Dialog open={showFeeDialog} onOpenChange={setShowFeeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingFee ? t('customFees.editFee') : t('customFees.addNewFee')}
            </DialogTitle>
            <DialogDescription>
              {t('customFees.defineFee')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee-name">{t('customFees.feeName')} *</Label>
                <Input
                  id="fee-name"
                  value={feeForm.name}
                  onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                  placeholder={t('customFees.feeNamePlaceholder')}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t('customFees.feeType')}</Label>
                <RadioGroup 
                  value={feeForm.type} 
                  onValueChange={(value: 'PERCENT' | 'FIXED') => setFeeForm({ ...feeForm, type: value })}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PERCENT" id="percent" />
                    <Label htmlFor="percent" className="flex items-center gap-1">
                      <Percent className="h-4 w-4" />
                      {t('customFees.percentage')}
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXED" id="fixed" />
                    <Label htmlFor="fixed" className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {t('customFees.fixedAmount')}
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fee-value">
                  {feeForm.type === 'PERCENT' ? t('customFees.percentageValue') : t('customFees.amount')} *
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="fee-value"
                    type="number"
                    min="0"
                    step={feeForm.type === 'PERCENT' ? "0.5" : "0.10"}
                    value={feeForm.value}
                    onChange={(e) => setFeeForm({ ...feeForm, value: parseFloat(e.target.value) || 0 })}
                  />
                  <span className="text-muted-foreground">
                    {feeForm.type === 'PERCENT' ? '%' : currencySymbol}
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fee-description">{t('customFees.descriptionOptional')}</Label>
                <Input
                  id="fee-description"
                  value={feeForm.description || ''}
                  onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                  placeholder={t('customFees.shortDescription')}
                />
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <Label>{t('customFees.orderTypes')}</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dine-in"
                    checked={feeForm.applyToDineIn}
                    onCheckedChange={(checked) => setFeeForm({ ...feeForm, applyToDineIn: checked })}
                  />
                  <Label htmlFor="dine-in">{t('customFees.dineIn')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="takeaway"
                    checked={feeForm.applyToTakeaway}
                    onCheckedChange={(checked) => setFeeForm({ ...feeForm, applyToTakeaway: checked })}
                  />
                  <Label htmlFor="takeaway">{t('customFees.takeaway')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="delivery"
                    checked={feeForm.applyToDelivery}
                    onCheckedChange={(checked) => setFeeForm({ ...feeForm, applyToDelivery: checked })}
                  />
                  <Label htmlFor="delivery">{t('customFees.delivery')}</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-4 pt-4 border-t">
              <Label>{t('customFees.conditions')}</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-amount">{t('customFees.minimumOrderValue')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="min-amount"
                      type="number"
                      min="0"
                      step="1"
                      value={feeForm.minOrderAmount || ''}
                      onChange={(e) => setFeeForm({ 
                        ...feeForm, 
                        minOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder="0.00"
                    />
                    <span className="text-muted-foreground">{currencySymbol}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max-amount">{t('customFees.maximumOrderValue')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="max-amount"
                      type="number"
                      min="0"
                      step="1"
                      value={feeForm.maxOrderAmount || ''}
                      onChange={(e) => setFeeForm({ 
                        ...feeForm, 
                        maxOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined 
                      })}
                      placeholder={t('customFees.unlimited')}
                    />
                    <span className="text-muted-foreground">{currencySymbol}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFeeDialog(false)}>
              {t('customFees.cancel')}
            </Button>
            <Button onClick={handleSaveFee}>
              {editingFee ? t('customFees.update') : t('customFees.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}