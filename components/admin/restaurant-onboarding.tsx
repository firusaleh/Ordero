'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { 
  ArrowLeft,
  CheckCircle,
  Store,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Settings,
  Menu,
  Table as TableIcon,
  Users,
  CreditCard,
  Save,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RestaurantOnboardingProps {
  restaurant: any
}

export default function RestaurantOnboarding({ restaurant }: RestaurantOnboardingProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  
  // Restaurant Basis-Daten
  const [restaurantData, setRestaurantData] = useState({
    name: restaurant.name || '',
    description: restaurant.description || '',
    cuisine: restaurant.cuisine || '',
    street: restaurant.street || '',
    city: restaurant.city || '',
    postalCode: restaurant.postalCode || '',
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    website: restaurant.website || ''
  })

  // Restaurant Einstellungen
  const [settings, setSettings] = useState({
    orderingEnabled: restaurant.settings?.orderingEnabled || false,
    requireTableNumber: restaurant.settings?.requireTableNumber || true,
    allowTakeaway: restaurant.settings?.allowTakeaway || false,
    allowDelivery: restaurant.settings?.allowDelivery || false,
    autoAcceptOrders: restaurant.settings?.autoAcceptOrders || false,
    acceptCash: restaurant.settings?.acceptCash || true,
    acceptCard: restaurant.settings?.acceptCard || false,
    acceptPaypal: restaurant.settings?.acceptPaypal || false,
    acceptStripe: restaurant.settings?.acceptStripe || false,
    taxRate: restaurant.settings?.taxRate || 19,
    includeTax: restaurant.settings?.includeTax || true
  })

  const handleSaveBasicInfo = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'basic', data: restaurantData })
      })

      if (response.ok) {
        toast.success('Grunddaten gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Grunddaten')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', data: settings })
      })

      if (response.ok) {
        toast.success('Einstellungen gespeichert')
      } else {
        throw new Error('Fehler beim Speichern')
      }
    } catch (error) {
      toast.error('Fehler beim Speichern der Einstellungen')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCompleteOnboarding = async () => {
    setIsSaving(true)
    try {
      // Speichere alle Daten
      await handleSaveBasicInfo()
      await handleSaveSettings()
      
      // Aktiviere Restaurant
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      })

      if (response.ok) {
        toast.success('Onboarding abgeschlossen! Restaurant ist jetzt aktiv.')
        router.push('/admin/restaurants')
      } else {
        throw new Error('Fehler beim Aktivieren')
      }
    } catch (error) {
      toast.error('Fehler beim Abschließen des Onboardings')
    } finally {
      setIsSaving(false)
    }
  }

  const getCompletionStatus = () => {
    const checks = {
      basicInfo: Boolean(restaurantData.name && restaurantData.street && restaurantData.city),
      contact: Boolean(restaurantData.phone && restaurantData.email),
      categories: restaurant.categories?.length > 0,
      menuItems: restaurant.menuItems?.length > 0,
      tables: restaurant.tables?.length > 0,
      payment: Boolean(settings.acceptCash || settings.acceptCard || settings.acceptStripe)
    }

    const completed = Object.values(checks).filter(Boolean).length
    const total = Object.keys(checks).length
    const percentage = Math.round((completed / total) * 100)

    return { checks, completed, total, percentage }
  }

  const completionStatus = getCompletionStatus()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/restaurants')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Restaurant Onboarding</h1>
            <p className="text-gray-400">{restaurant.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={restaurant.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {restaurant.status}
          </Badge>
          <Button
            onClick={handleCompleteOnboarding}
            disabled={isSaving || completionStatus.percentage < 50}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Onboarding abschließen & Aktivieren
          </Button>
        </div>
      </div>

      {/* Fortschritt */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Onboarding-Fortschritt</CardTitle>
          <CardDescription className="text-gray-400">
            {completionStatus.completed} von {completionStatus.total} Schritten abgeschlossen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${completionStatus.percentage}%` }}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              {Object.entries(completionStatus.checks).map(([key, completed]) => (
                <div key={key} className="flex items-center gap-2">
                  {completed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className={completed ? 'text-gray-300' : 'text-gray-500'}>
                    {key === 'basicInfo' && 'Grunddaten'}
                    {key === 'contact' && 'Kontakt'}
                    {key === 'categories' && 'Kategorien'}
                    {key === 'menuItems' && 'Speisekarte'}
                    {key === 'tables' && 'Tische'}
                    {key === 'payment' && 'Zahlungen'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs für verschiedene Bereiche */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700">
            <Store className="w-4 h-4 mr-2" />
            Grunddaten
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-gray-700">
            <Phone className="w-4 h-4 mr-2" />
            Kontakt
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-gray-700">
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </TabsTrigger>
          <TabsTrigger value="menu" className="data-[state=active]:bg-gray-700">
            <Menu className="w-4 h-4 mr-2" />
            Speisekarte
          </TabsTrigger>
          <TabsTrigger value="tables" className="data-[state=active]:bg-gray-700">
            <TableIcon className="w-4 h-4 mr-2" />
            Tische
          </TabsTrigger>
        </TabsList>

        {/* Grunddaten Tab */}
        <TabsContent value="basic">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Restaurant Grunddaten</CardTitle>
              <CardDescription className="text-gray-400">
                Grundlegende Informationen über das Restaurant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Restaurant Name</Label>
                  <Input
                    id="name"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cuisine">Küche/Art</Label>
                  <Input
                    id="cuisine"
                    value={restaurantData.cuisine}
                    onChange={(e) => setRestaurantData({ ...restaurantData, cuisine: e.target.value })}
                    placeholder="z.B. Italienisch, Asiatisch, etc."
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={restaurantData.description}
                  onChange={(e) => setRestaurantData({ ...restaurantData, description: e.target.value })}
                  rows={3}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="street">Straße & Hausnummer</Label>
                  <Input
                    id="street"
                    value={restaurantData.street}
                    onChange={(e) => setRestaurantData({ ...restaurantData, street: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    value={restaurantData.postalCode}
                    onChange={(e) => setRestaurantData({ ...restaurantData, postalCode: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="city">Stadt</Label>
                <Input
                  id="city"
                  value={restaurantData.city}
                  onChange={(e) => setRestaurantData({ ...restaurantData, city: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Button onClick={handleSaveBasicInfo} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Grunddaten speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kontakt Tab */}
        <TabsContent value="contact">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Kontaktdaten</CardTitle>
              <CardDescription className="text-gray-400">
                Kontaktmöglichkeiten für Kunden
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={restaurantData.phone}
                    onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={restaurantData.email}
                    onChange={(e) => setRestaurantData({ ...restaurantData, email: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website (optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={restaurantData.website}
                  onChange={(e) => setRestaurantData({ ...restaurantData, website: e.target.value })}
                  placeholder="https://"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <Button onClick={handleSaveBasicInfo} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Kontaktdaten speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Einstellungen Tab */}
        <TabsContent value="settings">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Restaurant Einstellungen</CardTitle>
              <CardDescription className="text-gray-400">
                Konfiguration für Bestellungen und Zahlungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bestelleinstellungen */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bestellungen</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="orderingEnabled">Online-Bestellungen aktiviert</Label>
                      <p className="text-sm text-gray-500">Gäste können über die App bestellen</p>
                    </div>
                    <Switch
                      id="orderingEnabled"
                      checked={settings.orderingEnabled}
                      onCheckedChange={(checked) => setSettings({ ...settings, orderingEnabled: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="requireTableNumber">Tischnummer erforderlich</Label>
                      <p className="text-sm text-gray-500">Gäste müssen eine Tischnummer angeben</p>
                    </div>
                    <Switch
                      id="requireTableNumber"
                      checked={settings.requireTableNumber}
                      onCheckedChange={(checked) => setSettings({ ...settings, requireTableNumber: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoAcceptOrders">Bestellungen automatisch annehmen</Label>
                      <p className="text-sm text-gray-500">Neue Bestellungen werden automatisch bestätigt</p>
                    </div>
                    <Switch
                      id="autoAcceptOrders"
                      checked={settings.autoAcceptOrders}
                      onCheckedChange={(checked) => setSettings({ ...settings, autoAcceptOrders: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Zahlungsmethoden */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Zahlungsmethoden</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="acceptCash">Barzahlung</Label>
                    <Switch
                      id="acceptCash"
                      checked={settings.acceptCash}
                      onCheckedChange={(checked) => setSettings({ ...settings, acceptCash: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="acceptCard">Kartenzahlung</Label>
                    <Switch
                      id="acceptCard"
                      checked={settings.acceptCard}
                      onCheckedChange={(checked) => setSettings({ ...settings, acceptCard: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="acceptStripe">Stripe Online</Label>
                    <Switch
                      id="acceptStripe"
                      checked={settings.acceptStripe}
                      onCheckedChange={(checked) => setSettings({ ...settings, acceptStripe: checked })}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="acceptPaypal">PayPal</Label>
                    <Switch
                      id="acceptPaypal"
                      checked={settings.acceptPaypal}
                      onCheckedChange={(checked) => setSettings({ ...settings, acceptPaypal: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Steuern */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Steuern</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="taxRate">MwSt-Satz (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={settings.taxRate}
                      onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) })}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeTax">Preise inkl. MwSt</Label>
                    <Switch
                      id="includeTax"
                      checked={settings.includeTax}
                      onCheckedChange={(checked) => setSettings({ ...settings, includeTax: checked })}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleSaveSettings} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Speisekarte Tab */}
        <TabsContent value="menu">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Speisekarte</CardTitle>
              <CardDescription className="text-gray-400">
                {restaurant.categories?.length || 0} Kategorien • {restaurant.menuItems?.length || 0} Gerichte
              </CardDescription>
            </CardHeader>
            <CardContent>
              {restaurant.categories?.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-gray-300">Kategorien:</p>
                  <div className="flex flex-wrap gap-2">
                    {restaurant.categories.map((cat: any) => (
                      <Badge key={cat.id} variant="secondary">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Die Speisekarte kann vom Restaurant-Besitzer im Dashboard verwaltet werden.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Menu className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Noch keine Kategorien angelegt</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Der Restaurant-Besitzer kann die Speisekarte im Dashboard einrichten.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tische Tab */}
        <TabsContent value="tables">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Tische & QR-Codes</CardTitle>
              <CardDescription className="text-gray-400">
                {restaurant.tables?.length || 0} Tische angelegt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {restaurant.tables?.length > 0 ? (
                <div>
                  <p className="text-gray-300 mb-4">{restaurant.tables.length} Tische sind eingerichtet.</p>
                  <p className="text-sm text-gray-500">
                    Weitere Tische und QR-Codes können im Restaurant-Dashboard verwaltet werden.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TableIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Noch keine Tische angelegt</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Der Restaurant-Besitzer kann Tische und QR-Codes im Dashboard einrichten.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}