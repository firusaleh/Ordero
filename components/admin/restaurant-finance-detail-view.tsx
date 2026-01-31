'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Euro, 
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Banknote,
  FileText,
  Download,
  BarChart3,
  DollarSign
} from 'lucide-react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface RestaurantFinanceData {
  restaurant: {
    id: string
    name: string
    owner: {
      email: string
      name?: string | null
    }
    country: string
    plan: string
    status: string
    orderRate: number
    currency: string
    billingEnabled: boolean
    payPerOrderEnabled: boolean
    lastBillingDate?: Date | null
  }
  currentPeriod: {
    start: Date
    end: Date
  }
  thisMonth: {
    orderCount: number
    revenue: number
    fees: number
    cashOrders: number
    onlineOrders: number
    cashRevenue: number
    onlineRevenue: number
    orders: Array<{
      id: string
      orderNumber: string
      total: number
      createdAt: Date
      status: string
      paymentStatus: string
      paymentMethod: string | null | null
      items: Array<{
        id: string
        quantity: number
        menuItem: { 
          name: string
          price: number
        }
      }>
    }>
  }
  lastMonth: {
    orderCount: number
    revenue: number
    fees: number
  }
  monthlyStats: Array<{
    month: string
    orderCount: number
    revenue: number
    fees: number
    cashOrders: number
    onlineOrders: number
  }>
  allOrders: Array<{
    id: string
    orderNumber: string
    total: number
    createdAt: Date
    status: string
    paymentStatus: string
    paymentMethod: string | null
    items: Array<{
      id: string
      quantity: number
      menuItem: { 
        name: string
        price: number
      }
    }>
  }>
}

interface Props {
  data: RestaurantFinanceData
}

