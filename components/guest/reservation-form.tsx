'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon, Clock, Users, Phone, Mail, User, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { de, ar, enUS } from 'date-fns/locale'
import { toast } from 'sonner'

interface ReservationFormProps {
  restaurantSlug: string
  language?: string
}

export default function ReservationForm({ restaurantSlug, language = 'de' }: ReservationFormProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  
  // Form State
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    numberOfGuests: 2,
    reservationDate: new Date(),
    reservationTime: '',
    notes: '',
    specialRequests: ''
  })

  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Lade verfügbare Zeiten wenn Datum/Gäste sich ändern
  const loadAvailableSlots = async () => {
    setLoadingSlots(true)
    try {
      const response = await fetch(
        `/api/public/${restaurantSlug}/reservations?date=${format(formData.reservationDate, 'yyyy-MM-dd')}&guests=${formData.numberOfGuests}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Zeitslots:', error)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reservationTime) {
      toast.error('Bitte wählen Sie eine Uhrzeit')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/public/${restaurantSlug}/reservations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          reservationDate: format(formData.reservationDate, 'yyyy-MM-dd')
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setConfirmationCode(data.reservation.confirmationToken)
        toast.success('Reservierung erfolgreich!')
      } else {
        toast.error(data.error || 'Fehler bei der Reservierung')
      }
    } catch (error) {
      toast.error('Netzwerkfehler. Bitte versuchen Sie es später erneut.')
    } finally {
      setLoading(false)
    }
  }

  const getLocale = () => {
    switch(language) {
      case 'ar': return ar
      case 'en': return enUS
      default: return de
    }
  }

  // Erfolgsansicht
  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">Reservierung bestätigt!</h2>
            <p className="text-gray-600">
              Vielen Dank für Ihre Reservierung. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Bestätigungscode:</p>
              <p className="text-2xl font-mono font-bold">{confirmationCode}</p>
            </div>
            <div className="pt-4">
              <Button onClick={() => window.location.reload()}>
                Neue Reservierung
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Tisch reservieren</CardTitle>
        <CardDescription>
          Reservieren Sie Ihren Tisch bequem online
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Persönliche Daten */}
          <div className="space-y-4">
            <h3 className="font-semibold">Ihre Daten</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 mr-1" />
                  Name *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Max Mustermann"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Telefon *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+49 123 456789"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                E-Mail *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder="max@example.com"
              />
            </div>
          </div>

          {/* Reservierungsdetails */}
          <div className="space-y-4">
            <h3 className="font-semibold">Reservierungsdetails</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="guests">
                  <Users className="inline h-4 w-4 mr-1" />
                  Anzahl Personen *
                </Label>
                <Select
                  value={formData.numberOfGuests.toString()}
                  onValueChange={(value) => {
                    setFormData({ ...formData, numberOfGuests: parseInt(value) })
                    loadAvailableSlots()
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Person' : 'Personen'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  Datum *
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  onClick={() => {/* Open calendar popup */}}
                >
                  {format(formData.reservationDate, 'PPP', { locale: getLocale() })}
                </Button>
              </div>
            </div>

            {/* Zeit-Auswahl */}
            <div>
              <Label>
                <Clock className="inline h-4 w-4 mr-1" />
                Uhrzeit *
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {loadingSlots ? (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    Lade verfügbare Zeiten...
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    Bitte wählen Sie zuerst ein Datum
                  </div>
                ) : (
                  availableSlots.map(slot => (
                    <Button
                      key={slot.time}
                      type="button"
                      variant={formData.reservationTime === slot.time ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFormData({ ...formData, reservationTime: slot.time })}
                      disabled={slot.availableTables === 0}
                    >
                      {slot.time}
                    </Button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Zusätzliche Informationen */}
          <div className="space-y-4">
            <h3 className="font-semibold">Zusätzliche Informationen (optional)</h3>
            
            <div>
              <Label htmlFor="requests">Besondere Wünsche</Label>
              <Textarea
                id="requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder="z.B. Kinderstuhl benötigt, Fensterplatz gewünscht..."
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Anmerkungen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Weitere Informationen für das Restaurant..."
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            size="lg"
            disabled={loading || !formData.reservationTime}
          >
            {loading ? 'Wird verarbeitet...' : 'Jetzt reservieren'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}