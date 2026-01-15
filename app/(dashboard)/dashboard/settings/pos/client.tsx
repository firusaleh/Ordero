'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { 
  Store,
  Save,
  Zap,
  AlertCircle,
  Check
} from 'lucide-react'

interface POSSettings {
  posSystem: string | null
  posApiKey: string | null
  posRestaurantId: string | null
  syncEnabled: boolean
  lastSync: Date | null
}

interface POSSettingsClientProps {
  restaurantId: string
  initialSettings: POSSettings
}

const POS_SYSTEMS = {
  ready2order: {
    name: 'ready2order',
    displayName: 'ready2order',
    description: 'Österreichisches Kassensystem für Gastronomie',
    features: ['Menü-Sync', 'Bestellungs-Export', 'Tisch-Sync'],
    region: 'DACH'
  },
  orderbird: {
    name: 'orderbird',
    displayName: 'orderbird PRO',
    description: 'Deutsches iPad-Kassensystem',
    features: ['Menü-Import', 'Bestellungs-Export', 'Produkt-Sync'],
    region: 'DACH'
  },
  square: {
    name: 'square',
    displayName: 'Square POS',
    description: 'Beliebtes US-Kassensystem',
    features: ['Vollständige API', 'Zahlungen', 'Inventar'],
    region: 'International'
  },
  lightspeed: {
    name: 'lightspeed',
    displayName: 'Lightspeed Restaurant',
    description: 'Professionelles Restaurant-POS',
    features: ['Erweiterte API', 'Multi-Location', 'Kitchen-Display'],
    region: 'International'
  },
  custom: {
    name: 'custom',
    displayName: 'Anderes System / Custom API',
    description: 'Eigene API-Integration',
    features: ['Custom Integration', 'Flexible API'],
    region: 'Alle'
  }
}

export default function POSSettingsClient({ restaurantId, initialSettings }: POSSettingsClientProps) {
  const [settings, setSettings] = useState<POSSettings>(initialSettings)
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>(
    initialSettings.posSystem && initialSettings.posApiKey ? 'connected' : 'disconnected'
  )

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            posSystem: settings.posSystem,
            posApiKey: settings.posApiKey,
            posRestaurantId: settings.posRestaurantId,
            posSyncEnabled: settings.syncEnabled,
            posLastSync: settings.lastSync
          }
        })
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast.success('POS-Einstellungen wurden gespeichert')
      
      if (settings.posSystem && settings.posApiKey) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      toast.error('Einstellungen konnten nicht gespeichert werden')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">POS-System Integration</h1>
        <p className="text-gray-600">Verbinden Sie Ihr Kassensystem mit Ordero</p>
      </div>

      {connectionStatus === 'connected' && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ihr POS-System ist verbunden
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>POS-System Einstellungen</CardTitle>
          <CardDescription>
            Wählen Sie Ihr Kassensystem und geben Sie die API-Zugangsdaten ein
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kassensystem</Label>
            <Select 
              value={settings.posSystem || ''} 
              onValueChange={(value) => setSettings({ ...settings, posSystem: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie Ihr POS-System" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POS_SYSTEMS).map(([key, system]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      <span>{system.displayName}</span>
                      {system.region !== 'Alle' && (
                        <span className="text-xs text-gray-400">({system.region})</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {settings.posSystem && (
            <>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  {POS_SYSTEMS[settings.posSystem as keyof typeof POS_SYSTEMS].description}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {POS_SYSTEMS[settings.posSystem as keyof typeof POS_SYSTEMS].features.map((feature) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>API-Schlüssel</Label>
                <Input
                  type="password"
                  placeholder="Ihr API-Schlüssel"
                  value={settings.posApiKey || ''}
                  onChange={(e) => setSettings({ ...settings, posApiKey: e.target.value })}
                />
              </div>

              <div>
                <Label>Restaurant-ID (optional)</Label>
                <Input
                  placeholder="Restaurant-ID im POS-System"
                  value={settings.posRestaurantId || ''}
                  onChange={(e) => setSettings({ ...settings, posRestaurantId: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Nur notwendig bei mehreren Standorten
                </p>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSave} 
              disabled={isLoading || !settings.posSystem}
            >
              {isLoading ? (
                'Speichern...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Einstellungen speichern
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hinweis</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Die POS-Integration befindet sich noch in der Entwicklung. 
              Sobald verfügbar, können Sie hier Ihr Menü synchronisieren und Bestellungen direkt an Ihr Kassensystem senden.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}