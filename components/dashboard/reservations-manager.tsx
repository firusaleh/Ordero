"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { 
  CalendarDays, 
  Clock, 
  Users, 
  Phone, 
  Mail, 
  Search, 
  Filter,
  CheckCircle, 
  XCircle, 
  Clock3,
  ChefHat,
  Package,
  Bell,
  MessageSquare,
  MoreHorizontal,
  Calendar,
  TrendingUp,
  Package2,
  UserCheck,
  Timer,
  AlertCircle
} from "lucide-react"
import { formatDistanceToNow, format, isToday, isTomorrow } from "date-fns"
import { de, ar, enUS } from "date-fns/locale"
import { useLanguage } from "@/contexts/language-context"
import { useToast } from "@/hooks/use-toast"
import LoadingSpinner from "@/components/shared/loading-spinner"

interface Reservation {
  id: string
  restaurantId: string
  tableId?: string
  table?: {
    id: string
    number: string
    seats: number
  }
  customerName: string
  customerEmail: string
  customerPhone: string
  numberOfGuests: number
  reservationDate: Date
  reservationTime: string
  duration: number
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW"
  confirmationToken?: string
  notes?: string
  specialRequests?: string
  createdAt: Date
  updatedAt: Date
}

interface PreOrder {
  id: string
  restaurantId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  pickupTime: Date
  orderType: "PICKUP" | "DINE_IN"
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
  subtotal: number
  tax: number
  serviceFee: number
  total: number
  paymentMethod?: "CASH" | "CARD" | "ONLINE"
  paymentStatus?: "PENDING" | "PAID" | "FAILED"
  notes?: string
  items: Array<{
    id: string
    name: string
    quantity: number
    unitPrice: number
    totalPrice: number
    variant?: string
    extras: Array<{ name: string; price: number }>
    notes?: string
  }>
  createdAt: Date
  updatedAt: Date
}

interface ReservationsManagerProps {
  restaurantId: string
}

