'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Euro, 
  DollarSign,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  Mail,
  Printer,
  ArrowUp,
  ArrowDown,
  Calendar,
  CreditCard,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Extend jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void
  }
}

interface RestaurantBilling {
  id: string
  name: string
  owner: {
    email: string
    name?: string | null
  }
  country: string
  plan: string
  status: string
  orderCount: number
  totalRevenue: number
  orderRate: number
  totalFees: number
  currency: string
  isPaid: boolean
  lastBillingDate?: Date | null
  billingEnabled: boolean
  payPerOrderEnabled: boolean
}

interface FinanceData {
  billingPeriod: {
    start: Date
    end: Date
  }
  summary: {
    totalRestaurants: number
    activeRestaurants: number
    totalOrdersThisMonth: number
    totalOrdersLastMonth: number
    totalFeesDE: number
    totalFeesJO: number
    lastMonthFeesDE: number
    lastMonthFeesJO: number
    paidRestaurants: number
    unpaidRestaurants: number
  }
  restaurants: RestaurantBilling[]
}

export default function AdminFinanceView({ data }: { data: FinanceData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCountry, setFilterCountry] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantBilling | null>(null)
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get current month/year from URL or use current date
  const currentDate = new Date()
  const selectedMonth = searchParams.get('month') 
    ? parseInt(searchParams.get('month')!) 
    : currentDate.getMonth()
  const selectedYear = searchParams.get('year') 
    ? parseInt(searchParams.get('year')!) 
    : currentDate.getFullYear()
    
  const handleMonthChange = (direction: 'prev' | 'next' | 'current') => {
    if (direction === 'current') {
      router.push('/admin/finance')
      return
    }
    
    let newMonth = selectedMonth
    let newYear = selectedYear
    
    if (direction === 'prev') {
      newMonth--
      if (newMonth < 0) {
        newMonth = 11
        newYear--
      }
    } else {
      newMonth++
      if (newMonth > 11) {
        newMonth = 0
        newYear++
      }
    }
    
    router.push(`/admin/finance?month=${newMonth}&year=${newYear}`)
  }

  // Filter restaurants
  const filteredRestaurants = data.restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          restaurant.owner.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || restaurant.status === filterStatus
    const matchesCountry = filterCountry === 'all' || restaurant.country === filterCountry
    const matchesPayment = filterPayment === 'all' || 
                           (filterPayment === 'paid' && restaurant.isPaid) ||
                           (filterPayment === 'unpaid' && !restaurant.isPaid && restaurant.totalFees > 0)
    
    return matchesSearch && matchesStatus && matchesCountry && matchesPayment
  })

  // Calculate growth percentages
  const orderGrowth = data.summary.totalOrdersLastMonth > 0
    ? ((data.summary.totalOrdersThisMonth - data.summary.totalOrdersLastMonth) / data.summary.totalOrdersLastMonth * 100).toFixed(1)
    : '0'
  
  const revenueGrowthDE = data.summary.lastMonthFeesDE > 0
    ? ((data.summary.totalFeesDE - data.summary.lastMonthFeesDE) / data.summary.lastMonthFeesDE * 100).toFixed(1)
    : '0'
  
  const revenueGrowthJO = data.summary.lastMonthFeesJO > 0
    ? ((data.summary.totalFeesJO - data.summary.lastMonthFeesJO) / data.summary.lastMonthFeesJO * 100).toFixed(1)
    : '0'

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Format billing period
  const billingPeriodText = `${formatDate(data.billingPeriod.start)} - ${formatDate(data.billingPeriod.end)}`

  // Generate invoice PDF
  const generateInvoice = (restaurant: RestaurantBilling) => {
    const doc = new jsPDF()
    
    // Header
    doc.setFontSize(20)
    doc.text('RECHNUNG', 105, 20, { align: 'center' })
    
    // Company info
    doc.setFontSize(10)
    doc.text('Oriido GmbH', 20, 40)
    doc.text('Musterstraße 123', 20, 45)
    doc.text('12345 Berlin', 20, 50)
    doc.text('Deutschland', 20, 55)
    
    // Restaurant info
    doc.text(restaurant.name, 140, 40)
    doc.text(restaurant.owner.email, 140, 45)
    doc.text(restaurant.country === 'DE' ? 'Deutschland' : 'Jordanien', 140, 50)
    
    // Invoice details
    doc.setFontSize(12)
    doc.text(`Rechnungsnummer: INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${restaurant.id.slice(-6).toUpperCase()}`, 20, 70)
    doc.text(`Rechnungsdatum: ${formatDate(new Date())}`, 20, 77)
    doc.text(`Leistungszeitraum: ${billingPeriodText}`, 20, 84)
    
    // Table
    const tableData = [
      ['Oriido Pay-per-Order Gebühren', restaurant.orderCount.toString(), `${restaurant.orderRate} ${restaurant.currency}`, `${restaurant.totalFees.toFixed(2)} ${restaurant.currency}`]
    ]
    
    doc.autoTable({
      startY: 100,
      head: [['Beschreibung', 'Anzahl', 'Einzelpreis', 'Gesamt']],
      body: tableData,
      theme: 'grid'
    })
    
    // Total
    const finalY = (doc as any).lastAutoTable.finalY || 120
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text(`Gesamtbetrag: ${restaurant.totalFees.toFixed(2)} ${restaurant.currency}`, 140, finalY + 20)
    
    // Payment info
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Zahlungsbedingungen: Zahlbar innerhalb von 14 Tagen', 20, finalY + 40)
    doc.text('Bankverbindung:', 20, finalY + 50)
    doc.text('IBAN: DE89 3704 0044 0532 0130 00', 20, finalY + 55)
    doc.text('BIC: COBADEFFXXX', 20, finalY + 60)
    
    // Save
    doc.save(`Rechnung_${restaurant.name}_${new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`)
  }

  // Export to CSV
  const exportToCSV = () => {
    const csvData = filteredRestaurants.map(r => ({
      'Restaurant': r.name,
      'Inhaber': r.owner.email,
      'Land': r.country,
      'Plan': r.plan,
      'Status': r.status,
      'Bestellungen': r.orderCount,
      'Umsatz': r.totalRevenue,
      'Gebühr pro Order': r.orderRate,
      'Gesamtgebühren': r.totalFees,
      'Währung': r.currency,
      'Bezahlt': r.isPaid ? 'Ja' : 'Nein',
      'Letzte Abrechnung': r.lastBillingDate ? formatDate(r.lastBillingDate) : '-'
    }))
    
    const ws = XLSX.utils.json_to_sheet(csvData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Abrechnungen')
    XLSX.writeFile(wb, `Oriido_Abrechnungen_${new Date().getMonth() + 1}_${new Date().getFullYear()}.xlsx`)
    
    toast.success('Excel-Datei wurde heruntergeladen')
  }

  // Mark as paid
  const markAsPaid = async (restaurantId: string) => {
    try {
      const response = await fetch(`/api/admin/finance/${restaurantId}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: new Date() })
      })
      
      if (response.ok) {
        toast.success('Als bezahlt markiert')
        window.location.reload()
      } else {
        toast.error('Fehler beim Aktualisieren')
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren')
    }
  }

  // Send invoice by email
  const sendInvoiceEmail = async (restaurant: RestaurantBilling) => {
    try {
      const response = await fetch('/api/admin/finance/send-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          email: restaurant.owner.email,
          amount: restaurant.totalFees,
          currency: restaurant.currency,
          period: billingPeriodText
        })
      })
      
      if (response.ok) {
        toast.success(`Rechnung wurde an ${restaurant.owner.email} gesendet`)
      } else {
        toast.error('Fehler beim Senden der E-Mail')
      }
    } catch (error) {
      toast.error('Fehler beim Senden der E-Mail')
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Finanzübersicht</h1>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange('prev')}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-gray-400">
              {new Date(selectedYear, selectedMonth).toLocaleDateString('de-DE', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleMonthChange('next')}
              className="bg-gray-700 hover:bg-gray-600 text-gray-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            {(selectedMonth !== currentDate.getMonth() || selectedYear !== currentDate.getFullYear()) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleMonthChange('current')}
                className="bg-blue-600 hover:bg-blue-700 text-white ml-2"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Aktueller Monat
              </Button>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportToCSV}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Excel Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Deutschland Gebühren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              €{data.summary.totalFeesDE.toFixed(2)}
            </div>
            <div className={`flex items-center text-xs mt-2 ${Number(revenueGrowthDE) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(revenueGrowthDE) >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {Math.abs(Number(revenueGrowthDE))}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Jordanien Gebühren
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              JD {data.summary.totalFeesJO.toFixed(2)}
            </div>
            <div className={`flex items-center text-xs mt-2 ${Number(revenueGrowthJO) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(revenueGrowthJO) >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {Math.abs(Number(revenueGrowthJO))}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Gesamtbestellungen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {data.summary.totalOrdersThisMonth.toLocaleString('de-DE')}
            </div>
            <div className={`flex items-center text-xs mt-2 ${Number(orderGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Number(orderGrowth) >= 0 ? <ArrowUp className="h-3 w-3 mr-1" /> : <ArrowDown className="h-3 w-3 mr-1" />}
              {Math.abs(Number(orderGrowth))}% zum Vormonat
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Bezahlt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {data.summary.paidRestaurants}
            </div>
            <p className="text-xs text-gray-400 mt-1">Restaurants</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">
              Ausstehend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {data.summary.unpaidRestaurants}
            </div>
            <p className="text-xs text-gray-400 mt-1">Restaurants</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2 bg-gray-700 rounded-lg px-3">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Restaurant oder E-Mail suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            <Select value={filterCountry} onValueChange={setFilterCountry}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Land wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Länder</SelectItem>
                <SelectItem value="DE">Deutschland</SelectItem>
                <SelectItem value="JO">Jordanien</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="ACTIVE">Aktiv</SelectItem>
                <SelectItem value="PENDING">Ausstehend</SelectItem>
                <SelectItem value="SUSPENDED">Gesperrt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Zahlungsstatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="unpaid">Unbezahlt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Billing Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Restaurant Abrechnungen</CardTitle>
          <CardDescription className="text-gray-400">
            Detaillierte Auflistung aller Pay-per-Order Gebühren
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Restaurant</TableHead>
                  <TableHead className="text-gray-300">Land</TableHead>
                  <TableHead className="text-gray-300">Plan</TableHead>
                  <TableHead className="text-gray-300">Bestellungen</TableHead>
                  <TableHead className="text-gray-300">Umsatz</TableHead>
                  <TableHead className="text-gray-300">Gebühr/Order</TableHead>
                  <TableHead className="text-gray-300">Gesamtgebühr</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <TableRow key={restaurant.id} className="border-gray-700">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{restaurant.name}</p>
                        <p className="text-sm text-gray-400">{restaurant.owner.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-2xl">
                        {restaurant.country === 'DE' ? '🇩🇪' : '🇯🇴'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-gray-300">
                        {restaurant.plan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white">
                      {restaurant.orderCount}
                    </TableCell>
                    <TableCell className="text-white">
                      {restaurant.currency === 'EUR' ? '€' : 'JD'}{restaurant.totalRevenue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-white">
                      {restaurant.orderRate > 0 ? `${restaurant.currency === 'EUR' ? '€' : 'JD'}${restaurant.orderRate}` : '-'}
                    </TableCell>
                    <TableCell className="font-bold text-green-500">
                      {restaurant.totalFees > 0 ? `${restaurant.currency === 'EUR' ? '€' : 'JD'}${restaurant.totalFees.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell>
                      {restaurant.totalFees > 0 && (
                        restaurant.isPaid ? (
                          <Badge className="bg-green-600 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Bezahlt
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-600 text-white">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Offen
                          </Badge>
                        )
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/admin/finance/${restaurant.id}`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                            title="Details anzeigen"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {restaurant.totalFees > 0 && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedRestaurant(restaurant)
                                setShowInvoiceDialog(true)
                              }}
                              className="text-gray-400 hover:text-white"
                              title="Rechnung senden"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => generateInvoice(restaurant)}
                              className="text-gray-400 hover:text-white"
                              title="Rechnung herunterladen"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => sendInvoiceEmail(restaurant)}
                              className="text-gray-400 hover:text-white"
                              title="Rechnung per E-Mail senden"
                            >
                              <Mail className="w-4 h-4" />
                            </Button>
                            {!restaurant.isPaid && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markAsPaid(restaurant.id)}
                                className="text-green-400 hover:text-green-300"
                                title="Als bezahlt markieren"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Preview Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Rechnung Vorschau</DialogTitle>
            <DialogDescription>
              {selectedRestaurant?.name} - {billingPeriodText}
            </DialogDescription>
          </DialogHeader>
          {selectedRestaurant && (
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-bold mb-2">Von:</h3>
                    <p>Oriido GmbH</p>
                    <p>Musterstraße 123</p>
                    <p>12345 Berlin</p>
                  </div>
                  <div>
                    <h3 className="font-bold mb-2">An:</h3>
                    <p>{selectedRestaurant.name}</p>
                    <p>{selectedRestaurant.owner.email}</p>
                    <p>{selectedRestaurant.country === 'DE' ? 'Deutschland' : 'Jordanien'}</p>
                  </div>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Anzahl</TableHead>
                    <TableHead>Einzelpreis</TableHead>
                    <TableHead>Gesamt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Oriido Pay-per-Order Gebühren</TableCell>
                    <TableCell>{selectedRestaurant.orderCount}</TableCell>
                    <TableCell>
                      {selectedRestaurant.currency === 'EUR' ? '€' : 'JD'}{selectedRestaurant.orderRate}
                    </TableCell>
                    <TableCell className="font-bold">
                      {selectedRestaurant.currency === 'EUR' ? '€' : 'JD'}{selectedRestaurant.totalFees.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Zahlbar innerhalb von 14 Tagen</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    Gesamt: {selectedRestaurant.currency === 'EUR' ? '€' : 'JD'}{selectedRestaurant.totalFees.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  onClick={() => generateInvoice(selectedRestaurant)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF Download
                </Button>
                <Button
                  onClick={() => sendInvoiceEmail(selectedRestaurant)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Per E-Mail senden
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}