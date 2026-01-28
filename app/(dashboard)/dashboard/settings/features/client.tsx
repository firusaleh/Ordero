'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SoundSettings } from '@/components/dashboard/sound-settings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save, Upload, Image as ImageIcon, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState, useCallback } from 'react'

interface FeaturesSettingsClientProps {
  restaurantId: string
  initialLogo?: string
}

export default function FeaturesSettingsClient({ restaurantId, initialLogo }: FeaturesSettingsClientProps) {
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogo || null)
  const [isSaving, setIsSaving] = useState(false)

  const handleImageUpload = useCallback(async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', 'logo')

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload fehlgeschlagen')

      const { url } = await response.json()
      setLogoPreview(url)

      // Save to restaurant
      const saveResponse = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo: url })
      })

      if (saveResponse.ok) {
        toast.success('Logo erfolgreich gespeichert')
      }
    } catch (error) {
      toast.error('Fehler beim Hochladen des Bildes')
    }
  }, [restaurantId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei ist zu groß (max. 2MB)')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilder sind erlaubt')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    handleImageUpload(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Erweiterte Funktionen</h1>
        <p className="text-gray-600">Verwalten Sie Bilder und Benachrichtigungen</p>
      </div>

      <Tabs defaultValue="images" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="images" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Bilder
          </TabsTrigger>
          <TabsTrigger value="sounds" className="flex items-center gap-2">
            <Volume2 className="h-4 w-4" />
            Benachrichtigungen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Restaurant-Logo</CardTitle>
              <CardDescription>
                Laden Sie das Logo Ihres Restaurants hoch
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-32 h-32 object-contain border rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={() => setLogoPreview(null)}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG oder GIF (max. 2MB)</p>
              </div>
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
          <SoundSettings restaurantId={restaurantId} />
          
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
                        new Notification('Ordero', {
                          body: 'Desktop-Benachrichtigungen aktiviert!',
                          icon: '/logo.png'
                        })
                        toast.success('Desktop-Benachrichtigungen sind jetzt aktiv')
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