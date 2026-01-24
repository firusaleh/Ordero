'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  Palette, 
  Save, 
  Upload, 
  X, 
  Image as ImageIcon,
  Type,
  Layout,
  Smartphone,
  Monitor
} from 'lucide-react'

interface RestaurantDesignProps {
  restaurantId: string
  initialData?: {
    logo?: string
    coverImage?: string
    primaryColor?: string
    secondaryColor?: string
    fontFamily?: string
    customCss?: string
  }
}

const FONT_FAMILIES = [
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'roboto', label: 'Roboto (Clean)' },
  { value: 'playfair', label: 'Playfair (Elegant)' },
  { value: 'montserrat', label: 'Montserrat (Professional)' },
  { value: 'opensans', label: 'Open Sans (Friendly)' }
]

const COLOR_PRESETS = [
  { primary: '#FF6B35', secondary: '#E85A24', name: 'Orange (Standard)' },
  { primary: '#3B82F6', secondary: '#1E40AF', name: 'Blau' },
  { primary: '#10B981', secondary: '#047857', name: 'Grün' },
  { primary: '#EF4444', secondary: '#B91C1C', name: 'Rot' },
  { primary: '#8B5CF6', secondary: '#6D28D9', name: 'Violett' },
  { primary: '#6B7280', secondary: '#374151', name: 'Grau' }
]

