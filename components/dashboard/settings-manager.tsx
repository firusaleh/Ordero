"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/contexts/language-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
// Tabs temporarily disabled - using buttons instead
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Store, 
  MapPin, 
  Phone, 
  Globe, 
  Palette, 
  Bell,
  Clock,
  Languages,
  CreditCard,
  Wifi,
  Save,
  Loader2,
  AlertTriangle,
  Check,
  Shield,
  Eye,
  EyeOff,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun
} from 'lucide-react'
import { toast } from 'sonner'

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  cuisine?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  country: string
  phone?: string | null
  email?: string | null
  website?: string | null
  logo?: string | null
  coverImage?: string | null
  primaryColor?: string | null
  status: string
  plan: string
  trialEndsAt?: Date | null
  posSystem?: string | null
  posConnected: boolean
}

interface RestaurantSettings {
  id: string
  orderingEnabled: boolean
  requireTableNumber: boolean
  allowTakeaway: boolean
  emailNotifications: boolean
  soundNotifications: boolean
  openingHours?: any
  currency: string
  language: string
}

interface SettingsManagerProps {
  restaurant: Restaurant
  settings: RestaurantSettings | null
}

export default function SettingsManager({ restaurant: initialRestaurant, settings: initialSettings }: SettingsManagerProps) {
  const router = useRouter()
  const { t } = useLanguage()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  // Restaurant Form
  const [restaurant, setRestaurant] = useState<any>({
    name: initialRestaurant.name,
    description: initialRestaurant.description || '',
    cuisine: initialRestaurant.cuisine || '',
    street: initialRestaurant.street || '',
    city: initialRestaurant.city || '',
    postalCode: initialRestaurant.postalCode || '',
    phone: initialRestaurant.phone || '',
    email: initialRestaurant.email || '',
    website: initialRestaurant.website || '',
    primaryColor: initialRestaurant.primaryColor || '#3b82f6',
    // Neue Eigenschaften für erweiterte Tabs
    logo: initialRestaurant.logo || '',
    coverImage: initialRestaurant.coverImage || '',
    dashboardTheme: 'light',
    language: 'de',
    currency: 'EUR',
    timezone: 'Europe/Berlin',
    dateFormat: 'DD.MM.YYYY',
    multiLanguageMenu: false,
    twoFactorEnabled: false,
    sessionTimeout: '30',
    staffCanEditMenu: false,
    staffCanCancelOrders: false,
    apiKey: '',
    showApiKey: false
  })
  
  // Settings Form
  const [settings, setSettings] = useState({
    orderingEnabled: initialSettings?.orderingEnabled ?? true,
    requireTableNumber: initialSettings?.requireTableNumber ?? true,
    allowTakeaway: initialSettings?.allowTakeaway ?? false,
    emailNotifications: initialSettings?.emailNotifications ?? true,
    soundNotifications: initialSettings?.soundNotifications ?? true,
    currency: initialSettings?.currency || 'EUR',
    language: initialSettings?.language || 'de'
  })
  
  // Opening Hours
  const [openingHours, setOpeningHours] = useState<{ [key: string]: { open: string; close: string; closed: boolean } }>({
    mo: { open: '11:00', close: '22:00', closed: false },
    di: { open: '11:00', close: '22:00', closed: false },
    mi: { open: '11:00', close: '22:00', closed: false },
    do: { open: '11:00', close: '22:00', closed: false },
    fr: { open: '11:00', close: '23:00', closed: false },
    sa: { open: '11:00', close: '23:00', closed: false },
    so: { open: '12:00', close: '22:00', closed: false },
  })

  const handleSaveGeneral = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'restaurant', ...restaurant })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('toast.saveError'))
      }

      toast.success(t('toast.generalSettingsSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'settings',
          ...settings,
          openingHours: JSON.stringify(openingHours)
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || t('toast.saveError'))
      }

      toast.success(t('toast.settingsSaved'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('toast.saveError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnectPOS = async () => {
    if (!confirm(t('settings.pos.disconnectConfirm') || 'Möchten Sie die POS-Verbindung wirklich trennen?')) {
      return
    }
    
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/restaurants/${initialRestaurant.id}/pos/disconnect`, {
        method: 'POST'
      })

      if (!response.ok) throw new Error(t('toast.posDisconnectError'))

      toast.success(t('toast.posDisconnected'))
      router.refresh()
    } catch (error) {
      toast.error(t('toast.posDisconnectError'))
    } finally {
      setIsLoading(false)
    }
  }

  const dayNames: { [key: string]: string } = {
    mo: t('common.days.monday') || 'Montag',
    di: t('common.days.tuesday') || 'Dienstag',
    mi: t('common.days.wednesday') || 'Mittwoch',
    do: t('common.days.thursday') || 'Donnerstag',
    fr: t('common.days.friday') || 'Freitag',
    sa: t('common.days.saturday') || 'Samstag',
    so: t('common.days.sunday') || 'Sonntag'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
        <p className="text-gray-600">{t('settings.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
        <Button
          variant={activeTab === 'general' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('general')}
          size="sm"
        >
          {t('settings.tabs.general') || 'Allgemein'}
        </Button>
        <Button
          variant={activeTab === 'ordering' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('ordering')}
          size="sm"
        >
          {t('settings.tabs.ordering') || 'Bestellung'}
        </Button>
        <Button
          variant={activeTab === 'hours' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('hours')}
          size="sm"
        >
          {t('common.openingHours')}
        </Button>
        <Button
          variant={activeTab === 'pos' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pos')}
          size="sm"
        >
          {t('settings.tabs.pos') || 'POS'}
        </Button>
        <Button
          variant={activeTab === 'billing' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('billing')}
          size="sm"
        >
          {t('settings.tabs.billing') || 'Abrechnung'}
        </Button>
        <Button
          variant={activeTab === 'design' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('design')}
          size="sm"
        >
          {t('settings.tabs.design') || 'Design'}
        </Button>
        <Button
          variant={activeTab === 'language' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('language')}
          size="sm"
        >
          {t('settings.tabs.language') || 'Sprache'}
        </Button>
        <Button
          variant={activeTab === 'security' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('security')}
          size="sm"
        >
          {t('settings.tabs.security') || 'Sicherheit'}
        </Button>
      </div>

      <div className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.general.title') || 'Restaurant-Informationen'}</CardTitle>
              <CardDescription>
                {t('settings.general.description') || 'Grundlegende Informationen über Ihr Restaurant'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t('settings.general.restaurantName') || 'Restaurant Name'}</Label>
                  <Input
                    id="name"
                    value={restaurant.name}
                    onChange={(e) => setRestaurant({ ...restaurant, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">{t('common.cuisine')}</Label>
                  <Input
                    id="cuisine"
                    value={restaurant.cuisine}
                    onChange={(e) => setRestaurant({ ...restaurant, cuisine: e.target.value })}
                    placeholder={t('common.placeholder.cuisine') || 'z.B. Italienisch'}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">{t('common.description')}</Label>
                <Textarea
                  id="description"
                  value={restaurant.description}
                  onChange={(e) => setRestaurant({ ...restaurant, description: e.target.value })}
                  rows={3}
                  placeholder={t('common.placeholder.description') || 'Beschreiben Sie Ihr Restaurant...'}
                />
              </div>

              <Separator />

              <h3 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t('common.address')}
              </h3>
              
              <div>
                <Label htmlFor="street">{t('common.streetAndNumber')}</Label>
                <Input
                  id="street"
                  value={restaurant.street}
                  onChange={(e) => setRestaurant({ ...restaurant, street: e.target.value })}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="postalCode">{t('common.postalCode')}</Label>
                  <Input
                    id="postalCode"
                    value={restaurant.postalCode}
                    onChange={(e) => setRestaurant({ ...restaurant, postalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="city">{t('common.city')}</Label>
                  <Input
                    id="city"
                    value={restaurant.city}
                    onChange={(e) => setRestaurant({ ...restaurant, city: e.target.value })}
                  />
                </div>
              </div>

              <Separator />

              <h3 className="font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {t('common.contactInformation')}
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">{t('common.phoneNumber')}</Label>
                  <Input
                    id="phone"
                    value={restaurant.phone}
                    onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t('common.emailAddress')}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurant.email}
                    onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">{t('common.website')}</Label>
                <Input
                  id="website"
                  type="url"
                  value={restaurant.website}
                  onChange={(e) => setRestaurant({ ...restaurant, website: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <Separator />

              <h3 className="font-medium flex items-center gap-2">
                <Palette className="h-4 w-4" />
                {t('settings.design.branding') || 'Branding'}
              </h3>
              
              <div>
                <Label htmlFor="primaryColor">{t('settings.design.primaryColor')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={restaurant.primaryColor}
                    onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                    className="w-20"
                  />
                  <Input
                    value={restaurant.primaryColor}
                    onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveGeneral} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t('common.save')}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Ordering Tab */}
        {activeTab === 'ordering' && (
          <Card>
            <CardHeader>
              <CardTitle>Bestelleinstellungen</CardTitle>
              <CardDescription>
                Konfigurieren Sie, wie Gäste bestellen können
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Online-Bestellungen</Label>
                  <p className="text-sm text-gray-500">
                    Gäste können über QR-Codes bestellen
                  </p>
                </div>
                <Switch
                  checked={settings.orderingEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, orderingEnabled: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tischnummer erforderlich</Label>
                  <p className="text-sm text-gray-500">
                    Gäste müssen eine Tischnummer angeben
                  </p>
                </div>
                <Switch
                  checked={settings.requireTableNumber}
                  onCheckedChange={(checked) => setSettings({ ...settings, requireTableNumber: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Takeaway erlauben</Label>
                  <p className="text-sm text-gray-500">
                    Gäste können Bestellungen zum Mitnehmen aufgeben
                  </p>
                </div>
                <Switch
                  checked={settings.allowTakeaway}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowTakeaway: checked })}
                />
              </div>

              <Separator />

              <h3 className="font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Benachrichtigungen
              </h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>E-Mail-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">
                    E-Mail bei neuen Bestellungen erhalten
                  </p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Sound-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">
                    Ton abspielen bei neuen Bestellungen
                  </p>
                </div>
                <Switch
                  checked={settings.soundNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, soundNotifications: checked })}
                />
              </div>

              <Separator />

              <h3 className="font-medium flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Sprache & Währung
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="language">Sprache</Label>
                  <select
                    id="language"
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="it">Italiano</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="currency">Währung</Label>
                  <select
                    id="currency"
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CHF">CHF</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <Card>
            <CardHeader>
              <CardTitle>Öffnungszeiten</CardTitle>
              <CardDescription>
                Legen Sie fest, wann Ihr Restaurant geöffnet hat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(openingHours).map(([day, hours]) => (
                <div key={day} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-4 flex-1">
                    <p className="font-medium w-24">{dayNames[day]}</p>
                    {!hours.closed ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => setOpeningHours({
                            ...openingHours,
                            [day]: { ...hours, open: e.target.value }
                          })}
                          className="w-32"
                        />
                        <span>bis</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => setOpeningHours({
                            ...openingHours,
                            [day]: { ...hours, close: e.target.value }
                          })}
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <p className="text-gray-500">Geschlossen</p>
                    )}
                  </div>
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => setOpeningHours({
                      ...openingHours,
                      [day]: { ...hours, closed: !checked }
                    })}
                  />
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveSettings} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Speichern
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* POS Tab */}
        {activeTab === 'pos' && (
          <Card>
            <CardHeader>
              <CardTitle>POS-Integration</CardTitle>
              <CardDescription>
                Verbinden Sie Ihr Kassensystem mit Oriido
              </CardDescription>
            </CardHeader>
            <CardContent>
              {initialRestaurant.posConnected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Check className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Verbunden mit {initialRestaurant.posSystem}</p>
                        <p className="text-sm text-gray-600">
                          Bestellungen werden automatisch synchronisiert
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700">Aktiv</Badge>
                  </div>
                  
                  <Button variant="outline" onClick={handleDisconnectPOS} disabled={isLoading}>
                    <Wifi className="mr-2 h-4 w-4" />
                    Verbindung trennen
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wifi className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium mb-2">Kein POS-System verbunden</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Verbinden Sie Ihr Kassensystem für automatische Synchronisation
                  </p>
                  <Button>
                    POS-System verbinden
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <Card>
            <CardHeader>
              <CardTitle>Abrechnung & Plan</CardTitle>
              <CardDescription>
                Verwalten Sie Ihr Abonnement und Zahlungsmethoden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Aktueller Plan</p>
                  <p className="text-sm text-gray-500">
                    {initialRestaurant.plan === 'TRIAL' ? 'Kostenlose Testversion' :
                     initialRestaurant.plan === 'STANDARD' ? 'Standard Plan' :
                     initialRestaurant.plan === 'PREMIUM' ? 'Premium Plan' : initialRestaurant.plan}
                  </p>
                </div>
                <Badge variant="secondary">
                  {initialRestaurant.plan}
                </Badge>
              </div>
              
              {initialRestaurant.plan === 'TRIAL' && initialRestaurant.trialEndsAt && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Testversion läuft aus</p>
                      <p className="text-sm text-blue-700">
                        Ihre kostenlose Testversion endet am{' '}
                        {new Date(initialRestaurant.trialEndsAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button onClick={() => router.push('/dashboard/billing')}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Plan upgraden
                </Button>
                <Button variant="outline">
                  Zahlungsmethode verwalten
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Design & Aussehen Tab */}
        {activeTab === 'design' && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Palette className="inline-block h-5 w-5 mr-2" />
                Design & Aussehen
              </CardTitle>
              <CardDescription>
                Passen Sie das Erscheinungsbild Ihres Restaurants an
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Primärfarbe</Label>
                <div className="flex gap-2">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={restaurant.primaryColor || '#3b82f6'}
                    onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={restaurant.primaryColor || '#3b82f6'}
                    onChange={(e) => setRestaurant({ ...restaurant, primaryColor: e.target.value })}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Diese Farbe wird in der Gäste-Ansicht verwendet
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {restaurant.logo ? (
                    <img src={restaurant.logo} alt="Logo" className="h-16 w-16 object-contain border rounded" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center">
                      <Store className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <Button variant="outline">Logo hochladen</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Cover-Bild</Label>
                <div className="space-y-2">
                  {restaurant.coverImage ? (
                    <img src={restaurant.coverImage} alt="Cover" className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Monitor className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <Button variant="outline" className="w-full">Cover-Bild hochladen</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <Label>Dashboard-Theme</Label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <button
                      onClick={() => setRestaurant({ ...restaurant, dashboardTheme: 'light' })}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        restaurant.dashboardTheme !== 'dark' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Sun className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Hell</p>
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => setRestaurant({ ...restaurant, dashboardTheme: 'dark' })}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        restaurant.dashboardTheme === 'dark' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Moon className="h-8 w-8 mx-auto mb-2" />
                      <p className="font-medium">Dunkel</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Änderungen speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sprache & Region Tab */}
        {activeTab === 'language' && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Languages className="inline-block h-5 w-5 mr-2" />
                Sprache & Region
              </CardTitle>
              <CardDescription>
                Konfigurieren Sie Sprache, Währung und regionale Einstellungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="language">Sprache</Label>
                  <select
                    id="language"
                    className="w-full p-2 border rounded-md"
                    value={restaurant.language || 'de'}
                    onChange={(e) => setRestaurant({ ...restaurant, language: e.target.value })}
                  >
                    <option value="de">Deutsch</option>
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                    <option value="fr">Français</option>
                    <option value="it">Italiano</option>
                    <option value="es">Español</option>
                    <option value="tr">Türkçe</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Währung</Label>
                  <select
                    id="currency"
                    className="w-full p-2 border rounded-md"
                    value={restaurant.currency || 'EUR'}
                    onChange={(e) => setRestaurant({ ...restaurant, currency: e.target.value })}
                  >
                    <option value="EUR">€ Euro</option>
                    <option value="CHF">CHF Schweizer Franken</option>
                    <option value="USD">$ US Dollar</option>
                    <option value="GBP">£ Britisches Pfund</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Zeitzone</Label>
                  <select
                    id="timezone"
                    className="w-full p-2 border rounded-md"
                    value={restaurant.timezone || 'Europe/Berlin'}
                    onChange={(e) => setRestaurant({ ...restaurant, timezone: e.target.value })}
                  >
                    <option value="Europe/Berlin">Berlin (UTC+1)</option>
                    <option value="Europe/Zurich">Zürich (UTC+1)</option>
                    <option value="Europe/Vienna">Wien (UTC+1)</option>
                    <option value="Europe/London">London (UTC+0)</option>
                    <option value="Europe/Paris">Paris (UTC+1)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Datumsformat</Label>
                  <select
                    id="dateFormat"
                    className="w-full p-2 border rounded-md"
                    value={restaurant.dateFormat || 'DD.MM.YYYY'}
                    onChange={(e) => setRestaurant({ ...restaurant, dateFormat: e.target.value })}
                  >
                    <option value="DD.MM.YYYY">31.12.2024</option>
                    <option value="MM/DD/YYYY">12/31/2024</option>
                    <option value="YYYY-MM-DD">2024-12-31</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Übersetzungen</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mehrsprachige Speisekarte</Label>
                      <p className="text-sm text-gray-500">
                        Ermöglicht Gästen die Auswahl ihrer bevorzugten Sprache
                      </p>
                    </div>
                    <Switch
                      checked={restaurant.multiLanguageMenu || false}
                      onCheckedChange={(checked) => 
                        setRestaurant({ ...restaurant, multiLanguageMenu: checked })
                      }
                    />
                  </div>
                  
                  {restaurant.multiLanguageMenu && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Verfügbare Sprachen:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Deutsch', 'English', 'Français', 'Italiano', 'Türkçe'].map(lang => (
                          <Badge key={lang} variant="secondary">{lang}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Änderungen speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sicherheit Tab */}
        {activeTab === 'security' && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Shield className="inline-block h-5 w-5 mr-2" />
                Sicherheit
              </CardTitle>
              <CardDescription>
                Verwalten Sie Sicherheitseinstellungen und Zugriffskontrollen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Zwei-Faktor-Authentifizierung (2FA)</h3>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Smartphone className="h-5 w-5 text-gray-600 mt-1" />
                    <div>
                      <p className="font-medium">2FA aktivieren</p>
                      <p className="text-sm text-gray-500">
                        Zusätzliche Sicherheit mit Authenticator-App
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={restaurant.twoFactorEnabled || false}
                    onCheckedChange={(checked) => 
                      setRestaurant({ ...restaurant, twoFactorEnabled: checked })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Sitzungsverwaltung</h3>
                <div className="space-y-2">
                  <Label>Automatische Abmeldung nach Inaktivität</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={restaurant.sessionTimeout || '30'}
                    onChange={(e) => setRestaurant({ ...restaurant, sessionTimeout: e.target.value })}
                  >
                    <option value="15">15 Minuten</option>
                    <option value="30">30 Minuten</option>
                    <option value="60">1 Stunde</option>
                    <option value="120">2 Stunden</option>
                    <option value="never">Nie</option>
                  </select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">Zugriffsrechte</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mitarbeiter können Menü bearbeiten</p>
                      <p className="text-sm text-gray-500">
                        Erlaubt Mitarbeitern Änderungen an der Speisekarte
                      </p>
                    </div>
                    <Switch
                      checked={restaurant.staffCanEditMenu || false}
                      onCheckedChange={(checked) => 
                        setRestaurant({ ...restaurant, staffCanEditMenu: checked })
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Mitarbeiter können Bestellungen stornieren</p>
                      <p className="text-sm text-gray-500">
                        Erlaubt Mitarbeitern Bestellungen zu stornieren
                      </p>
                    </div>
                    <Switch
                      checked={restaurant.staffCanCancelOrders || false}
                      onCheckedChange={(checked) => 
                        setRestaurant({ ...restaurant, staffCanCancelOrders: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium">API-Zugriff</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">API-Schlüssel</p>
                      <p className="text-sm text-gray-500">
                        Für externe Integrationen
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Key className="mr-2 h-4 w-4" />
                      Schlüssel generieren
                    </Button>
                  </div>
                  
                  {restaurant.apiKey && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <code className="text-sm">
                          {restaurant.showApiKey ? restaurant.apiKey : '••••••••••••••••'}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => 
                            setRestaurant({ ...restaurant, showApiKey: !restaurant.showApiKey })
                          }
                        >
                          {restaurant.showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <Button disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Änderungen speichern
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}