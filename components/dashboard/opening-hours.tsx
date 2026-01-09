'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Clock, Save, X, Plus } from 'lucide-react'

interface TimeSlot {
  open: string
  close: string
}

interface DayHours {
  isOpen: boolean
  timeSlots: TimeSlot[]
}

interface OpeningHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

const defaultDayHours: DayHours = {
  isOpen: true,
  timeSlots: [{ open: '11:00', close: '22:00' }]
}

const defaultClosedDay: DayHours = {
  isOpen: false,
  timeSlots: []
}

const initialHours: OpeningHours = {
  monday: { ...defaultDayHours },
  tuesday: { ...defaultDayHours },
  wednesday: { ...defaultDayHours },
  thursday: { ...defaultDayHours },
  friday: { ...defaultDayHours, timeSlots: [{ open: '11:00', close: '23:00' }] },
  saturday: { ...defaultDayHours, timeSlots: [{ open: '11:00', close: '23:00' }] },
  sunday: { ...defaultClosedDay }
}

const dayNames: { [key in keyof OpeningHours]: string } = {
  monday: 'Montag',
  tuesday: 'Dienstag',
  wednesday: 'Mittwoch',
  thursday: 'Donnerstag',
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag'
}

interface OpeningHoursManagerProps {
  restaurantId?: string
  initialData?: OpeningHours
}

export function OpeningHoursManager({ restaurantId, initialData }: OpeningHoursManagerProps) {
  const [hours, setHours] = useState<OpeningHours>(initialData || initialHours)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleDayToggle = (day: keyof OpeningHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isOpen: !prev[day].isOpen,
        timeSlots: prev[day].isOpen ? [] : [{ open: '11:00', close: '22:00' }]
      }
    }))
  }

  const handleTimeChange = (
    day: keyof OpeningHours,
    slotIndex: number,
    field: 'open' | 'close',
    value: string
  ) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, index) =>
          index === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }))
  }

  const addTimeSlot = (day: keyof OpeningHours) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { open: '14:00', close: '18:00' }]
      }
    }))
  }

  const removeTimeSlot = (day: keyof OpeningHours, slotIndex: number) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, index) => index !== slotIndex)
      }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const apiUrl = restaurantId 
        ? `/api/restaurants/${restaurantId}/opening-hours`
        : '/api/settings/opening-hours'
        
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours)
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }

      toast({
        title: 'Gespeichert',
        description: 'Öffnungszeiten wurden erfolgreich aktualisiert'
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Öffnungszeiten konnten nicht gespeichert werden',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const copyToWeekdays = () => {
    const mondayHours = hours.monday
    setHours(prev => ({
      ...prev,
      tuesday: { ...mondayHours },
      wednesday: { ...mondayHours },
      thursday: { ...mondayHours },
      friday: { ...mondayHours }
    }))
    
    toast({
      title: 'Übernommen',
      description: 'Montag-Zeiten wurden auf alle Wochentage übertragen'
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Öffnungszeiten
            </CardTitle>
            <CardDescription>
              Legen Sie fest, wann Ihr Restaurant geöffnet hat
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyToWeekdays}
            >
              Mo-Fr gleiche Zeiten
            </Button>
          </div>

          {(Object.keys(hours) as Array<keyof OpeningHours>).map((day) => (
            <div key={day} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Label className="text-base font-medium w-24">
                    {dayNames[day]}
                  </Label>
                  <Switch
                    checked={hours[day].isOpen}
                    onCheckedChange={() => handleDayToggle(day)}
                  />
                  <span className="text-sm text-gray-500">
                    {hours[day].isOpen ? 'Geöffnet' : 'Geschlossen'}
                  </span>
                </div>
                
                {hours[day].isOpen && hours[day].timeSlots.length < 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTimeSlot(day)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Zeitslot
                  </Button>
                )}
              </div>

              {hours[day].isOpen && (
                <div className="space-y-2 ml-27">
                  {hours[day].timeSlots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.open}
                        onChange={(e) => handleTimeChange(day, index, 'open', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">bis</span>
                      <Input
                        type="time"
                        value={slot.close}
                        onChange={(e) => handleTimeChange(day, index, 'close', e.target.value)}
                        className="w-32"
                      />
                      {hours[day].timeSlots.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(day, index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  
                  {hours[day].timeSlots.length > 1 && (
                    <p className="text-xs text-gray-500 mt-1">
                      z.B. für Mittagspause: 11:00-14:00 und 17:00-22:00
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Spezielle Öffnungszeiten */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Feiertage & Sonderzeiten</h3>
            <p className="text-sm text-gray-600 mb-3">
              Fügen Sie spezielle Öffnungszeiten für Feiertage hinzu
            </p>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Sonderzeiten hinzufügen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}