import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  Download, 
  Eye,
  Search,
  Filter,
  Calendar,
  Euro
} from 'lucide-react'

interface InvoiceData {
  id: string
  number: string
  restaurant: string
  amount: number
  currency: string
  status: 'paid' | 'pending' | 'overdue'
  date: string
  dueDate: string
  orderCount: number
}

async function getInvoicesData(): Promise<{
  invoices: InvoiceData[]
  summary: {
    totalAmountEUR: number
    totalAmountJOD: number
    paidAmountEUR: number
    paidAmountJOD: number
    pendingAmountEUR: number
    pendingAmountJOD: number
    overdueAmountEUR: number
    overdueAmountJOD: number
    totalInvoices: number
    paidInvoices: number
    pendingInvoices: number
    overdueInvoices: number
  }
}> {
  const session = await auth()
  
  if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()

  // Get restaurants with billing data for the last 12 months
  const restaurants = await prisma.restaurant.findMany({
    include: {
      owner: {
        select: {
          email: true,
          name: true
        }
      },
      orders: {
        select: {
          id: true,
          total: true,
          createdAt: true,
          status: true,
          paymentStatus: true
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  const invoices: InvoiceData[] = []
  let invoiceCounter = 1

  // Generate invoices for each restaurant for the last 12 months
  for (const restaurant of restaurants) {
    // TRIAL und PAY_PER_ORDER Pläne generieren Rechnungen
    if (!restaurant.payPerOrderEnabled && restaurant.plan !== 'TRIAL' && !restaurant.plan?.includes('PAY_PER_ORDER')) {
      continue
    }

    // Generate invoices for last 12 months
    for (let monthOffset = 0; monthOffset < 12; monthOffset++) {
      const invoiceDate = new Date(currentYear, currentMonth - monthOffset, 1)
      const startOfMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth(), 1)
      const endOfMonth = new Date(invoiceDate.getFullYear(), invoiceDate.getMonth() + 1, 0)
      
      // Skip future months
      if (startOfMonth > now) continue

      // Get orders for this month (nur bestätigte/bezahlte)
      const monthOrders = restaurant.orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= startOfMonth && orderDate <= endOfMonth &&
               (['CONFIRMED', 'READY', 'DELIVERED', 'COMPLETED'].includes(order.status) || order.paymentStatus === 'PAID')
      })

      // Skip if no orders
      if (monthOrders.length === 0) continue

      // Calculate amount based on country
      let orderRate = 0
      let currency = 'EUR'
      
      if (restaurant.country === 'JO') {
        currency = 'JOD'
        orderRate = 0.10
      } else if (restaurant.country === 'DE') {
        currency = 'EUR'
        orderRate = 0.45
      }

      const amount = monthOrders.length * orderRate
      const invoiceNumber = `INV-${invoiceDate.getFullYear()}-${String(invoiceCounter).padStart(3, '0')}`
      
      // Determine status
      let status: 'paid' | 'pending' | 'overdue' = 'pending'
      const dueDate = new Date(endOfMonth)
      dueDate.setDate(dueDate.getDate() + 14) // 14 days payment term
      
      if (restaurant.lastBillingDate && restaurant.lastBillingDate >= endOfMonth) {
        status = 'paid'
      } else if (dueDate < now) {
        status = 'overdue'
      }

      invoices.push({
        id: `${restaurant.id}-${invoiceDate.getTime()}`,
        number: invoiceNumber,
        restaurant: restaurant.name,
        amount,
        currency,
        status,
        date: startOfMonth.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        orderCount: monthOrders.length
      })

      invoiceCounter++
    }
  }

  // Sort invoices by date (newest first)
  invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Calculate summary by currency
  const eurInvoices = invoices.filter(inv => inv.currency === 'EUR')
  const jodInvoices = invoices.filter(inv => inv.currency === 'JOD')
  
  const summary = {
    totalAmountEUR: eurInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    totalAmountJOD: jodInvoices.reduce((sum, inv) => sum + inv.amount, 0),
    paidAmountEUR: eurInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    paidAmountJOD: jodInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmountEUR: eurInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    pendingAmountJOD: jodInvoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdueAmountEUR: eurInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
    overdueAmountJOD: jodInvoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
    totalInvoices: invoices.length,
    paidInvoices: invoices.filter(inv => inv.status === 'paid').length,
    pendingInvoices: invoices.filter(inv => inv.status === 'pending').length,
    overdueInvoices: invoices.filter(inv => inv.status === 'overdue').length
  }

  return { invoices, summary }
}

export default async function AdminInvoicesPage() {
  const { invoices, summary } = await getInvoicesData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Rechnungen</h1>
        <p className="text-gray-400 mt-1">Verwaltung aller Plattform-Rechnungen</p>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 flex-wrap">
        <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300">
          <Search className="h-4 w-4 mr-2" />
          Suchen
        </Button>
        <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
        <Button variant="outline" className="bg-gray-800 border-gray-700 text-gray-300">
          <Calendar className="h-4 w-4 mr-2" />
          Zeitraum
        </Button>
      </div>

      {/* Invoices List */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Alle Rechnungen</CardTitle>
          <CardDescription className="text-gray-400">
            Übersicht aller ausgestellten Rechnungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-2">Keine Rechnungen gefunden</p>
                <p className="text-gray-500 text-sm">Es wurden noch keine Rechnungen für Pay-per-Order Restaurants generiert.</p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{invoice.number}</p>
                      <p className="text-sm text-gray-400">{invoice.restaurant}</p>
                      <p className="text-xs text-gray-500">{invoice.orderCount} Bestellungen</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="font-medium text-white">{invoice.currency === 'EUR' ? '€' : 'JD'}{invoice.amount.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Fällig: {invoice.dueDate}</p>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        invoice.status === 'paid'
                          ? 'bg-green-500/10 text-green-500 border-green-500/20'
                          : invoice.status === 'pending'
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                          : 'bg-red-500/10 text-red-500 border-red-500/20'
                      }
                    >
                      {invoice.status === 'paid' ? 'Bezahlt' : invoice.status === 'pending' ? 'Ausstehend' : 'Überfällig'}
                    </Badge>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.totalAmountEUR > 0 && (
                <div className="text-xl font-bold text-white">€{summary.totalAmountEUR.toFixed(2)}</div>
              )}
              {summary.totalAmountJOD > 0 && (
                <div className="text-xl font-bold text-white">JD{summary.totalAmountJOD.toFixed(2)}</div>
              )}
              {summary.totalAmountEUR === 0 && summary.totalAmountJOD === 0 && (
                <div className="text-xl font-bold text-gray-500">€0.00</div>
              )}
            </div>
            <p className="text-xs text-gray-500">{summary.totalInvoices} Rechnungen</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Bezahlt</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.paidAmountEUR > 0 && (
                <div className="text-xl font-bold text-green-400">€{summary.paidAmountEUR.toFixed(2)}</div>
              )}
              {summary.paidAmountJOD > 0 && (
                <div className="text-xl font-bold text-green-400">JD{summary.paidAmountJOD.toFixed(2)}</div>
              )}
              {summary.paidAmountEUR === 0 && summary.paidAmountJOD === 0 && (
                <div className="text-xl font-bold text-gray-500">€0.00</div>
              )}
            </div>
            <p className="text-xs text-green-500">{summary.paidInvoices} Rechnungen</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Ausstehend</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.pendingAmountEUR > 0 && (
                <div className="text-xl font-bold text-yellow-400">€{summary.pendingAmountEUR.toFixed(2)}</div>
              )}
              {summary.pendingAmountJOD > 0 && (
                <div className="text-xl font-bold text-yellow-400">JD{summary.pendingAmountJOD.toFixed(2)}</div>
              )}
              {summary.pendingAmountEUR === 0 && summary.pendingAmountJOD === 0 && (
                <div className="text-xl font-bold text-gray-500">€0.00</div>
              )}
            </div>
            <p className="text-xs text-yellow-500">{summary.pendingInvoices} Rechnungen</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Überfällig</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {summary.overdueAmountEUR > 0 && (
                <div className="text-xl font-bold text-red-400">€{summary.overdueAmountEUR.toFixed(2)}</div>
              )}
              {summary.overdueAmountJOD > 0 && (
                <div className="text-xl font-bold text-red-400">JD{summary.overdueAmountJOD.toFixed(2)}</div>
              )}
              {summary.overdueAmountEUR === 0 && summary.overdueAmountJOD === 0 && (
                <div className="text-xl font-bold text-gray-500">€0.00</div>
              )}
            </div>
            <p className="text-xs text-red-500">{summary.overdueInvoices} Rechnungen</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}