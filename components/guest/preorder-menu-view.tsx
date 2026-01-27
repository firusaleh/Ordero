'use client'

import { useState, useEffect } from 'react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import GuestMenuViewSimple from './guest-menu-view-simple'
import IntegratedCheckout from './integrated-checkout'
import { Calendar, Clock, User, Phone, Mail, MessageSquare, Package, Store } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { format } from 'date-fns'
import { de, enUS, ar } from 'date-fns/locale'

interface PreOrderMenuViewProps {
  restaurant: any
}

export default function PreOrderMenuView({ restaurant }: PreOrderMenuViewProps) {
  const { t, language } = useGuestLanguage()
  const [cart, setCart] = useState<any[]>([])
  const [showPreOrderDialog, setShowPreOrderDialog] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isProcessingCash, setIsProcessingCash] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CARD')
  const [selectedTipOption, setSelectedTipOption] = useState('0')
  const [currentTipAmount, setCurrentTipAmount] = useState(0)
  
  // Vorbestellungs-Formular
  const [preOrderData, setPreOrderData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupDate: '',
    pickupTime: '',
    notes: '',
    orderType: 'PICKUP' as 'PICKUP' | 'DINE_IN'
  })

  // Minimum Zeit für Vorbestellung (z.B. 2 Stunden von jetzt)
  const getMinDateTime = () => {
    const now = new Date()
    now.setHours(now.getHours() + 2)
    return now
  }

  // Format Datum für Input
  const getMinDate = () => {
    return format(getMinDateTime(), 'yyyy-MM-dd')
  }

  const getMinTime = () => {
    const now = getMinDateTime()
    return format(now, 'HH:mm')
  }

  const getLocale = () => {
    switch (language) {
      case 'de': return de
      case 'ar': return ar
      default: return enUS
    }
  }

  const handleCartUpdate = (newCart: any[]) => {
    setCart(newCart)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error(t('guest.cart.empty'))
      return
    }
    setShowPreOrderDialog(true)
  }

  const validateForm = () => {
    if (!preOrderData.name.trim()) {
      toast.error(t('preorderValidation.nameRequired') || (language === 'de' ? 'Bitte geben Sie Ihren Namen ein' : 'Please enter your name'))
      return false
    }
    if (!preOrderData.phone.trim()) {
      toast.error(t('preorderValidation.phoneRequired') || (language === 'de' ? 'Bitte geben Sie Ihre Telefonnummer ein' : 'Please enter your phone number'))
      return false
    }
    if (!preOrderData.pickupDate) {
      toast.error(t('preorderValidation.dateRequired') || (language === 'de' ? 'Bitte wählen Sie ein Abholdatum' : 'Please select a pickup date'))
      return false
    }
    if (!preOrderData.pickupTime) {
      toast.error(t('preorderValidation.timeRequired') || (language === 'de' ? 'Bitte wählen Sie eine Abholzeit' : 'Please select a pickup time'))
      return false
    }
    return true
  }

  const handleProceedToPayment = () => {
    if (!validateForm()) return
    
    // Speichere Preorder-Daten für späteren Zugriff
    sessionStorage.setItem('preorderData', JSON.stringify({
      ...preOrderData,
      pickupDateTime: `${preOrderData.pickupDate}T${preOrderData.pickupTime}:00`
    }))
    
    setShowPreOrderDialog(false)
    setShowCheckout(true)
  }

  const handleCashOrder = async () => {
    if (cart.length === 0) return
    
    setIsProcessingCash(true)
    
    try {
      const preOrderInfo = JSON.parse(sessionStorage.getItem('preorderData') || '{}')
      const subtotal = calculateTotal()
      
      const orderData = {
        restaurantId: restaurant.id,
        type: preOrderInfo.orderType || 'PICKUP',
        items: cart.map((item: any) => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          variant: item.variant?.name,
          variantPrice: item.variant?.price,
          extras: item.extras?.map((e: any) => ({
            name: e.name,
            price: e.price
          })) || [],
          notes: item.notes
        })),
        tipAmount: currentTipAmount,
        paymentMethod: 'CASH',
        customerName: preOrderInfo.name,
        customerPhone: preOrderInfo.phone,
        customerEmail: preOrderInfo.email,
        pickupDateTime: preOrderInfo.pickupDateTime,
        notes: preOrderInfo.notes
      }
      
      const response = await fetch(`/api/public/${restaurant.slug}/preorders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      
      if (!response.ok) throw new Error('Failed to create preorder')
      
      const { orderId, orderNumber } = await response.json()
      handlePaymentSuccess(orderId, orderNumber)
      
    } catch (error) {
      console.error('Error creating preorder:', error)
      toast.error(t('preorder.createError') || 'Fehler beim Erstellen der Vorbestellung')
    } finally {
      setIsProcessingCash(false)
    }
  }

  const handlePaymentSuccess = (pendingPaymentId: string, orderNumber: string) => {
    // Speichere Vorbestellungs-ID
    const sessionKey = `preorders-${restaurant.slug}`
    const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
    storedOrderIds.push(pendingPaymentId)
    localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))
    
    // Zeige Erfolg
    toast.success(
      language === 'de' 
        ? `Vorbestellung erfolgreich! Bestellnummer: ${orderNumber}`
        : `Pre-order successful! Order number: ${orderNumber}`
    )
    
    // Reset alles
    setCart([])
    setPreOrderData({
      name: '',
      phone: '',
      email: '',
      pickupDate: '',
      pickupTime: '',
      notes: '',
      orderType: 'PICKUP'
    })
    setShowCheckout(false)
    
    // Clear session storage
    sessionStorage.removeItem('preorderData')
  }

  // Berechne Gesamtsumme für Checkout
  const calculateTotal = () => {
    return cart.reduce((sum, item) => {
      const price = item.variant?.price || item.menuItem?.price || 0
      const extrasPrice = item.extras?.reduce((extraSum: number, extra: any) => extraSum + (extra.price || 0), 0) || 0
      return sum + ((price + extrasPrice) * item.quantity)
    }, 0)
  }

  return (
    <>
      {/* Menü Ansicht (wie bei Tisch-Bestellung) */}
      <GuestMenuViewSimple 
        restaurant={restaurant}
        onCartUpdate={handleCartUpdate}
        onCheckout={handleCheckout}
        isPreOrder={true}
      />

      {/* Vorbestellungs-Dialog für Zeitauswahl */}
      <Dialog open={showPreOrderDialog} onOpenChange={setShowPreOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t('preorder.title') || 'Vorbestellung'}
              </span>
            </DialogTitle>
            <DialogDescription>
              {t('preorder.selectPickupTime') || 'Bitte wählen Sie Ihre gewünschte Abholzeit'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order Type */}
            <div>
              <Label>{t('preorder.orderType') || 'Bestellart'}</Label>
              <RadioGroup
                value={preOrderData.orderType}
                onValueChange={(value) => setPreOrderData({ ...preOrderData, orderType: value as 'PICKUP' | 'DINE_IN' })}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PICKUP" id="pickup" />
                  <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer">
                    <Package className="h-4 w-4" />
                    {t('preorder.pickup') || 'Abholung'}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DINE_IN" id="dine-in" />
                  <Label htmlFor="dine-in" className="flex items-center gap-2 cursor-pointer">
                    <Store className="h-4 w-4" />
                    {t('preorder.dineIn') || 'Vor Ort essen'}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name">
                <User className="inline-block h-4 w-4 mr-2" />
                {t('preorder.name') || 'Name'} *
              </Label>
              <Input
                id="name"
                value={preOrderData.name}
                onChange={(e) => setPreOrderData({ ...preOrderData, name: e.target.value })}
                placeholder={t('preorder.namePlaceholder') || 'Ihr Name'}
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">
                <Phone className="inline-block h-4 w-4 mr-2" />
                {t('preorder.phone') || 'Telefonnummer'} *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={preOrderData.phone}
                onChange={(e) => setPreOrderData({ ...preOrderData, phone: e.target.value })}
                placeholder={t('preorder.phonePlaceholder') || '+49 123 456789'}
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">
                <Mail className="inline-block h-4 w-4 mr-2" />
                {t('preorder.email') || 'E-Mail'}
              </Label>
              <Input
                id="email"
                type="email"
                value={preOrderData.email}
                onChange={(e) => setPreOrderData({ ...preOrderData, email: e.target.value })}
                placeholder={t('preorder.emailPlaceholder') || 'ihre.email@beispiel.de'}
              />
            </div>

            {/* Pickup Date */}
            <div>
              <Label htmlFor="pickupDate">
                <Calendar className="inline-block h-4 w-4 mr-2" />
                {preOrderData.orderType === 'PICKUP' 
                  ? (t('preorder.pickupDate') || 'Abholdatum')
                  : (t('preorder.reservationDate') || 'Reservierungsdatum')
                } *
              </Label>
              <Input
                id="pickupDate"
                type="date"
                value={preOrderData.pickupDate}
                onChange={(e) => setPreOrderData({ ...preOrderData, pickupDate: e.target.value })}
                min={getMinDate()}
                required
              />
            </div>

            {/* Pickup Time */}
            <div>
              <Label htmlFor="pickupTime">
                <Clock className="inline-block h-4 w-4 mr-2" />
                {preOrderData.orderType === 'PICKUP'
                  ? (t('preorder.pickupTime') || 'Abholzeit')
                  : (t('preorder.reservationTime') || 'Reservierungszeit')
                } *
              </Label>
              <Input
                id="pickupTime"
                type="time"
                value={preOrderData.pickupTime}
                onChange={(e) => setPreOrderData({ ...preOrderData, pickupTime: e.target.value })}
                min={preOrderData.pickupDate === getMinDate() ? getMinTime() : undefined}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('preorder.minAdvanceTime') || 'Mindestens 2 Stunden im Voraus'}
              </p>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">
                <MessageSquare className="inline-block h-4 w-4 mr-2" />
                {t('preorder.notes') || 'Anmerkungen'}
              </Label>
              <Textarea
                id="notes"
                value={preOrderData.notes}
                onChange={(e) => setPreOrderData({ ...preOrderData, notes: e.target.value })}
                placeholder={t('preorder.notesPlaceholder') || 'Besondere Wünsche oder Anmerkungen...'}
                rows={3}
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowPreOrderDialog(false)}
              >
                {t('common.cancel') || 'Abbrechen'}
              </Button>
              <Button
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
              >
                {t('preorder.proceedToPayment') || 'Weiter zur Zahlung'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Integriertes Checkout (wie bei Tischbestellung) */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{t('checkout.paymentOptions') || 'Zahlungsoptionen'}</DialogTitle>
          <DialogDescription className="sr-only">{t('checkout.selectPaymentMethod') || 'Wählen Sie Ihre Zahlungsmethode'}</DialogDescription>
          {cart.length > 0 && (() => {
            const subtotal = calculateTotal()
            const serviceFee = 0 // Kann später konfiguriert werden
            const currency = restaurant.settings?.currency || 'EUR'
            const currencySymbol = currency === 'EUR' ? '€' : currency === 'USD' ? '$' : currency
            
            return (
              <IntegratedCheckout
                restaurantId={restaurant.id}
                tableId={undefined}
                tableNumber={undefined}
                subtotal={subtotal}
                serviceFee={serviceFee}
                tipAmount={currentTipAmount}
                currency={currency}
                currencySymbol={currencySymbol}
                cartItems={cart.map(item => ({
                  menuItemId: item.menuItem.id,
                  name: item.menuItem.name,
                  quantity: item.quantity,
                  unitPrice: item.variant?.price || item.menuItem.price,
                  variantId: item.variant?.id,
                  variantName: item.variant?.name,
                  extraIds: item.extras?.map((e: any) => e.id) || [],
                  extraNames: item.extras?.map((e: any) => e.name) || [],
                  extraPrices: item.extras?.map((e: any) => e.price) || [],
                  notes: item.notes
                }))}
                selectedPaymentMethod={selectedPaymentMethod}
                selectedTipOption={selectedTipOption}
                onTipChange={(option, amount) => {
                  setSelectedTipOption(option)
                  setCurrentTipAmount(amount)
                }}
                onPaymentMethodChange={setSelectedPaymentMethod}
                onSuccess={handlePaymentSuccess}
                onCashOrder={handleCashOrder}
                onError={(error) => toast.error(error)}
                isProcessingCash={isProcessingCash}
                primaryColor={restaurant.primaryColor}
                t={t}
                formatPrice={(price: number) => {
                  return new Intl.NumberFormat(language === 'de' ? 'de-DE' : language === 'ar' ? 'ar-SA' : 'en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  }).format(price)
                }}
                showSplitBill={false}
              />
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}