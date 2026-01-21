'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Clock, Users, Phone, Mail, User, CheckCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { de, ar, enUS } from 'date-fns/locale'
import { toast } from 'sonner'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface ReservationFormProps {
  restaurantSlug: string
  language?: string
}

export default function ReservationForm({ restaurantSlug, language = 'de' }: ReservationFormProps) {
  const { t } = useGuestLanguage()
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
  const [showCalendar, setShowCalendar] = useState(false)

  // Lade verfügbare Zeiten wenn Datum/Gäste sich ändern
  const loadAvailableSlots = async (date?: Date, guests?: number) => {
    setLoadingSlots(true)
    const dateToUse = date || formData.reservationDate
    const guestsToUse = guests || formData.numberOfGuests
    
    try {
      const response = await fetch(
        `/api/public/${restaurantSlug}/reservations?date=${format(dateToUse, 'yyyy-MM-dd')}&guests=${guestsToUse}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      }
    } catch (error) {
      console.error('Error loading time slots:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Lade Slots beim ersten Rendern
  useEffect(() => {
    loadAvailableSlots()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.reservationTime) {
      toast.error(t('guest.reservationForm.errors.selectTime'))
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
        toast.success(t('guest.reservationForm.success.title'))
      } else {
        toast.error(data.error || t('guest.reservationForm.errors.general'))
      }
    } catch (error) {
      toast.error(t('guest.reservationForm.errors.network'))
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
            <h2 className="text-2xl font-bold">{t('guest.reservationForm.success.title')}</h2>
            <p className="text-gray-600">
              {t('guest.reservationForm.success.message')}
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{t('guest.reservationForm.success.confirmationCode')}</p>
              <p className="text-2xl font-mono font-bold">{confirmationCode}</p>
            </div>
            <div className="pt-4">
              <Button onClick={() => window.location.reload()}>
                {t('guest.reservationForm.success.newReservation')}
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
        <div className="flex items-center gap-4 mb-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => window.location.href = `/r/${restaurantSlug}`}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>{t('guest.reservationForm.title')}</CardTitle>
            <CardDescription>
              {t('guest.reservationForm.subtitle')}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Persönliche Daten */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('guest.reservationForm.yourData')}</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name">
                  <User className="inline h-4 w-4 mr-1" />
                  {t('guest.reservationForm.name')} *
                </Label>
                <Input
                  id="name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder={t('guest.reservationForm.namePlaceholder')}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">
                  <Phone className="inline h-4 w-4 mr-1" />
                  {t('guest.reservationForm.phone')} *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder={t('guest.reservationForm.phonePlaceholder')}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">
                <Mail className="inline h-4 w-4 mr-1" />
                {t('guest.reservationForm.email')} *
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                placeholder={t('guest.reservationForm.emailPlaceholder')}
              />
            </div>
          </div>

          {/* Reservierungsdetails */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t('guest.reservationForm.details')}</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="guests">
                  <Users className="inline h-4 w-4 mr-1" />
                  {t('guest.reservationForm.numberOfGuests')} *
                </Label>
                <Select
                  value={formData.numberOfGuests.toString()}
                  onValueChange={(value) => {
                    const guests = parseInt(value)
                    setFormData({ ...formData, numberOfGuests: guests })
                    loadAvailableSlots(formData.reservationDate, guests)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? t('guest.reservationForm.person') : t('guest.reservationForm.persons')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>
                  <CalendarIcon className="inline h-4 w-4 mr-1" />
                  {t('guest.reservationForm.date')} *
                </Label>
                <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.reservationDate, 'PPP', { locale: getLocale() })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.reservationDate}
                      onSelect={(date) => {
                        if (date) {
                          setFormData({ ...formData, reservationDate: date })
                          setShowCalendar(false)
                          loadAvailableSlots(date, formData.numberOfGuests)
                        }
                      }}
                      initialFocus
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      locale={getLocale()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Zeit-Auswahl */}
            <div>
              <Label>
                <Clock className="inline h-4 w-4 mr-1" />
                {t('guest.reservationForm.time')} *
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                {loadingSlots ? (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    {t('guest.reservationForm.loadingSlots')}
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="col-span-full text-center py-4 text-gray-500">
                    {t('guest.reservationForm.selectDateFirst')}
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
            <h3 className="font-semibold">{t('guest.reservationForm.additionalInfo')}</h3>
            
            <div>
              <Label htmlFor="requests">{t('guest.reservationForm.specialRequests')}</Label>
              <Textarea
                id="requests"
                value={formData.specialRequests}
                onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                placeholder={t('guest.reservationForm.specialRequestsPlaceholder')}
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="notes">{t('guest.reservationForm.notes')}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder={t('guest.reservationForm.notesPlaceholder')}
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
            {loading ? t('guest.reservationForm.loading') : t('guest.reservationForm.submit')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}