export default function RestaurantFinanceDetailView({ data }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('all')

  const currencySymbol = data.restaurant.currency === 'EUR' ? '€' : 'JD'

  // Calculate growth percentages
  const orderGrowth = data.lastMonth.orderCount > 0 
    ? ((data.thisMonth.orderCount - data.lastMonth.orderCount) / data.lastMonth.orderCount) * 100 
    : 0

  const revenueGrowth = data.lastMonth.revenue > 0 
    ? ((data.thisMonth.revenue - data.lastMonth.revenue) / data.lastMonth.revenue) * 100 
    : 0

  // Filter orders based on payment method
  const filteredOrders = selectedPaymentMethod === 'all' 
    ? data.thisMonth.orders
    : selectedPaymentMethod === 'cash'
      ? data.thisMonth.orders.filter(order => order.paymentMethod === 'CASH')
      : data.thisMonth.orders.filter(order => order.paymentMethod !== 'CASH' && order.paymentMethod !== null)

  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">Abgeschlossen</Badge>
      case 'READY':
        return <Badge variant="default" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Bereit</Badge>
      case 'DELIVERED':
        return <Badge variant="default" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Geliefert</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string | null) => {
    return method === 'CASH' ? (
      <div className="flex items-center gap-2">
        <Banknote className="h-4 w-4 text-green-500" />
        <span>Bar</span>
      </div>
    ) : method ? (
      <div className="flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-blue-500" />
        <span>Online</span>
      </div>
    ) : (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Unbekannt</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/finance">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zur Finanzübersicht
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white">{data.restaurant.name}</h1>
        <p className="text-gray-400 mt-1">
          Detaillierte Finanzübersicht • {data.restaurant.country === 'DE' ? 'Deutschland' : 'Jordanien'} • 
          {data.restaurant.plan}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bestellungen Monat</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{data.thisMonth.orderCount}</div>
            <div className="flex items-center gap-1 text-xs">
              {orderGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={orderGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(orderGrowth).toFixed(1)}%
              </span>
              <span className="text-gray-500">vs letzter Monat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Umsatz Monat</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{currencySymbol}{data.thisMonth.revenue.toFixed(2)}</div>
            <div className="flex items-center gap-1 text-xs">
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {Math.abs(revenueGrowth).toFixed(1)}%
              </span>
              <span className="text-gray-500">vs letzter Monat</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bar-Zahlungen</CardTitle>
            <Banknote className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{data.thisMonth.cashOrders}</div>
            <div className="text-xs text-gray-500">
              {currencySymbol}{data.thisMonth.cashRevenue.toFixed(2)} Umsatz
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Online-Zahlungen</CardTitle>
            <CreditCard className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{data.thisMonth.onlineOrders}</div>
            <div className="text-xs text-gray-500">
              {currencySymbol}{data.thisMonth.onlineRevenue.toFixed(2)} Umsatz
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Breakdown */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Zahlungsmethoden Aufschlüsselung</CardTitle>
          <CardDescription className="text-gray-400">
            Verteilung zwischen Bar- und Online-Zahlungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-4 w-4 text-green-500" />
                  <span className="text-gray-300">Bar-Zahlungen</span>
                </div>
                <span className="font-semibold text-white">{data.thisMonth.cashOrders} Bestellungen</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${data.thisMonth.orderCount > 0 ? (data.thisMonth.cashOrders / data.thisMonth.orderCount) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-400">
                {currencySymbol}{data.thisMonth.cashRevenue.toFixed(2)} Umsatz 
                ({data.thisMonth.orderCount > 0 ? ((data.thisMonth.cashOrders / data.thisMonth.orderCount) * 100).toFixed(1) : 0}%)
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-300">Online-Zahlungen</span>
                </div>
                <span className="font-semibold text-white">{data.thisMonth.onlineOrders} Bestellungen</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ 
                    width: `${data.thisMonth.orderCount > 0 ? (data.thisMonth.onlineOrders / data.thisMonth.orderCount) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-400">
                {currencySymbol}{data.thisMonth.onlineRevenue.toFixed(2)} Umsatz 
                ({data.thisMonth.orderCount > 0 ? ((data.thisMonth.onlineOrders / data.thisMonth.orderCount) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Bestellungen diesen Monat</CardTitle>
              <CardDescription className="text-gray-400">
                Alle Bestellungen mit Zahlungsmethoden-Details
              </CardDescription>
            </div>
            <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
              <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="all">Alle Zahlungen</SelectItem>
                <SelectItem value="cash">Nur Bar-Zahlungen</SelectItem>
                <SelectItem value="online">Nur Online-Zahlungen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg mb-2">Keine Bestellungen gefunden</p>
              <p className="text-gray-500 text-sm">
                {selectedPaymentMethod === 'cash' 
                  ? 'Keine Bar-Zahlungen in diesem Zeitraum.'
                  : selectedPaymentMethod === 'online'
                    ? 'Keine Online-Zahlungen in diesem Zeitraum.'
                    : 'Keine Bestellungen in diesem Zeitraum.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700 hover:bg-gray-700/50">
                  <TableHead className="text-gray-300">Bestellung</TableHead>
                  <TableHead className="text-gray-300">Datum</TableHead>
                  <TableHead className="text-gray-300">Betrag</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Zahlung</TableHead>
                  <TableHead className="text-gray-300">Artikel</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id} className="border-gray-700 hover:bg-gray-700/30">
                    <TableCell className="text-white font-medium">{order.orderNumber}</TableCell>
                    <TableCell className="text-gray-400">{formatDate(order.createdAt)}</TableCell>
                    <TableCell className="text-white font-medium">
                      {currencySymbol}{(order.total || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentMethodIcon(order.paymentMethod)}</TableCell>
                    <TableCell className="text-gray-400">
                      {order.items.length} Artikel
                      {order.items.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {order.items.slice(0, 2).map(item => item.menuItem.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} weitere`}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Monthly Statistics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Monatliche Übersicht</CardTitle>
          <CardDescription className="text-gray-400">
            Historische Daten der letzten Monate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700 hover:bg-gray-700/50">
                <TableHead className="text-gray-300">Monat</TableHead>
                <TableHead className="text-gray-300">Bestellungen</TableHead>
                <TableHead className="text-gray-300">Bar</TableHead>
                <TableHead className="text-gray-300">Online</TableHead>
                <TableHead className="text-gray-300">Umsatz</TableHead>
                <TableHead className="text-gray-300">Gebühren</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.monthlyStats.map((stat) => {
                const [year, month] = stat.month.split('-')
                const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('de-DE', { 
                  month: 'long', 
                  year: 'numeric' 
                })
                
                return (
                  <TableRow key={stat.month} className="border-gray-700 hover:bg-gray-700/30">
                    <TableCell className="text-white font-medium">{monthName}</TableCell>
                    <TableCell className="text-gray-400">{stat.orderCount}</TableCell>
                    <TableCell className="text-green-400">{stat.cashOrders}</TableCell>
                    <TableCell className="text-blue-400">{stat.onlineOrders}</TableCell>
                    <TableCell className="text-white">{currencySymbol}{stat.revenue.toFixed(2)}</TableCell>
                    <TableCell className="text-yellow-400">{currencySymbol}{stat.fees.toFixed(2)}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Billing Information */}
      {data.restaurant.payPerOrderEnabled && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Abrechnungsinformationen</CardTitle>
            <CardDescription className="text-gray-400">
              Pay-per-Order Details für dieses Restaurant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-gray-400">Gebühr pro Bestellung</p>
                <p className="text-xl font-bold text-white">
                  {currencySymbol}{data.restaurant.orderRate.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Gebühren diesen Monat</p>
                <p className="text-xl font-bold text-yellow-400">
                  {currencySymbol}{data.thisMonth.fees.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Letzter Abrechnungstermin</p>
                <p className="text-xl font-bold text-white">
                  {data.restaurant.lastBillingDate 
                    ? formatDate(data.restaurant.lastBillingDate)
                    : 'Noch nicht abgerechnet'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}