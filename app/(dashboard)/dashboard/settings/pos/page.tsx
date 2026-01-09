'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { 
  Link2, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Download,
  Upload,
  Zap,
  Store
} from 'lucide-react'

interface POSSettings {
  posSystem: string | null
  posApiKey: string | null
  posRestaurantId: string | null
  syncEnabled: boolean
  lastSync: Date | null
}

const POS_SYSTEMS = {
  // Beliebte deutsche/österreichische Systeme
  ready2order: {
    name: 'ready2order',
    displayName: 'ready2order',
    description: 'Österreichisches Kassensystem für Gastronomie',
    setupGuide: 'https://ready2order.com/de/schnittstellen',
    features: ['Menü-Sync', 'Bestellungs-Export', 'Tisch-Sync', 'Echtzeit-Updates'],
    region: 'DACH'
  },
  orderbird: {
    name: 'orderbird',
    displayName: 'orderbird PRO',
    description: 'Deutsches iPad-Kassensystem',
    setupGuide: 'https://www.orderbird.com/de/kassensystem/schnittstellen',
    features: ['Menü-Import', 'Bestellungs-Export', 'Produkt-Sync'],
    region: 'DACH'
  },
  gastrofix: {
    name: 'gastrofix',
    displayName: 'Gastrofix',
    description: 'Cloud-basiertes Kassensystem',
    setupGuide: 'https://gastrofix.com/schnittstellen',
    features: ['Menü-Sync', 'Bestellungs-Export', 'Berichte'],
    region: 'DACH'
  },
  
  // Weitere deutsche Systeme
  tillhub: {
    name: 'tillhub',
    displayName: 'Tillhub',
    description: 'Modernes Cloud-Kassensystem',
    setupGuide: 'https://www.tillhub.de/api',
    features: ['Artikel-Sync', 'Bestandsverwaltung', 'Analytics'],
    region: 'DACH'
  },
  enforePOS: {
    name: 'enforePOS',
    displayName: 'enforePOS',
    description: 'All-in-One Kassensystem',
    setupGuide: 'https://enforpos.com/api',
    features: ['Menü-Sync', 'Multi-Store', 'Loyalty'],
    region: 'DACH'
  },
  helloCash: {
    name: 'helloCash',
    displayName: 'helloCash',
    description: 'Einfaches Kassensystem für KMU',
    setupGuide: 'https://hellocash.at/schnittstellen',
    features: ['Registrierkasse', 'Rechnungen', 'Berichte'],
    region: 'AT'
  },
  
  // Internationale Top-Systeme
  square: {
    name: 'square',
    displayName: 'Square POS',
    description: 'Beliebtes US-Kassensystem',
    setupGuide: 'https://developer.squareup.com',
    features: ['Vollständige API', 'Zahlungen', 'Inventar', 'Analytics'],
    region: 'International'
  },
  lightspeed: {
    name: 'lightspeed',
    displayName: 'Lightspeed Restaurant',
    description: 'Professionelles Restaurant-POS',
    setupGuide: 'https://developers.lightspeedhq.com',
    features: ['Erweiterte API', 'Multi-Location', 'Kitchen-Display'],
    region: 'International'
  },
  revel: {
    name: 'revel',
    displayName: 'Revel Systems',
    description: 'Enterprise iPad-POS',
    setupGuide: 'https://developer.revelsystems.com',
    features: ['Umfangreiche API', 'Enterprise', 'Custom Integration'],
    region: 'International'
  },
  clover: {
    name: 'clover',
    displayName: 'Clover POS',
    description: 'Flexibles POS-System',
    setupGuide: 'https://docs.clover.com',
    features: ['App-Market', 'Hardware', 'E-Commerce'],
    region: 'International'
  },
  
  // Spezialisierte Gastronomie-Systeme
  gastronovi: {
    name: 'gastronovi',
    displayName: 'Gastronovi Office',
    description: 'Komplettlösung für Gastronomie',
    setupGuide: 'https://www.gastronovi.com/schnittstellen',
    features: ['Warenwirtschaft', 'Kassensystem', 'Tischreservierung'],
    region: 'DACH'
  },
  lavu: {
    name: 'lavu',
    displayName: 'Lavu POS',
    description: 'Restaurant & Bar fokussiert',
    setupGuide: 'https://developer.lavu.com',
    features: ['Mobile POS', 'Bar-Tabs', 'Happy Hour'],
    region: 'US'
  },
  toast: {
    name: 'toast',
    displayName: 'Toast POS',
    description: 'Restaurant-Management-Platform',
    setupGuide: 'https://pos.toasttab.com/api',
    features: ['Online-Ordering', 'Delivery', 'Kitchen-Display'],
    region: 'US'
  },
  
  // Andere/Custom
  custom: {
    name: 'custom',
    displayName: 'Anderes System / Custom API',
    description: 'Eigene API-Integration',
    setupGuide: '#',
    features: ['Custom Integration', 'Flexible API'],
    region: 'Alle'
  }
}

