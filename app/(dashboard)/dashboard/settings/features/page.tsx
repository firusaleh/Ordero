'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OpeningHoursManager } from '@/components/dashboard/opening-hours'
import { SoundSettings } from '@/components/dashboard/sound-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/image-upload'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function FeaturesSettingsPage() {
  const [restaurantImage, setRestaurantImage] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSaveRestaurantImage = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: restaurantImage })
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'Restaurant-Bild wurde aktualisiert'
      })
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Bild konnte nicht gespeichert werden',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Erweiterte Funktionen</h1>
        <p className="text-gray-600">Verwalten Sie Öffnungszeiten, Bilder und Benachrichtigungen</p>
      </div>

      <Tabs defaultValue="hours" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hours">Öffnungszeiten</TabsTrigger>
          <TabsTrigger value="images">Bilder</TabsTrigger>
          <TabsTrigger value="sounds">Benachrichtigungen</TabsTrigger>
        </TabsList>

        <TabsContent value="hours">
          <OpeningHoursManager />
        </TabsContent>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant-Logo</CardTitle>
              <CardDescription>
                Laden Sie das Logo Ihres Restaurants hoch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUpload
                value={restaurantImage}
                onChange={setRestaurantImage}
                onRemove={() => setRestaurantImage('')}
              />
              {restaurantImage && (
                <Button 
                  onClick={handleSaveRestaurantImage}
                  disabled={isSaving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Speichern...' : 'Logo speichern'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Speisen-Bilder</CardTitle>
              <CardDescription>
                Bilder für Ihre Menü-Artikel verwalten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Gehen Sie zu den jeweiligen Menü-Artikeln in der Speisekarten-Verwaltung, 
                um Bilder für einzelne Speisen hochzuladen.
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => window.location.href = '/dashboard/menu'}
              >
                Zur Speisekarte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sounds" className="space-y-4">
          <SoundSettings />
          
          <Card>
            <CardHeader>
              <CardTitle>Desktop-Benachrichtigungen</CardTitle>
              <CardDescription>
                Browser-Benachrichtigungen für neue Bestellungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                onClick={() => {
                  if ('Notification' in window) {
                    Notification.requestPermission().then(permission => {
                      if (permission === 'granted') {
                        new Notification('Oriido', {
                          body: 'Desktop-Benachrichtigungen aktiviert!',
                          icon: '/logo.png'
                        })
                        toast({
                          title: 'Aktiviert',
                          description: 'Desktop-Benachrichtigungen sind jetzt aktiv'
                        })
                      }
                    })
                  }
                }}
              >
                Desktop-Benachrichtigungen aktivieren
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}