export default function RestaurantDesign({ restaurantId, initialData }: RestaurantDesignProps) {
  const [design, setDesign] = useState({
    logo: initialData?.logo || '',
    banner: initialData?.coverImage || '', // Changed to banner to match API
    primaryColor: initialData?.primaryColor || '#FF6B35',
    secondaryColor: initialData?.secondaryColor || '#E85A24',
    fontFamily: initialData?.fontFamily || 'inter',
    customCss: initialData?.customCss || ''
  })
  const [loading, setLoading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null)
  const [coverPreview, setCoverPreview] = useState<string | null>(initialData?.coverImage || null)

  const handleImageUpload = useCallback(async (file: File, type: 'logo' | 'cover') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Upload fehlgeschlagen')

      const { url } = await response.json()
      
      if (type === 'logo') {
        setDesign(prev => ({ ...prev, logo: url }))
        setLogoPreview(url)
      } else {
        setDesign(prev => ({ ...prev, banner: url }))
        setCoverPreview(url)
      }

      toast.success(`${type === 'logo' ? 'Logo' : 'Titelbild'} erfolgreich hochgeladen`)
    } catch (error) {
      toast.error('Fehler beim Hochladen des Bildes')
    }
  }, [restaurantId])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validiere Dateigröße (max 2MB für Base64)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Datei ist zu groß (max. 2MB)')
      return
    }

    // Validiere Dateityp
    if (!file.type.startsWith('image/')) {
      toast.error('Nur Bilder sind erlaubt')
      return
    }

    // Preview anzeigen
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'logo') {
        setLogoPreview(reader.result as string)
      } else {
        setCoverPreview(reader.result as string)
      }
    }
    reader.readAsDataURL(file)

    // Upload
    handleImageUpload(file, type)
  }

  const saveDesign = async () => {
    setLoading(true)
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(design)
      })

      if (response.ok) {
        toast.success('Design-Einstellungen gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Design-Einstellungen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo & Bilder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5" />
            Logo & Bilder
          </CardTitle>
          <CardDescription>
            Laden Sie Ihr Logo und Titelbild hoch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div>
            <Label>Restaurant Logo</Label>
            <div className="mt-2 flex items-center gap-4">
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    className="w-24 h-24 object-contain border rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => {
                      setLogoPreview(null)
                      setDesign(prev => ({ ...prev, logo: '' }))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 'logo')}
                  className="max-w-xs"
                />
                <p className="text-xs text-gray-500 mt-1">PNG, JPG oder GIF (max. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Cover Image Upload */}
          <div>
            <Label>Titelbild</Label>
            <div className="mt-2">
              {coverPreview ? (
                <div className="relative">
                  <img 
                    src={coverPreview} 
                    alt="Titelbild" 
                    className="w-full h-48 object-cover border rounded-lg"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCoverPreview(null)
                      setDesign(prev => ({ ...prev, coverImage: '' }))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center">
                  <Upload className="w-12 h-12 text-gray-400 mb-2" />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e, 'cover')}
                    className="max-w-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">Empfohlen: 1920x400px</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Farben */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Farben
          </CardTitle>
          <CardDescription>
            Wählen Sie die Farben für Ihr Restaurant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Farb-Presets */}
          <div>
            <Label>Schnellauswahl</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {COLOR_PRESETS.map(preset => (
                <button
                  key={preset.name}
                  className="p-2 border rounded-lg hover:border-gray-400 transition-colors"
                  onClick={() => {
                    setDesign(prev => ({
                      ...prev,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    }))
                  }}
                >
                  <div className="flex gap-1 mb-1">
                    <div 
                      className="w-6 h-6 rounded" 
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div 
                      className="w-6 h-6 rounded" 
                      style={{ backgroundColor: preset.secondary }}
                    />
                  </div>
                  <p className="text-xs">{preset.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Individuelle Farben */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primaryColor">Primärfarbe</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="primaryColor"
                  type="color"
                  value={design.primaryColor}
                  onChange={(e) => setDesign(prev => ({ ...prev, primaryColor: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={design.primaryColor}
                  onChange={(e) => setDesign(prev => ({ ...prev, primaryColor: e.target.value }))}
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="secondaryColor">Sekundärfarbe</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={design.secondaryColor}
                  onChange={(e) => setDesign(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={design.secondaryColor}
                  onChange={(e) => setDesign(prev => ({ ...prev, secondaryColor: e.target.value }))}
                  placeholder="#1E40AF"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typografie */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="w-5 h-5" />
            Typografie
          </CardTitle>
          <CardDescription>
            Wählen Sie die Schriftart für Ihre Webseite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="fontFamily">Schriftart</Label>
          <select
            id="fontFamily"
            value={design.fontFamily}
            onChange={(e) => setDesign(prev => ({ ...prev, fontFamily: e.target.value }))}
            className="mt-1 w-full p-2 border rounded-lg"
          >
            {FONT_FAMILIES.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          
          <div className="mt-4 p-4 border rounded-lg" style={{ fontFamily: design.fontFamily }}>
            <p className="text-2xl font-bold mb-2">{design.fontFamily}</p>
            <p className="text-sm text-muted-foreground">
              Preview
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Erweitert */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Erweiterte Anpassungen
          </CardTitle>
          <CardDescription>
            Eigenes CSS für erweiterte Anpassungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label htmlFor="customCss">Eigenes CSS (Optional)</Label>
          <Textarea
            id="customCss"
            value={design.customCss}
            onChange={(e) => setDesign(prev => ({ ...prev, customCss: e.target.value }))}
            placeholder="/* Ihr eigenes CSS */\n.menu-item {\n  border-radius: 8px;\n}"
            className="mt-1 font-mono text-sm"
            rows={8}
          />
          <p className="text-xs text-gray-500 mt-2">
            Vorsicht: Falsches CSS kann das Design beschädigen
          </p>
        </CardContent>
      </Card>

      {/* Vorschau */}
      <Card>
        <CardHeader>
          <CardTitle>Vorschau</CardTitle>
          <CardDescription>
            So sieht Ihre Webseite mit den aktuellen Einstellungen aus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Monitor className="w-4 h-4" />
                <span className="text-sm font-medium">Desktop</span>
              </div>
              <div 
                className="border rounded-lg p-4"
                style={{
                  backgroundColor: '#fff',
                  fontFamily: design.fontFamily
                }}
              >
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-12 mb-4" />
                )}
                <div 
                  className="h-2 rounded mb-4" 
                  style={{ backgroundColor: design.primaryColor }}
                />
                <h3 
                  className="text-xl font-bold mb-2"
                  style={{ color: design.primaryColor }}
                >
                  Willkommen
                </h3>
                <p className="text-gray-600 mb-4">
                  Entdecken Sie unsere köstlichen Speisen
                </p>
                <button 
                  className="px-4 py-2 rounded text-white"
                  style={{ backgroundColor: design.secondaryColor }}
                >
                  Speisekarte ansehen
                </button>
              </div>
            </div>
            
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="w-4 h-4" />
                <span className="text-sm font-medium">Mobil</span>
              </div>
              <div 
                className="border rounded-lg p-3 max-w-[200px] mx-auto"
                style={{
                  backgroundColor: '#fff',
                  fontFamily: design.fontFamily
                }}
              >
                {logoPreview && (
                  <img src={logoPreview} alt="Logo" className="h-8 mb-3" />
                )}
                <div 
                  className="h-1 rounded mb-3" 
                  style={{ backgroundColor: design.primaryColor }}
                />
                <h3 
                  className="text-lg font-bold mb-1"
                  style={{ color: design.primaryColor }}
                >
                  Willkommen
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Entdecken Sie unsere Speisen
                </p>
                <button 
                  className="w-full px-3 py-1.5 rounded text-white text-sm"
                  style={{ backgroundColor: design.secondaryColor }}
                >
                  Speisekarte
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={saveDesign}
          disabled={loading}
        >
          {loading ? (
            <>Speichern...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Design-Einstellungen speichern
            </>
          )}
        </Button>
      </div>
    </div>
  )
}