'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Store, 
  Menu,
  QrCode,
  Clock,
  CreditCard,
  Palette,
  Users,
  Settings,
  Rocket,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import AdminBasicInfo from './settings/admin-basic-info'
import AdminMenuManager from './settings/admin-menu-manager'
import AdminTableManager from './settings/admin-table-manager'
import { OpeningHoursManager } from '@/components/dashboard/opening-hours'
import PaymentMethods from '@/components/dashboard/payment-methods'
import RestaurantDesign from '@/components/dashboard/restaurant-design'
import AdminStaffManager from './settings/admin-staff-manager'

interface RestaurantSettings {
  openingHours?: any
  acceptCash?: boolean
  acceptCard?: boolean
  acceptMobile?: boolean
  acceptOnline?: boolean
  minimumOrder?: number
  serviceFee?: number
  tipOptions?: number[]
  bankDetails?: any
  stripePublicKey?: string
  paypalEmail?: string
  orderingEnabled?: boolean
}

interface RestaurantOwner {
  id: string
  name?: string | null
  email: string
}

interface Restaurant {
  id: string
  name: string
  description?: string | null
  phone?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
  plan?: string | null
  logo?: string | null
  coverImage?: string | null
  primaryColor?: string | null
  secondaryColor?: string | null
  fontFamily?: string | null
  customCss?: string | null
  createdAt: Date | string
  trialEndsAt?: Date | string | null
  settings?: RestaurantSettings | null
  owner?: RestaurantOwner | null
  _count: {
    orders: number
    menuItems: number
    tables: number
    categories: number
  }
}

interface AdminRestaurantSettingsProps {
  restaurant: Restaurant
}