export function ReservationsManager({ restaurantId }: ReservationsManagerProps) {
  const { t, language } = useLanguage()
  const { toast } = useToast()
  
  // State
  const [activeTab, setActiveTab] = useState<"reservations" | "preorders">("reservations")
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [preorders, setPreorders] = useState<PreOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [dateFilter, setDateFilter] = useState<string>("ALL")
  
  // Selected items for detailed view
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [selectedPreorder, setSelectedPreorder] = useState<PreOrder | null>(null)
  
  // Statistics
  const [stats, setStats] = useState({
    todayReservations: 0,
    upcomingReservations: 0,
    todayPreorders: 0,
    upcomingPreorders: 0,
    pendingReservations: 0,
    pendingPreorders: 0
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [restaurantId])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadReservations(),
        loadPreorders()
      ])
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load reservations and preorders",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadReservations = async () => {
    try {
      const response = await fetch(`/api/dashboard/reservations?restaurantId=${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        const reservationsData = data.reservations.map((res: any) => ({
          ...res,
          reservationDate: new Date(res.reservationDate),
          createdAt: new Date(res.createdAt),
          updatedAt: new Date(res.updatedAt)
        }))
        setReservations(reservationsData)
        calculateReservationStats(reservationsData)
      }
    } catch (error) {
      console.error("Error loading reservations:", error)
    }
  }

  const loadPreorders = async () => {
    try {
      const response = await fetch(`/api/dashboard/preorders?restaurantId=${restaurantId}`)
      if (response.ok) {
        const data = await response.json()
        const preordersData = data.preorders.map((order: any) => ({
          ...order,
          pickupTime: new Date(order.pickupTime),
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt)
        }))
        setPreorders(preordersData)
        calculatePreorderStats(preordersData)
      }
    } catch (error) {
      console.error("Error loading preorders:", error)
    }
  }

  const calculateReservationStats = (reservations: Reservation[]) => {
    const today = new Date()
    const todayReservations = reservations.filter(res => isToday(res.reservationDate))
    const upcomingReservations = reservations.filter(res => 
      res.reservationDate > today && res.status !== "CANCELLED"
    )
    const pendingReservations = reservations.filter(res => res.status === "PENDING")

    setStats(prev => ({
      ...prev,
      todayReservations: todayReservations.length,
      upcomingReservations: upcomingReservations.length,
      pendingReservations: pendingReservations.length
    }))
  }

  const calculatePreorderStats = (preorders: PreOrder[]) => {
    const today = new Date()
    const todayPreorders = preorders.filter(order => isToday(order.pickupTime))
    const upcomingPreorders = preorders.filter(order => 
      order.pickupTime > today && order.status !== "CANCELLED"
    )
    const pendingPreorders = preorders.filter(order => order.status === "PENDING")

    setStats(prev => ({
      ...prev,
      todayPreorders: todayPreorders.length,
      upcomingPreorders: upcomingPreorders.length,
      pendingPreorders: pendingPreorders.length
    }))
  }

  // Date/Time formatting
  const getLocale = () => {
    switch(language) {
      case 'ar': return ar
      case 'en': return enUS
      default: return de
    }
  }

  const formatDate = (date: Date) => {
    if (isToday(date)) return t('reservations.today')
    if (isTomorrow(date)) return t('reservations.tomorrow')
    return format(date, 'PPP', { locale: getLocale() })
  }

  const formatTime = (date: Date) => {
    return format(date, 'HH:mm')
  }

  // Status management
  const updateReservationStatus = async (reservationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadReservations()
        toast({
          title: t('reservations.updated'),
          description: t('reservations.statusChanged')
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reservation status",
        variant: "destructive"
      })
    }
  }

  const updatePreorderStatus = async (preorderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/preorders/${preorderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadPreorders()
        toast({
          title: t('preorders.updated'),
          description: t('preorders.statusChanged')
        })
      } else {
        throw new Error('Failed to update status')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preorder status",
        variant: "destructive"
      })
    }
  }

  // Send notification to customer
  const sendNotification = async (type: 'reservation' | 'preorder', id: string, message: string) => {
    try {
      const response = await fetch(`/api/dashboard/${type}s/${id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      })

      if (response.ok) {
        toast({
          title: t('notifications.sent'),
          description: t('notifications.customerNotified')
        })
      } else {
        throw new Error('Failed to send notification')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive"
      })
    }
  }

  // Filter functions
  const filteredReservations = reservations.filter(reservation => {
    const matchesSearch = 
      reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.customerPhone.includes(searchTerm)

    const matchesStatus = statusFilter === "ALL" || reservation.status === statusFilter

    const matchesDate = (() => {
      switch(dateFilter) {
        case "TODAY": return isToday(reservation.reservationDate)
        case "TOMORROW": return isTomorrow(reservation.reservationDate)
        case "WEEK": {
          const weekFromNow = new Date()
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          return reservation.reservationDate <= weekFromNow && reservation.reservationDate >= new Date()
        }
        default: return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  const filteredPreorders = preorders.filter(preorder => {
    const matchesSearch = 
      preorder.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preorder.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      preorder.customerPhone.includes(searchTerm)

    const matchesStatus = statusFilter === "ALL" || preorder.status === statusFilter

    const matchesDate = (() => {
      switch(dateFilter) {
        case "TODAY": return isToday(preorder.pickupTime)
        case "TOMORROW": return isTomorrow(preorder.pickupTime)
        case "WEEK": {
          const weekFromNow = new Date()
          weekFromNow.setDate(weekFromNow.getDate() + 7)
          return preorder.pickupTime <= weekFromNow && preorder.pickupTime >= new Date()
        }
        default: return true
      }
    })()

    return matchesSearch && matchesStatus && matchesDate
  })

  // Status badge component
  const StatusBadge = ({ status, type }: { status: string; type: 'reservation' | 'preorder' }) => {
    const getStatusConfig = () => {
      if (type === 'reservation') {
        return {
          PENDING: { label: t('reservations.status.pending'), variant: "secondary" as const, icon: Clock3 },
          CONFIRMED: { label: t('reservations.status.confirmed'), variant: "default" as const, icon: CheckCircle },
          CANCELLED: { label: t('reservations.status.cancelled'), variant: "destructive" as const, icon: XCircle },
          COMPLETED: { label: t('reservations.status.completed'), variant: "outline" as const, icon: UserCheck },
          NO_SHOW: { label: t('reservations.status.noShow'), variant: "destructive" as const, icon: AlertCircle }
        }[status] || { label: status, variant: "secondary" as const, icon: Clock3 }
      } else {
        return {
          PENDING: { label: t('preorders.status.pending'), variant: "secondary" as const, icon: Clock3 },
          CONFIRMED: { label: t('preorders.status.confirmed'), variant: "default" as const, icon: CheckCircle },
          PREPARING: { label: t('preorders.status.preparing'), variant: "default" as const, icon: ChefHat },
          READY: { label: t('preorders.status.ready'), variant: "default" as const, icon: Bell },
          COMPLETED: { label: t('preorders.status.completed'), variant: "outline" as const, icon: Package },
          CANCELLED: { label: t('preorders.status.cancelled'), variant: "destructive" as const, icon: XCircle }
        }[status] || { label: status, variant: "secondary" as const, icon: Clock3 }
      }
    }

    const config = getStatusConfig()
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  // Status action buttons
  const ReservationActions = ({ reservation }: { reservation: Reservation }) => {
    const getNextStatus = () => {
      switch(reservation.status) {
        case "PENDING": return "CONFIRMED"
        case "CONFIRMED": return "COMPLETED"
        default: return null
      }
    }

    const nextStatus = getNextStatus()

    if (reservation.status === "COMPLETED" || reservation.status === "CANCELLED" || reservation.status === "NO_SHOW") {
      return null
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {nextStatus && (
          <Button
            size="sm"
            onClick={() => updateReservationStatus(reservation.id, nextStatus)}
          >
            {nextStatus === "CONFIRMED" && t('reservations.actions.confirm')}
            {nextStatus === "COMPLETED" && t('reservations.actions.complete')}
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm(t('reservations.actions.cancelConfirm'))) {
              updateReservationStatus(reservation.id, "CANCELLED")
            }
          }}
        >
          {t('reservations.actions.cancel')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (confirm(t('reservations.actions.noShowConfirm'))) {
              updateReservationStatus(reservation.id, "NO_SHOW")
            }
          }}
        >
          {t('reservations.actions.noShow')}
        </Button>
      </div>
    )
  }

  const PreorderActions = ({ preorder }: { preorder: PreOrder }) => {
    const getNextStatus = () => {
      switch(preorder.status) {
        case "PENDING": return "CONFIRMED"
        case "CONFIRMED": return "PREPARING"
        case "PREPARING": return "READY"
        case "READY": return "COMPLETED"
        default: return null
      }
    }

    const nextStatus = getNextStatus()

    if (preorder.status === "COMPLETED" || preorder.status === "CANCELLED") {
      return null
    }

    return (
      <div className="flex gap-2 flex-wrap">
        {nextStatus && (
          <Button
            size="sm"
            onClick={() => updatePreorderStatus(preorder.id, nextStatus)}
          >
            {nextStatus === "CONFIRMED" && t('preorders.actions.confirm')}
            {nextStatus === "PREPARING" && t('preorders.actions.startPreparing')}
            {nextStatus === "READY" && t('preorders.actions.markReady')}
            {nextStatus === "COMPLETED" && t('preorders.actions.markCompleted')}
          </Button>
        )}
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (confirm(t('preorders.actions.cancelConfirm'))) {
              updatePreorderStatus(preorder.id, "CANCELLED")
            }
          }}
        >
          {t('preorders.actions.cancel')}
        </Button>
      </div>
    )
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 rtl:gap-x-reverse">
              <CalendarDays className="h-5 w-5" />
              {t('reservations.title')}
            </CardTitle>
            <CardDescription>
              {t('reservations.description')}
            </CardDescription>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                {t('reservations.stats.today')}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {stats.todayReservations}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">
                {t('reservations.stats.upcoming')}
              </span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {stats.upcomingReservations}
            </p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Package2 className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-900">
                {t('preorders.stats.today')}
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600 mt-1">
              {stats.todayPreorders}
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">
                {t('reservations.stats.pending')}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600 mt-1">
              {stats.pendingReservations + stats.pendingPreorders}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('reservations.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('reservations.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('reservations.filter.all')}</SelectItem>
              <SelectItem value="PENDING">{t('reservations.filter.pending')}</SelectItem>
              <SelectItem value="CONFIRMED">{t('reservations.filter.confirmed')}</SelectItem>
              <SelectItem value="PREPARING">{t('preorders.filter.preparing')}</SelectItem>
              <SelectItem value="READY">{t('preorders.filter.ready')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('reservations.filterDate')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t('reservations.filter.allDates')}</SelectItem>
              <SelectItem value="TODAY">{t('reservations.filter.today')}</SelectItem>
              <SelectItem value="TOMORROW">{t('reservations.filter.tomorrow')}</SelectItem>
              <SelectItem value="WEEK">{t('reservations.filter.week')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="reservations" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {t('reservations.tab')} ({filteredReservations.length})
            </TabsTrigger>
            <TabsTrigger value="preorders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('preorders.tab')} ({filteredPreorders.length})
            </TabsTrigger>
          </TabsList>

          {/* Reservations Tab */}
          <TabsContent value="reservations">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredReservations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== "ALL" || dateFilter !== "ALL" 
                      ? t('reservations.noFilterResults') 
                      : t('reservations.noReservations')}
                  </div>
                ) : (
                  filteredReservations.map((reservation) => (
                    <Card key={reservation.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 rtl:gap-x-reverse mb-2">
                            <span className="font-semibold text-lg">
                              {reservation.customerName}
                            </span>
                            <StatusBadge status={reservation.status} type="reservation" />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <CalendarDays className="h-4 w-4" />
                              {formatDate(reservation.reservationDate)} - {reservation.reservationTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {reservation.numberOfGuests} {t('reservations.guests')}
                              {reservation.table && ` • ${t('reservations.table')} ${reservation.table.number}`}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {reservation.customerPhone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {reservation.customerEmail}
                            </div>
                          </div>
                          {(reservation.notes || reservation.specialRequests) && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              {reservation.specialRequests && (
                                <p><strong>{t('reservations.specialRequests')}:</strong> {reservation.specialRequests}</p>
                              )}
                              {reservation.notes && (
                                <p><strong>{t('reservations.notes')}:</strong> {reservation.notes}</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatDistanceToNow(reservation.createdAt, { 
                            addSuffix: true, 
                            locale: getLocale() 
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <ReservationActions reservation={reservation} />
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {t('reservations.notify')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('reservations.sendNotification')}</DialogTitle>
                                <DialogDescription>
                                  {t('reservations.notificationDesc')}
                                </DialogDescription>
                              </DialogHeader>
                              <NotificationForm
                                onSend={(message) => sendNotification('reservation', reservation.id, message)}
                                customerName={reservation.customerName}
                              />
                            </DialogContent>
                          </Dialog>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>{t('reservations.details')}</SheetTitle>
                                <SheetDescription>
                                  {reservation.customerName} • {formatDate(reservation.reservationDate)}
                                </SheetDescription>
                              </SheetHeader>
                              <ReservationDetails reservation={reservation} />
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Preorders Tab */}
          <TabsContent value="preorders">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredPreorders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || statusFilter !== "ALL" || dateFilter !== "ALL" 
                      ? t('preorders.noFilterResults') 
                      : t('preorders.noPreorders')}
                  </div>
                ) : (
                  filteredPreorders.map((preorder) => (
                    <Card key={preorder.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 rtl:gap-x-reverse mb-2">
                            <span className="font-semibold text-lg">
                              {preorder.customerName}
                            </span>
                            <StatusBadge status={preorder.status} type="preorder" />
                            <Badge variant="outline" className="text-xs">
                              {preorder.orderType === "PICKUP" ? t('preorders.pickup') : t('preorders.dineIn')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(preorder.pickupTime)} - {formatTime(preorder.pickupTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              {preorder.items.length} {t('preorders.items')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              {preorder.customerPhone}
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              {preorder.customerEmail}
                            </div>
                          </div>
                          
                          {/* Payment Info */}
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant={preorder.paymentStatus === 'PAID' ? 'default' : 'outline'}>
                              {preorder.paymentMethod === 'CASH' ? `💵 ${t('orders.paymentMethod.cash')}` : 
                               preorder.paymentMethod === 'CARD' ? `💳 ${t('orders.paymentMethod.card')}` : 
                               preorder.paymentMethod === 'ONLINE' ? `🌐 ${t('orders.paymentMethod.online')}` : 
                               preorder.paymentMethod}
                            </Badge>
                            {preorder.paymentStatus === 'PAID' && (
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {t('orders.paid')}
                              </Badge>
                            )}
                          </div>
                          
                          {/* Order items preview */}
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            <div className="space-y-1">
                              {preorder.items.slice(0, 3).map((item, idx) => (
                                <div key={idx} className="flex justify-between">
                                  <span>
                                    {item.quantity}x {item.name}
                                    {item.variant && ` (${item.variant})`}
                                  </span>
                                  <span>€{item.totalPrice.toFixed(2)}</span>
                                </div>
                              ))}
                              {preorder.items.length > 3 && (
                                <div className="text-gray-500">
                                  +{preorder.items.length - 3} {t('preorders.moreItems')}
                                </div>
                              )}
                            </div>
                            <div className="flex justify-between font-semibold pt-2 border-t border-gray-200 mt-2">
                              <span>{t('preorders.total')}:</span>
                              <span>€{preorder.total.toFixed(2)}</span>
                            </div>
                          </div>

                          {preorder.notes && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                              <p><strong>{t('preorders.notes')}:</strong> {preorder.notes}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          {formatDistanceToNow(preorder.createdAt, { 
                            addSuffix: true, 
                            locale: getLocale() 
                          })}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t">
                        <PreorderActions preorder={preorder} />
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MessageSquare className="h-4 w-4 mr-1" />
                                {t('preorders.notify')}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>{t('preorders.sendNotification')}</DialogTitle>
                                <DialogDescription>
                                  {t('preorders.notificationDesc')}
                                </DialogDescription>
                              </DialogHeader>
                              <NotificationForm
                                onSend={(message) => sendNotification('preorder', preorder.id, message)}
                                customerName={preorder.customerName}
                              />
                            </DialogContent>
                          </Dialog>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button size="sm" variant="outline">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>{t('preorders.details')}</SheetTitle>
                                <SheetDescription>
                                  {preorder.customerName} • {formatDate(preorder.pickupTime)}
                                </SheetDescription>
                              </SheetHeader>
                              <PreorderDetails preorder={preorder} />
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Notification form component
function NotificationForm({ 
  onSend, 
  customerName 
}: { 
  onSend: (message: string) => void
  customerName: string 
}) {
  const { t } = useLanguage()
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!message.trim()) return
    
    setSending(true)
    try {
      await onSend(message)
      setMessage("")
    } catch (error) {
      // Error handled by parent
    } finally {
      setSending(false)
    }
  }

  const quickMessages = [
    t('notifications.orderReady'),
    t('notifications.orderDelayed'),
    t('notifications.tableReady'),
    t('notifications.thankYou')
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('notifications.quickMessages')}
        </label>
        <div className="grid grid-cols-1 gap-2">
          {quickMessages.map((msg, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => setMessage(msg)}
              className="justify-start text-left"
            >
              {msg}
            </Button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-2 block">
          {t('notifications.customMessage')}
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('notifications.messagePlaceholder')}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          onClick={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? t('notifications.sending') : t('notifications.send')}
        </Button>
      </div>
    </div>
  )
}

// Reservation details component
function ReservationDetails({ reservation }: { reservation: Reservation }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>{t('reservations.confirmationCode')}:</strong>
          <p className="font-mono">{reservation.confirmationToken}</p>
        </div>
        <div>
          <strong>{t('reservations.duration')}:</strong>
          <p>{reservation.duration} {t('reservations.minutes')}</p>
        </div>
      </div>

      {reservation.table && (
        <div>
          <strong>{t('reservations.tableDetails')}:</strong>
          <p>{t('reservations.table')} {reservation.table.number} ({reservation.table.seats} {t('reservations.seats')})</p>
        </div>
      )}

      <div>
        <strong>{t('reservations.customerInfo')}:</strong>
        <div className="bg-gray-50 p-3 rounded mt-1">
          <p><strong>{t('reservations.name')}:</strong> {reservation.customerName}</p>
          <p><strong>{t('reservations.email')}:</strong> {reservation.customerEmail}</p>
          <p><strong>{t('reservations.phone')}:</strong> {reservation.customerPhone}</p>
          <p><strong>{t('reservations.guests')}:</strong> {reservation.numberOfGuests}</p>
        </div>
      </div>

      {(reservation.specialRequests || reservation.notes) && (
        <div>
          <strong>{t('reservations.additionalInfo')}:</strong>
          <div className="bg-gray-50 p-3 rounded mt-1 space-y-2">
            {reservation.specialRequests && (
              <div>
                <strong className="text-sm">{t('reservations.specialRequests')}:</strong>
                <p className="text-sm">{reservation.specialRequests}</p>
              </div>
            )}
            {reservation.notes && (
              <div>
                <strong className="text-sm">{t('reservations.notes')}:</strong>
                <p className="text-sm">{reservation.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>{t('reservations.created')}: {format(reservation.createdAt, 'PPpp')}</p>
        <p>{t('reservations.updated')}: {format(reservation.updatedAt, 'PPpp')}</p>
      </div>
    </div>
  )
}

// Preorder details component
function PreorderDetails({ preorder }: { preorder: PreOrder }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-4 pt-4">
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <strong>{t('preorders.orderNumber')}:</strong>
          <p className="font-mono">{preorder.id.slice(-8).toUpperCase()}</p>
        </div>
        <div>
          <strong>{t('preorders.paymentMethod')}:</strong>
          <p>{preorder.paymentMethod}</p>
        </div>
      </div>

      <div>
        <strong>{t('preorders.customerInfo')}:</strong>
        <div className="bg-gray-50 p-3 rounded mt-1">
          <p><strong>{t('preorders.name')}:</strong> {preorder.customerName}</p>
          <p><strong>{t('preorders.email')}:</strong> {preorder.customerEmail}</p>
          <p><strong>{t('preorders.phone')}:</strong> {preorder.customerPhone}</p>
        </div>
      </div>

      <div>
        <strong>{t('preorders.orderItems')}:</strong>
        <div className="bg-gray-50 p-3 rounded mt-1 space-y-2">
          {preorder.items.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">
                  {item.quantity}x {item.name}
                  {item.variant && ` (${item.variant})`}
                </p>
                {item.extras.length > 0 && (
                  <p className="text-sm text-gray-600">
                    {item.extras.map(extra => extra.name).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-gray-500">{item.notes}</p>
                )}
              </div>
              <span className="font-medium">€{item.totalPrice.toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>{t('preorders.subtotal')}:</span>
              <span>€{preorder.subtotal.toFixed(2)}</span>
            </div>
            {preorder.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>{t('preorders.tax')}:</span>
                <span>€{preorder.tax.toFixed(2)}</span>
              </div>
            )}
            {preorder.serviceFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>{t('preorders.serviceFee')}:</span>
                <span>€{preorder.serviceFee.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>{t('preorders.total')}:</span>
              <span>€{preorder.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {preorder.notes && (
        <div>
          <strong>{t('preorders.customerNotes')}:</strong>
          <div className="bg-gray-50 p-3 rounded mt-1">
            <p className="text-sm">{preorder.notes}</p>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        <p>{t('preorders.created')}: {format(preorder.createdAt, 'PPpp')}</p>
        <p>{t('preorders.updated')}: {format(preorder.updatedAt, 'PPpp')}</p>
      </div>
    </div>
  )
}