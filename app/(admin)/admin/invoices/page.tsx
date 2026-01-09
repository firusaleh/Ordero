"use client"

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

export default function AdminInvoicesPage() {
  const invoices = [
    {
      id: '1',
      number: 'INV-2024-001',
      restaurant: 'Bella Italia',
      amount: 79.99,
      status: 'paid',
      date: '2024-01-15',
      dueDate: '2024-02-15'
    },
    {
      id: '2',
      number: 'INV-2024-002',
      restaurant: 'Burger Palace',
      amount: 79.99,
      status: 'pending',
      date: '2024-01-15',
      dueDate: '2024-02-15'
    },
    {
      id: '3',
      number: 'INV-2024-003',
      restaurant: 'Pizza Roma',
      amount: 149.99,
      status: 'overdue',
      date: '2024-01-01',
      dueDate: '2024-01-31'
    }
  ]

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
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{invoice.number}</p>
                    <p className="text-sm text-gray-400">{invoice.restaurant}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-medium text-white">€{invoice.amount}</p>
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Gesamtumsatz</CardTitle>
            <Euro className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">€309.97</div>
            <p className="text-xs text-gray-500">Diesen Monat</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Ausstehend</CardTitle>
            <FileText className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">€229.98</div>
            <p className="text-xs text-yellow-500">2 Rechnungen</p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-300">Überfällig</CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">€149.99</div>
            <p className="text-xs text-red-500">1 Rechnung</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}