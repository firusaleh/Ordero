'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Palette, Upload, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DesignSettingsPage() {
  const router = useRouter()
  const [primaryColor, setPrimaryColor] = useState('#FF6B35')
  const [secondaryColor, setSecondaryColor] = useState('#004E64')
  const [logo, setLogo] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [font, setFont] = useState('Inter')

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = () => {
    toast.success('Design-Einstellungen gespeichert')
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Design & Aussehen</h1>
          <p className="text-gray-600">Passen Sie das Erscheinungsbild Ihres Restaurants an</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Palette className="inline-block h-5 w-5 mr-2" />
              Farbschema
            </CardTitle>
            <CardDescription>
              Wählen Sie die Hauptfarben für Ihr Restaurant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary">Primärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#FF6B35"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary">Sekundärfarbe</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#004E64"
                />
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">Vorschau</h4>
              <div className="p-4 border rounded-lg">
                <div 
                  className="h-20 rounded-lg mb-2"
                  style={{ backgroundColor: primaryColor }}
                />
                <div 
                  className="h-10 rounded-lg"
                  style={{ backgroundColor: secondaryColor }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Upload className="inline-block h-5 w-5 mr-2" />
              Logo & Branding
            </CardTitle>
            <CardDescription>
              Laden Sie Ihr Restaurant-Logo hoch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="logo">Restaurant Logo</Label>
              <Input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-gray-500">
                Empfohlen: PNG oder SVG, mindestens 512x512px
              </p>
            </div>

            {logoPreview && (
              <div className="pt-4">
                <h4 className="text-sm font-medium mb-2">Logo Vorschau</h4>
                <div className="p-4 border rounded-lg bg-gray-50">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 mx-auto"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="font">Schriftart</Label>
              <select
                id="font"
                value={font}
                onChange={(e) => setFont(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Playfair Display">Playfair Display</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <Eye className="inline-block h-5 w-5 mr-2" />
              Erweiterte Optionen
            </CardTitle>
            <CardDescription>
              Weitere Anpassungsmöglichkeiten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Button-Stil</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Abgerundet</option>
                  <option>Eckig</option>
                  <option>Pill</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Kartendesign</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Mit Schatten</option>
                  <option>Flat</option>
                  <option>Mit Border</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Animation</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Smooth</option>
                  <option>Schnell</option>
                  <option>Keine</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Bild-Stil</Label>
                <select className="w-full px-3 py-2 border rounded-lg">
                  <option>Abgerundet</option>
                  <option>Eckig</option>
                  <option>Kreis</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button onClick={handleSave}>
          Änderungen speichern
        </Button>
      </div>
    </div>
  )
}