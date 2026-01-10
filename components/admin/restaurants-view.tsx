'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Store,
  Mail,
  Phone,
  Calendar,
  Euro,
  Plus,
  UserPlus,
  Settings,
  LogIn
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { de } from 'date-fns/locale'

interface Restaurant {
  id: string
  name: string
  slug: string
  email?: string | null
  phone?: string | null
  status: string
  plan: string
  createdAt: Date
  owner: {
    id: string
    name: string | null
    email: string
  }
  monthlyRevenue: number
  totalOrders: number
}

interface AdminRestaurantsViewProps {
  restaurants: Restaurant[]
}

export default function AdminRestaurantsView({ restaurants }: AdminRestaurantsViewProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    phone: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  const filteredRestaurants = restaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.owner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (restaurant.owner.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  )

  const handleStatusChange = async (restaurantId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurantId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success(`Status erfolgreich geändert zu: ${newStatus}`)
        router.refresh()
      } else {
        throw new Error('Fehler beim Ändern des Status')
      }
    } catch (error) {
      toast.error('Fehler beim Ändern des Status')
    }
  }

  const handleCreateRestaurant = async () => {
    if (!newRestaurant.name || !newRestaurant.ownerEmail || !newRestaurant.ownerName || !newRestaurant.ownerPassword) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus')
      return
    }
    
    if (newRestaurant.ownerPassword.length < 8) {
      toast.error('Das Passwort muss mindestens 8 Zeichen lang sein')
      return
    }
    
    // Validiere E-Mail-Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newRestaurant.ownerEmail)) {
      toast.error('Bitte geben Sie eine gültige E-Mail-Adresse ein')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/admin/restaurants/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant)
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Restaurant erfolgreich angelegt!')
        setCreateDialogOpen(false)
        setNewRestaurant({
          name: '',
          ownerName: '',
          ownerEmail: '',
          ownerPassword: '',
          phone: ''
        })
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Fehler beim Anlegen')
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Anlegen des Restaurants')
    } finally {
      setIsCreating(false)
    }
  }

  const handleOnboard = (restaurant: Restaurant) => {
    // Öffne Onboarding-Seite für dieses Restaurant
    router.push(`/admin/restaurants/${restaurant.id}/onboard`)
  }

  const handleLoginAs = async (restaurant: any) => {
    try {
      const response = await fetch(`/api/admin/login-as`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: restaurant.owner.id })
      })

      if (response.ok) {
        toast.success('Anmeldung erfolgreich!')
        window.location.href = '/dashboard'
      } else {
        throw new Error('Fehler beim Anmelden')
      }
    } catch (error) {
      toast.error('Fehler beim Anmelden als Restaurant-Besitzer')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Aktiv' },
      PENDING: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Ausstehend' },
      TRIAL: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Trial' },
      SUSPENDED: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Gesperrt' },
      CANCELLED: { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: 'Gekündigt' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      FREE: { color: 'bg-gray-700 text-gray-300', label: 'Free' },
      TRIAL: { color: 'bg-blue-700 text-blue-300', label: 'Trial' },
      STANDARD: { color: 'bg-purple-700 text-purple-300', label: 'Standard' },
      PREMIUM: { color: 'bg-orange-700 text-orange-300', label: 'Premium' }
    }
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.FREE
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Restaurants verwalten</h1>
          <p className="text-gray-400">Alle registrierten Restaurants auf der Plattform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setCreateDialogOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Restaurant anlegen
          </Button>
          <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Suche nach Restaurant oder Besitzer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-96 border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>
      </div>

      {/* Statistik-Übersicht */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gesamt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{restaurants.length}</div>
            <p className="text-xs text-gray-500 mt-1">Restaurants</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Aktiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {restaurants.filter(r => r.status === 'ACTIVE').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Zahlende Kunden</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Trial/Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {restaurants.filter(r => r.status === 'TRIAL' || r.status === 'PENDING').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Testphase/Onboarding</p>
          </CardContent>
        </Card>
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Monatsumsatz</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {restaurants.reduce((sum, r) => sum + r.monthlyRevenue, 0).toLocaleString()} €
            </div>
            <p className="text-xs text-gray-500 mt-1">Gesamt Plattform</p>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant-Tabelle */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-300">Restaurant</TableHead>
                <TableHead className="text-gray-300">Besitzer</TableHead>
                <TableHead className="text-gray-300">Plan</TableHead>
                <TableHead className="text-gray-300">Status</TableHead>
                <TableHead className="text-gray-300">Monatsumsatz</TableHead>
                <TableHead className="text-gray-300">Erstellt</TableHead>
                <TableHead className="text-right text-gray-300">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRestaurants.map((restaurant) => (
                <TableRow key={restaurant.id} className="border-gray-700 hover:bg-gray-700/30">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{restaurant.name}</p>
                      <p className="text-xs text-gray-500">{restaurant.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-gray-300">{restaurant.owner.name || 'Nicht angegeben'}</p>
                      <p className="text-xs text-gray-500">{restaurant.owner.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPlanBadge(restaurant.plan)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(restaurant.status)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{restaurant.monthlyRevenue.toLocaleString()} €</p>
                      <p className="text-xs text-gray-500">{restaurant.totalOrders} Bestellungen</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-400">
                      {formatDistanceToNow(new Date(restaurant.createdAt), { 
                        addSuffix: true, 
                        locale: de 
                      })}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                        <DropdownMenuLabel className="text-gray-300">Aktionen</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        
                        <DropdownMenuItem 
                          className="text-gray-300 hover:text-white hover:bg-gray-700"
                          onClick={() => {
                            setSelectedRestaurant(restaurant)
                            setDetailsOpen(true)
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details anzeigen
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                          className="text-green-500 hover:text-green-400 hover:bg-gray-700"
                          onClick={() => router.push(`/admin/restaurants/${restaurant.id}/settings`)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Komplett verwalten
                        </DropdownMenuItem>
                        
                        {restaurant.status === 'PENDING' && (
                          <DropdownMenuItem 
                            className="text-blue-500 hover:text-blue-400 hover:bg-gray-700"
                            onClick={() => handleOnboard(restaurant)}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Onboarding durchführen
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          className="text-purple-500 hover:text-purple-400 hover:bg-gray-700"
                          onClick={() => handleLoginAs(restaurant)}
                        >
                          <LogIn className="w-4 h-4 mr-2" />
                          Als Restaurant anmelden
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-gray-700" />
                        
                        {restaurant.status === 'ACTIVE' && (
                          <DropdownMenuItem 
                            className="text-yellow-500 hover:text-yellow-400 hover:bg-gray-700"
                            onClick={() => handleStatusChange(restaurant.id, 'SUSPENDED')}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Sperren
                          </DropdownMenuItem>
                        )}
                        {restaurant.status === 'SUSPENDED' && (
                          <DropdownMenuItem 
                            className="text-green-500 hover:text-green-400 hover:bg-gray-700"
                            onClick={() => handleStatusChange(restaurant.id, 'ACTIVE')}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Aktivieren
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          className="text-red-500 hover:text-red-400 hover:bg-gray-700"
                          onClick={() => handleStatusChange(restaurant.id, 'CANCELLED')}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restaurant anlegen Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Neues Restaurant anlegen</DialogTitle>
            <DialogDescription className="text-gray-400">
              Erstellen Sie ein neues Restaurant und den zugehörigen Besitzer-Account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="restaurant-name">Restaurant Name *</Label>
              <Input
                id="restaurant-name"
                value={newRestaurant.name}
                onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                placeholder="z.B. Pizza Roma"
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner-name">Besitzer Name *</Label>
                <Input
                  id="owner-name"
                  value={newRestaurant.ownerName}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerName: e.target.value })}
                  placeholder="Max Mustermann"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="owner-email">Besitzer E-Mail *</Label>
                <Input
                  id="owner-email"
                  type="email"
                  value={newRestaurant.ownerEmail}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerEmail: e.target.value })}
                  placeholder="besitzer@restaurant.de"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="owner-password">Passwort *</Label>
                <Input
                  id="owner-password"
                  type="password"
                  value={newRestaurant.ownerPassword}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, ownerPassword: e.target.value })}
                  placeholder="Min. 8 Zeichen"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefonnummer</Label>
                <Input
                  id="phone"
                  value={newRestaurant.phone}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })}
                  placeholder="+49 89 123456"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateRestaurant}
              disabled={isCreating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isCreating ? 'Erstelle...' : 'Restaurant anlegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details-Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Restaurant Details</DialogTitle>
            <DialogDescription className="text-gray-400">
              Vollständige Informationen über {selectedRestaurant?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedRestaurant && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Store className="w-4 h-4" />
                    <span className="text-sm">Name</span>
                  </div>
                  <p className="font-medium">{selectedRestaurant.name}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">E-Mail</span>
                  </div>
                  <p className="font-medium">{selectedRestaurant.email || selectedRestaurant.owner.email}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">Telefon</span>
                  </div>
                  <p className="font-medium">{selectedRestaurant.phone || 'Nicht angegeben'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Registriert am</span>
                  </div>
                  <p className="font-medium">
                    {new Date(selectedRestaurant.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-3">Statistiken</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <p className="text-sm text-gray-400">Monatsumsatz</p>
                    <p className="text-xl font-bold">{selectedRestaurant.monthlyRevenue.toLocaleString()} €</p>
                  </div>
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <p className="text-sm text-gray-400">Bestellungen</p>
                    <p className="text-xl font-bold">{selectedRestaurant.totalOrders}</p>
                  </div>
                  <div className="bg-gray-700/30 p-3 rounded-lg">
                    <p className="text-sm text-gray-400">Ø Bestellwert</p>
                    <p className="text-xl font-bold">
                      {selectedRestaurant.totalOrders > 0 
                        ? Math.round(selectedRestaurant.monthlyRevenue / selectedRestaurant.totalOrders) 
                        : 0} €
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-gray-700 pt-4">
                <h3 className="font-semibold mb-3">Schnellaktionen</h3>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleOnboard(selectedRestaurant)}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Onboarding
                  </Button>
                  <Button 
                    size="sm" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => handleLoginAs(selectedRestaurant)}
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Als Restaurant anmelden
                  </Button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailsOpen(false)} 
              className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
            >
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}