export default function AdminRestaurantSettings({ restaurant }: AdminRestaurantSettingsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')

  // Berechne Setup-Status
  const setupChecks = {
    basicInfo: Boolean(restaurant.name && restaurant.description && restaurant.phone),
    address: Boolean(restaurant.street && restaurant.city && restaurant.postalCode),
    menu: restaurant._count.menuItems >= 5 && restaurant._count.categories > 0,
    tables: restaurant._count.tables > 0,
    openingHours: Boolean(restaurant.settings?.openingHours),
    paymentMethods: Boolean(restaurant.settings?.acceptCash || restaurant.settings?.acceptCard),
    design: Boolean(restaurant.logo || restaurant.primaryColor),
    staff: Boolean(restaurant.owner)
  }

  const setupComplete = Object.values(setupChecks).every(check => check === true)
  const setupProgress = Math.round(
    (Object.values(setupChecks).filter(Boolean).length / Object.keys(setupChecks).length) * 100
  )

  const handleActivateRestaurant = async () => {
    if (!setupComplete) {
      toast.error('Bitte vervollständigen Sie zuerst alle Einrichtungsschritte')
      return
    }

    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.id}/activate`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Restaurant wurde erfolgreich aktiviert!')
        router.refresh()
      } else {
        throw new Error('Aktivierung fehlgeschlagen')
      }
    } catch (error) {
      toast.error('Fehler beim Aktivieren des Restaurants')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/restaurants')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{restaurant.name} - Admin Verwaltung</h1>
            <p className="text-gray-600">Restaurant ID: {restaurant.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={restaurant.status === 'ACTIVE' ? 'default' : 'secondary'}>
            {restaurant.status}
          </Badge>
          {restaurant.plan && (
            <Badge variant="outline">{restaurant.plan}</Badge>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview">
            <Store className="h-4 w-4 mr-2" />
            Übersicht
          </TabsTrigger>
          <TabsTrigger value="basic">
            <Settings className="h-4 w-4 mr-2" />
            Grunddaten
          </TabsTrigger>
          <TabsTrigger value="menu">
            <Menu className="h-4 w-4 mr-2" />
            Speisekarte
          </TabsTrigger>
          <TabsTrigger value="tables">
            <QrCode className="h-4 w-4 mr-2" />
            Tische
          </TabsTrigger>
          <TabsTrigger value="hours">
            <Clock className="h-4 w-4 mr-2" />
            Öffnungszeiten
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Zahlung
          </TabsTrigger>
          <TabsTrigger value="design">
            <Palette className="h-4 w-4 mr-2" />
            Design
          </TabsTrigger>
          <TabsTrigger value="staff">
            <Users className="h-4 w-4 mr-2" />
            Personal
          </TabsTrigger>
        </TabsList>

        {/* Übersicht Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6">
            {/* Setup Status */}
            <Card>
              <CardHeader>
                <CardTitle>Einrichtungsstatus</CardTitle>
                <CardDescription>
                  Fortschritt der Restaurant-Einrichtung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{setupProgress}%</div>
                      <p className="text-sm text-gray-500">
                        {Object.values(setupChecks).filter(Boolean).length} von {Object.keys(setupChecks).length} Schritten abgeschlossen
                      </p>
                    </div>
                    <Button
                      size="lg"
                      disabled={!setupComplete || restaurant.status === 'ACTIVE'}
                      onClick={handleActivateRestaurant}
                      className={setupComplete ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <Rocket className="w-4 h-4 mr-2" />
                      {restaurant.status === 'ACTIVE' ? 'Bereits aktiv' : 'Restaurant aktivieren'}
                    </Button>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Einrichtungs-Checkliste</h3>
                    <div className="grid gap-2">
                      {Object.entries(setupChecks).map(([key, completed]) => (
                        <div key={key} className="flex items-center gap-2">
                          {completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className={completed ? 'text-green-700' : 'text-gray-700'}>
                            {key === 'basicInfo' && 'Grundinformationen'}
                            {key === 'address' && 'Adresse'}
                            {key === 'menu' && 'Speisekarte (min. 5 Artikel)'}
                            {key === 'tables' && 'Tische/QR-Codes'}
                            {key === 'openingHours' && 'Öffnungszeiten'}
                            {key === 'paymentMethods' && 'Zahlungsmethoden'}
                            {key === 'design' && 'Design & Logo'}
                            {key === 'staff' && 'Personal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Bestellungen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant._count.orders}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Menü-Artikel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant._count.menuItems}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tische</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant._count.tables}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Kategorien</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{restaurant._count.categories}</div>
                </CardContent>
              </Card>
            </div>

            {/* Owner Info */}
            <Card>
              <CardHeader>
                <CardTitle>Inhaber-Informationen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div>
                    <span className="font-medium">Name:</span> {restaurant.owner?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">E-Mail:</span> {restaurant.owner?.email}
                  </div>
                  <div>
                    <span className="font-medium">Erstellt am:</span> {new Date(restaurant.createdAt).toLocaleDateString('de-DE')}
                  </div>
                  <div>
                    <span className="font-medium">Plan:</span> {restaurant.plan || 'TRIAL'}
                  </div>
                  {restaurant.trialEndsAt && (
                    <div>
                      <span className="font-medium">Trial endet am:</span> {new Date(restaurant.trialEndsAt).toLocaleDateString('de-DE')}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Grunddaten Tab */}
        <TabsContent value="basic">
          <AdminBasicInfo restaurantId={restaurant.id} />
        </TabsContent>

        {/* Speisekarte Tab */}
        <TabsContent value="menu">
          <AdminMenuManager restaurantId={restaurant.id} />
        </TabsContent>

        {/* Tische Tab */}
        <TabsContent value="tables">
          <AdminTableManager restaurantId={restaurant.id} />
        </TabsContent>

        {/* Öffnungszeiten Tab */}
        <TabsContent value="hours">
          <OpeningHoursManager 
            restaurantId={restaurant.id}
            initialData={restaurant.settings?.openingHours}
          />
        </TabsContent>

        {/* Zahlungsmethoden Tab */}
        <TabsContent value="payment">
          <PaymentMethods 
            restaurantId={restaurant.id}
            initialData={{
              acceptCash: restaurant.settings?.acceptCash ?? true,
              acceptCard: restaurant.settings?.acceptCard ?? false,
              acceptMobile: restaurant.settings?.acceptMobile ?? false,
              acceptOnline: restaurant.settings?.acceptOnline ?? false,
              minimumOrder: restaurant.settings?.minimumOrder || 0,
              serviceFee: restaurant.settings?.serviceFee || 0,
              tipOptions: restaurant.settings?.tipOptions || [5, 10, 15, 20],
              bankDetails: restaurant.settings?.bankDetails,
              stripePublicKey: restaurant.settings?.stripePublicKey,
              paypalEmail: restaurant.settings?.paypalEmail
            }}
          />
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design">
          <RestaurantDesign 
            restaurantId={restaurant.id}
            initialData={{
              logo: restaurant.logo || undefined,
              coverImage: restaurant.coverImage || undefined,
              primaryColor: restaurant.primaryColor || '#3B82F6',
              secondaryColor: '#1E40AF',
              fontFamily: 'inter',
              customCss: undefined
            }}
          />
        </TabsContent>

        {/* Personal Tab */}
        <TabsContent value="staff">
          <AdminStaffManager restaurantId={restaurant.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}