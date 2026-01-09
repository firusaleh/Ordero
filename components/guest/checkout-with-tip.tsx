'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Coins, CreditCard, Banknote, Heart } from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface CheckoutWithTipProps {
  subtotal: number
  tax: number
  onConfirm: (tipPercent: number, tipAmount: number, paymentMethod: string) => void
  isProcessing: boolean
}

export default function CheckoutWithTip({ 
  subtotal, 
  tax, 
  onConfirm, 
  isProcessing 
}: CheckoutWithTipProps) {
  const { t } = useGuestLanguage()
  const [tipPercent, setTipPercent] = useState<number>(10)
  const [customTip, setCustomTip] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('CARD')

  const baseAmount = subtotal + tax
  
  // Calculate tip amount
  const getTipAmount = (): number => {
    if (tipPercent === -1 && customTip) {
      return parseFloat(customTip) || 0
    }
    return baseAmount * (tipPercent / 100)
  }

  const tipAmount = getTipAmount()
  const total = baseAmount + tipAmount

  const tipOptions = [
    { value: 0, label: t('checkout.noTip') || 'Kein Trinkgeld', icon: '😐' },
    { value: 5, label: '5%', icon: '🙂' },
    { value: 10, label: '10%', icon: '😊' },
    { value: 15, label: '15%', icon: '😃' },
    { value: 20, label: '20%', icon: '😍' },
  ]

  const paymentMethods = [
    { 
      value: 'CASH', 
      label: t('guest.cash') || 'Bar',
      icon: Banknote,
      description: t('checkout.payAtCounter') || 'Bezahlen Sie an der Kasse'
    },
    { 
      value: 'CARD', 
      label: t('guest.card') || 'Karte',
      icon: CreditCard,
      description: t('checkout.payWithCard') || 'Kredit- oder Debitkarte'
    }
  ]

  const handleConfirm = () => {
    onConfirm(tipPercent === -1 ? 0 : tipPercent, tipAmount, paymentMethod)
  }

  return (
    <div className="space-y-4">
      {/* Trinkgeld-Auswahl */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            {t('checkout.addTip') || 'Trinkgeld hinzufügen'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {tipOptions.map((option) => (
              <Button
                key={option.value}
                variant={tipPercent === option.value ? 'default' : 'outline'}
                onClick={() => {
                  setTipPercent(option.value)
                  setCustomTip('')
                }}
                className="flex flex-col h-auto py-3"
              >
                <span className="text-xl mb-1">{option.icon}</span>
                <span className="text-sm font-medium">{option.label}</span>
                {option.value > 0 && (
                  <span className="text-xs text-gray-600">
                    €{(baseAmount * (option.value / 100)).toFixed(2)}
                  </span>
                )}
              </Button>
            ))}
          </div>
          
          {/* Custom Tip */}
          <div className="mt-4 flex items-center gap-2">
            <Button
              variant={tipPercent === -1 ? 'default' : 'outline'}
              onClick={() => setTipPercent(-1)}
              size="sm"
            >
              {t('checkout.customAmount') || 'Eigener Betrag'}
            </Button>
            {tipPercent === -1 && (
              <div className="flex items-center gap-1">
                <span>€</span>
                <input
                  type="number"
                  value={customTip}
                  onChange={(e) => setCustomTip(e.target.value)}
                  className="w-20 px-2 py-1 border rounded"
                  placeholder="0.00"
                  min="0"
                  step="0.50"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zahlungsmethode */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.paymentMethod') || 'Zahlungsmethode'}</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            {paymentMethods.map((method) => {
              const Icon = method.icon
              return (
                <div
                  key={method.value}
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setPaymentMethod(method.value)}
                >
                  <RadioGroupItem value={method.value} id={method.value} />
                  <Label 
                    htmlFor={method.value} 
                    className="flex-1 cursor-pointer flex items-center gap-3"
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">{method.label}</div>
                      <div className="text-sm text-gray-600">{method.description}</div>
                    </div>
                  </Label>
                </div>
              )
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Zusammenfassung */}
      <Card>
        <CardHeader>
          <CardTitle>{t('checkout.orderSummary') || 'Zusammenfassung'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{t('common.subtotal') || 'Zwischensumme'}</span>
            <span>€{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>{t('checkout.taxes') || 'MwSt (19%)'}</span>
            <span>€{tax.toFixed(2)}</span>
          </div>
          {tipAmount > 0 && (
            <div className="flex justify-between text-sm font-medium text-green-600">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {t('checkout.tip') || 'Trinkgeld'}
                {tipPercent > 0 && ` (${tipPercent}%)`}
              </span>
              <span>€{tipAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-bold text-lg">
            <span>{t('common.total') || 'Gesamt'}</span>
            <span>€{total.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Bestellen Button */}
      <Button
        onClick={handleConfirm}
        disabled={isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <span className="flex items-center gap-2">
            <Coins className="h-5 w-5 animate-spin" />
            {t('checkout.processing') || 'Verarbeitung...'}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {paymentMethod === 'CARD' ? (
              <>
                <CreditCard className="h-5 w-5" />
                {t('checkout.payNow') || 'Jetzt bezahlen'} (€{total.toFixed(2)})
              </>
            ) : (
              <>
                <Banknote className="h-5 w-5" />
                {t('checkout.placeOrder') || 'Bestellung aufgeben'} (€{total.toFixed(2)})
              </>
            )}
          </span>
        )}
      </Button>

      {/* Info Text */}
      <p className="text-xs text-center text-gray-600">
        {paymentMethod === 'CARD' 
          ? t('checkout.securePayment') || 'Sichere Zahlung über Stripe'
          : t('checkout.payAtRestaurant') || 'Bezahlung erfolgt im Restaurant'
        }
      </p>
    </div>
  )
}