export default function POSSettingsPage() {
  const { toast } = useToast()
  const [settings, setSettings] = useState<POSSettings>({
    posSystem: null,
    posApiKey: null,
    posRestaurantId: null,
    syncEnabled: false,
    lastSync: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('disconnected')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/pos')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
        if (data.posSystem && data.posApiKey) {
          setConnectionStatus('connected')
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der POS-Einstellungen:', error)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/settings/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      toast({
        title: 'Erfolgreich gespeichert',
        description: 'POS-Einstellungen wurden aktualisiert'
      })
      
      if (settings.posSystem && settings.posApiKey) {
        setConnectionStatus('connected')
      } else {
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Einstellungen konnten nicht gespeichert werden',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!settings.posSystem || !settings.posApiKey) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie API-Schlüssel ein',
        variant: 'destructive'
      })
      return
    }

    setIsTesting(true)
    setConnectionStatus('testing')
    
    try {
      const response = await fetch('/api/pos/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        setConnectionStatus('connected')
        toast({
          title: 'Verbindung erfolgreich',
          description: 'POS-System ist verbunden'
        })
      } else {
        throw new Error('Verbindungstest fehlgeschlagen')
      }
    } catch (error) {
      setConnectionStatus('disconnected')
      toast({
        title: 'Verbindung fehlgeschlagen',
        description: 'Überprüfen Sie Ihre Zugangsdaten',
        variant: 'destructive'
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSyncMenu = async () => {
    setIsSyncing(true)
    try {
      const response = await fetch('/api/pos/sync-menu', {
        method: 'POST'
      })

      if (!response.ok) throw new Error('Sync fehlgeschlagen')

      const result = await response.json()
      
      toast({
        title: 'Menü synchronisiert',
        description: `${result.imported} Artikel importiert, ${result.updated} aktualisiert`
      })
      
      setSettings({ ...settings, lastSync: new Date() })
    } catch (error) {
      toast({
        title: 'Sync fehlgeschlagen',
        description: 'Menü konnte nicht synchronisiert werden',
        variant: 'destructive'
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = () => {
    setSettings({
      posSystem: null,
      posApiKey: null,
      posRestaurantId: null,
      syncEnabled: false,
      lastSync: null
    })
    setConnectionStatus('disconnected')
    handleSave()
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">POS-System Integration</h1>
        <p className="text-gray-600">Verbinden Sie Ihr Kassensystem mit Oriido</p>
      </div>

      {connectionStatus === 'connected' && (
        <Alert className="bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Ihr POS-System ist verbunden und synchronisiert
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="setup" className="space-y-6">
        <TabsList>
          <TabsTrigger value="setup">Einrichtung</TabsTrigger>
          <TabsTrigger value="sync" disabled={connectionStatus !== 'connected'}>
            Synchronisation
          </TabsTrigger>
          <TabsTrigger value="guide">Anleitung</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>POS-System wählen</CardTitle>
              <CardDescription>
                Wählen Sie Ihr Kassensystem und geben Sie die API-Zugangsdaten ein
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Kassensystem</Label>
                <Select 
                  value={settings.posSystem || ''} 
                  onValueChange={(value) => setSettings({ ...settings, posSystem: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen Sie Ihr POS-System" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[400px]">
                    {/* DACH Region */}
                    <div className="text-xs text-gray-500 px-2 py-1.5 font-semibold">
                      🇩🇪 🇦🇹 🇨🇭 DACH Region
                    </div>
                    {Object.entries(POS_SYSTEMS)
                      .filter(([_, system]) => system.region === 'DACH' || system.region === 'AT')
                      .map(([key, system]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            <span>{system.displayName}</span>
                            {system.region === 'AT' && <span className="text-xs text-gray-400">(AT)</span>}
                          </div>
                        </SelectItem>
                      ))}
                    
                    {/* Internationale Systeme */}
                    <div className="text-xs text-gray-500 px-2 py-1.5 font-semibold mt-2">
                      🌍 International
                    </div>
                    {Object.entries(POS_SYSTEMS)
                      .filter(([_, system]) => system.region === 'International')
                      .map(([key, system]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {system.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    
                    {/* US Systeme */}
                    <div className="text-xs text-gray-500 px-2 py-1.5 font-semibold mt-2">
                      🇺🇸 US-Systeme
                    </div>
                    {Object.entries(POS_SYSTEMS)
                      .filter(([_, system]) => system.region === 'US')
                      .map(([key, system]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {system.displayName}
                          </div>
                        </SelectItem>
                      ))}
                    
                    {/* Custom/Andere */}
                    <div className="text-xs text-gray-500 px-2 py-1.5 font-semibold mt-2">
                      ⚙️ Andere
                    </div>
                    {Object.entries(POS_SYSTEMS)
                      .filter(([_, system]) => system.region === 'Alle')
                      .map(([key, system]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Store className="h-4 w-4" />
                            {system.displayName}
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

                  <div className="space-y-2">
                    <Label>API-Schlüssel</Label>
                    <Input
                      type="password"
                      placeholder="Ihr API-Schlüssel"
                      value={settings.posApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, posApiKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Restaurant-ID (optional)</Label>
                    <Input
                      placeholder="Restaurant-ID im POS-System"
                      value={settings.posRestaurantId || ''}
                      onChange={(e) => setSettings({ ...settings, posRestaurantId: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Nur notwendig bei mehreren Standorten
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleTestConnection}
                      disabled={isTesting || !settings.posApiKey}
                    >
                      {isTesting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Teste Verbindung...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Verbindung testen
                        </>
                      )}
                    </Button>

                    {connectionStatus === 'connected' && (
                      <Button
                        variant="outline"
                        onClick={handleDisconnect}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Verbindung trennen
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSave} 
                disabled={isLoading || !settings.posSystem || !settings.posApiKey}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  'Speichern'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Menü-Synchronisation</CardTitle>
              <CardDescription>
                Importieren Sie Ihr Menü aus dem POS-System
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.lastSync && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Letzte Synchronisation: {new Date(settings.lastSync).toLocaleString('de-DE')}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSyncMenu}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Synchronisiere...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Menü aus POS importieren
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Bestellungen an POS senden (Coming Soon)
                </Button>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Automatische Synchronisation</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Aktivieren Sie automatische Updates alle 30 Minuten
                </p>
                <Button variant="outline" disabled>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Auto-Sync aktivieren (Premium)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guide" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Einrichtungsanleitung</CardTitle>
              <CardDescription>
                So verbinden Sie Ihr POS-System mit Oriido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">1. API-Schlüssel generieren</h4>
                  <p className="text-sm text-gray-600">
                    Melden Sie sich in Ihrem POS-System an und navigieren Sie zu den API-Einstellungen.
                    Generieren Sie einen neuen API-Schlüssel mit Lese- und Schreibrechten.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">2. Zugangsdaten eingeben</h4>
                  <p className="text-sm text-gray-600">
                    Kopieren Sie den API-Schlüssel und fügen Sie ihn in Oriido ein.
                    Falls Sie mehrere Standorte haben, geben Sie auch die Restaurant-ID an.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">3. Verbindung testen</h4>
                  <p className="text-sm text-gray-600">
                    Klicken Sie auf "Verbindung testen" um sicherzustellen, dass die Zugangsdaten korrekt sind.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">4. Menü synchronisieren</h4>
                  <p className="text-sm text-gray-600">
                    Nach erfolgreicher Verbindung können Sie Ihr Menü aus dem POS-System importieren.
                    Bestehende Artikel werden dabei aktualisiert.
                  </p>
                </div>
              </div>

              {settings.posSystem && (
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(
                      POS_SYSTEMS[settings.posSystem as keyof typeof POS_SYSTEMS].setupGuide,
                      '_blank'
                    )}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {POS_SYSTEMS[settings.posSystem as keyof typeof POS_SYSTEMS].displayName} Dokumentation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}