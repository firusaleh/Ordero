'use client'

import { useState, useEffect } from 'react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import GuestMenuViewSimple from './guest-menu-view-simple'
import { Calendar, Clock, User, Phone, Mail, MessageSquare } from 'lucide-react'
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
import { format } from 'date-fns'
import { de, enUS, ar } from 'date-fns/locale'

interface PreOrderMenuViewProps {
  restaurant: any
}

export default function PreOrderMenuView({ restaurant }: PreOrderMenuViewProps) {
  const { t, language } = useGuestLanguage()
  const [cart, setCart] = useState<any[]>([])
  const [showPreOrderDialog, setShowPreOrderDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Vorbestellungs-Formular
  const [preOrderData, setPreOrderData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupDate: '',
    pickupTime: '',
    notes: ''
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
      toast.error(language === 'de' ? 'Bitte geben Sie Ihren Namen ein' : 'Please enter your name')
      return false
    }
    if (!preOrderData.phone.trim()) {
      toast.error(language === 'de' ? 'Bitte geben Sie Ihre Telefonnummer ein' : 'Please enter your phone number')
      return false
    }
    if (!preOrderData.pickupDate) {
      toast.error(language === 'de' ? 'Bitte wählen Sie ein Abholdatum' : 'Please select a pickup date')
      return false
    }
    if (!preOrderData.pickupTime) {
      toast.error(language === 'de' ? 'Bitte wählen Sie eine Abholzeit' : 'Please select a pickup time')
      return false
    }
    return true
  }

  const handleSubmitPreOrder = async () => {
    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      // Berechne Gesamtsumme
      const subtotal = cart.reduce((sum, item) => {
        const itemPrice = item.unitPrice * item.quantity
        const extrasPrice = item.extraPrices?.reduce((a: number, b: number) => a + b, 0) || 0
        return sum + itemPrice + (extrasPrice * item.quantity)
      }, 0)

      const orderData = {
        restaurantId: restaurant.id,
        type: 'PREORDER',
        items: cart,
        subtotal,
        tax: 0, // Kann später berechnet werden
        tip: 0,
        total: subtotal,
        customerName: preOrderData.name,
        customerPhone: preOrderData.phone,
        customerEmail: preOrderData.email || null,
        pickupDateTime: `${preOrderData.pickupDate}T${preOrderData.pickupTime}:00`,
        notes: preOrderData.notes || null
      }

      const response = await fetch(`/api/restaurants/${restaurant.id}/preorders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Vorbestellung')
      }

      const result = await response.json()

      // Erfolg
      toast.success(
        language === 'de' 
          ? `Vorbestellung erfolgreich! Bestellnummer: ${result.orderNumber}`
          : `Pre-order successful! Order number: ${result.orderNumber}`
      )

      // Reset
      setCart([])
      setPreOrderData({
        name: '',
        phone: '',
        email: '',
        pickupDate: '',
        pickupTime: '',
        notes: ''
      })
      setShowPreOrderDialog(false)

      // Optional: Weiterleitung zu Bestätigungsseite
      if (result.confirmationUrl) {
        window.location.href = result.confirmationUrl
      }

    } catch (error) {
      console.error('Fehler bei Vorbestellung:', error)
      toast.error(
        language === 'de' 
          ? 'Fehler beim Erstellen der Vorbestellung'
          : 'Error creating pre-order'
      )
    } finally {
      setIsSubmitting(false)
    }
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

      {/* Vorbestellungs-Dialog */}
      <Dialog open={showPreOrderDialog} onOpenChange={setShowPreOrderDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {language === 'de' ? 'Vorbestellung abschließen' : 'Complete Pre-order'}
            </DialogTitle>
            <DialogDescription>
              {language === 'de' 
                ? 'Bitte geben Sie Ihre Kontaktdaten und Abholzeit ein'
                : 'Please enter your contact details and pickup time'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div>
              <Label htmlFor="name">
                <User className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'Name *' : 'Name *'}
              </Label>
              <Input
                id="name"
                value={preOrderData.name}
                onChange={(e) => setPreOrderData({...preOrderData, name: e.target.value})}
                placeholder={language === 'de' ? 'Ihr Name' : 'Your name'}
                required
              />
            </div>

            {/* Telefon */}
            <div>
              <Label htmlFor="phone">
                <Phone className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'Telefon *' : 'Phone *'}
              </Label>
              <Input
                id="phone"
                type="tel"
                value={preOrderData.phone}
                onChange={(e) => setPreOrderData({...preOrderData, phone: e.target.value})}
                placeholder={language === 'de' ? 'Ihre Telefonnummer' : 'Your phone number'}
                required
              />
            </div>

            {/* Email (optional) */}
            <div>
              <Label htmlFor="email">
                <Mail className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'E-Mail (optional)' : 'Email (optional)'}
              </Label>
              <Input
                id="email"
                type="email"
                value={preOrderData.email}
                onChange={(e) => setPreOrderData({...preOrderData, email: e.target.value})}
                placeholder={language === 'de' ? 'Ihre E-Mail-Adresse' : 'Your email address'}
              />
            </div>

            {/* Abholdatum */}
            <div>
              <Label htmlFor="date">
                <Calendar className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'Abholdatum *' : 'Pickup Date *'}
              </Label>
              <Input
                id="date"
                type="date"
                min={getMinDate()}
                value={preOrderData.pickupDate}
                onChange={(e) => setPreOrderData({...preOrderData, pickupDate: e.target.value})}
                required
              />
            </div>

            {/* Abholzeit */}
            <div>
              <Label htmlFor="time">
                <Clock className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'Abholzeit *' : 'Pickup Time *'}
              </Label>
              <Input
                id="time"
                type="time"
                min={preOrderData.pickupDate === getMinDate() ? getMinTime() : undefined}
                value={preOrderData.pickupTime}
                onChange={(e) => setPreOrderData({...preOrderData, pickupTime: e.target.value})}
                required
              />
            </div>

            {/* Notizen */}
            <div>
              <Label htmlFor="notes">
                <MessageSquare className="w-4 h-4 inline mr-2" />
                {language === 'de' ? 'Anmerkungen (optional)' : 'Notes (optional)'}
              </Label>
              <Textarea
                id="notes"
                value={preOrderData.notes}
                onChange={(e) => setPreOrderData({...preOrderData, notes: e.target.value})}
                placeholder={language === 'de' 
                  ? 'Besondere Wünsche oder Anmerkungen...'
                  : 'Special requests or notes...'}
                rows={3}
              />
            </div>

            {/* Bestellübersicht */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">
                {language === 'de' ? 'Ihre Bestellung' : 'Your Order'}
              </h4>
              <div className="text-sm space-y-1 max-h-32 overflow-y-auto">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>{(item.unitPrice * item.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-2 pt-2 font-semibold flex justify-between">
                <span>{language === 'de' ? 'Gesamt' : 'Total'}</span>
                <span>
                  {cart.reduce((sum, item) => {
                    const itemPrice = item.unitPrice * item.quantity
                    const extrasPrice = (item.extraPrices?.reduce((a: number, b: number) => a + b, 0) || 0) * item.quantity
                    return sum + itemPrice + extrasPrice
                  }, 0).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreOrderDialog(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSubmitPreOrder}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting 
                ? (language === 'de' ? 'Wird gesendet...' : 'Sending...')
                : (language === 'de' ? 'Vorbestellung absenden' : 'Submit Pre-order')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}