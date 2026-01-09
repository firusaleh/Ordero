'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
  Plus, 
  Edit, 
  Trash2, 
  Download,
  QrCode,
  ExternalLink,
  Users,
  Printer,
  RefreshCw,
  Eye,
  Copy,
  CheckCircle,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '@/components/shared/empty-state'
import QRCode from 'qrcode'

interface Table {
  id: string
  number: number
  name?: string | null
  seats?: number | null
  isActive: boolean
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'
  qrCodeUrl?: string | null
  section?: string | null
  notes?: string | null
}

interface AdminTableManagerProps {
  restaurantId: string
}

const tableStatuses = {
  AVAILABLE: { label: 'Verfügbar', color: 'bg-green-500', icon: CheckCircle },
  OCCUPIED: { label: 'Besetzt', color: 'bg-red-500', icon: Users },
  RESERVED: { label: 'Reserviert', color: 'bg-yellow-500', icon: AlertCircle },
  MAINTENANCE: { label: 'Wartung', color: 'bg-gray-500', icon: Settings }
}

export default function AdminTableManager({ restaurantId }: AdminTableManagerProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrPreview, setQrPreview] = useState<{ [key: string]: string }>({})
  
  // Dialog states
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [showQrBulkDialog, setShowQrBulkDialog] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  
  // Form States
  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    seats: '4',
    section: '',
    notes: '',
    isActive: true,
    status: 'AVAILABLE' as Table['status']
  })
  
  const [batchForm, setBatchForm] = useState({
    startNumber: '1',
    endNumber: '10',
    prefix: 'Tisch ',
    section: '',
    seats: '4'
  })

  // Load data
  useEffect(() => {
    loadTables()
  }, [restaurantId])

  const loadTables = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/restaurants/${restaurantId}/tables`)
      if (!response.ok) throw new Error('Fehler beim Laden der Tische')
      
      const data = await response.json()
      setTables(data.tables || [])
    } catch (error) {
      toast.error('Fehler beim Laden der Tische')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveTable = async () => {
    try {
      const method = editingTable ? 'PATCH' : 'POST'
      const url = editingTable 
        ? `/api/restaurants/${restaurantId}/tables/${editingTable.id}`
        : `/api/restaurants/${restaurantId}/tables`
      
      const tableData = {
        ...tableForm,
        number: parseInt(tableForm.number),
        seats: parseInt(tableForm.seats)
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      const savedTable = await response.json()
      
      if (editingTable) {
        setTables(tables.map(table => 
          table.id === editingTable.id ? { ...table, ...tableData } : table
        ))
        toast.success('Tisch aktualisiert')
      } else {
        setTables([...tables, savedTable.data])
        toast.success('Tisch erstellt')
      }
      
      setShowTableDialog(false)
      resetTableForm()
    } catch (error) {
      toast.error('Fehler beim Speichern des Tisches')
    }
  }

  const handleBatchCreate = async () => {
    const start = parseInt(batchForm.startNumber)
    const end = parseInt(batchForm.endNumber)
    const seats = parseInt(batchForm.seats)
    
    if (start > end) {
      toast.error('Startnummer muss kleiner als Endnummer sein')
      return
    }
    
    if (end - start + 1 > 50) {
      toast.error('Maximal 50 Tische auf einmal erstellen')
      return
    }
    
    try {
      const tablesToCreate = []
      for (let i = start; i <= end; i++) {
        tablesToCreate.push({
          number: i,
          name: `${batchForm.prefix}${i}`,
          seats,
          section: batchForm.section || null,
          isActive: true,
          status: 'AVAILABLE'
        })
      }
      
      const response = await fetch(`/api/restaurants/${restaurantId}/tables/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables: tablesToCreate })
      })

      if (!response.ok) throw new Error('Fehler beim Erstellen')

      const result = await response.json()
      setTables([...tables, ...result.data])
      toast.success(`${tablesToCreate.length} Tische erstellt`)
      setShowBatchDialog(false)
      resetBatchForm()
    } catch (error) {
      toast.error('Fehler beim Erstellen der Tische')
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Möchten Sie diesen Tisch wirklich löschen?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tables/${tableId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Löschen')

      setTables(tables.filter(table => table.id !== tableId))
      setSelectedTables(selectedTables.filter(id => id !== tableId))
      toast.success('Tisch gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Tisches')
    }
  }

  const handleToggleTableActive = async (tableId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')

      setTables(tables.map(table => 
        table.id === tableId ? { ...table, isActive } : table
      ))
      
      toast.success(isActive ? 'Tisch aktiviert' : 'Tisch deaktiviert')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status')
    }
  }

  const handleUpdateTableStatus = async (tableId: string, status: Table['status']) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')

      setTables(tables.map(table => 
        table.id === tableId ? { ...table, status } : table
      ))
      
      toast.success(`Status auf "${tableStatuses[status].label}" geändert`)
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Status')
    }
  }

  const generateQRCode = async (tableNumber: number) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ordero.de'}/r/demo/tisch/${tableNumber}`
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      })
      return qrDataUrl
    } catch (error) {
      console.error('Error generating QR code:', error)
      return null
    }
  }

  const handleGenerateQRCodes = async () => {
    setIsGenerating(true)
    
    try {
      const tablesToGenerate = selectedTables.length > 0 
        ? tables.filter(t => selectedTables.includes(t.id))
        : tables
      
      if (tablesToGenerate.length === 0) {
        toast.error('Keine Tische zum Generieren ausgewählt')
        return
      }

      const previews: { [key: string]: string } = {}
      
      for (const table of tablesToGenerate) {
        const qrCode = await generateQRCode(table.number)
        if (qrCode) {
          previews[table.id] = qrCode
        }
      }
      
      setQrPreview(previews)
      toast.success(`QR-Codes für ${tablesToGenerate.length} Tische generiert`)
    } catch (error) {
      toast.error('Fehler beim Generieren der QR-Codes')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownloadQRCodes = async () => {
    try {
      toast.info('PDF wird generiert...', {
        description: 'Die QR-Codes werden als PDF vorbereitet.'
      })
      
      const tablesToDownload = selectedTables.length > 0 
        ? tables.filter(t => selectedTables.includes(t.id))
        : tables
      
      if (tablesToDownload.length === 0) {
        toast.error('Keine Tische zum Download ausgewählt')
        return
      }

      const response = await fetch('/api/dashboard/tables/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: tablesToDownload.map(t => ({
            number: t.number,
            name: t.name
          })),
          restaurantSlug: 'demo',
          restaurantName: 'Demo Restaurant'
        })
      })

      if (!response.ok) {
        throw new Error('PDF konnte nicht generiert werden')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `qr-codes-tische.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('QR-Codes als PDF heruntergeladen!')
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Fehler beim Download der QR-Codes')
    }
  }

  const copyTableUrl = async (tableNumber: number) => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ordero.de'}/r/demo/tisch/${tableNumber}`
    
    try {
      await navigator.clipboard.writeText(url)
      toast.success('URL in Zwischenablage kopiert')
    } catch (error) {
      toast.error('Fehler beim Kopieren der URL')
    }
  }

  const resetTableForm = () => {
    setTableForm({
      number: '',
      name: '',
      seats: '4',
      section: '',
      notes: '',
      isActive: true,
      status: 'AVAILABLE'
    })
    setEditingTable(null)
  }

  const resetBatchForm = () => {
    setBatchForm({
      startNumber: '1',
      endNumber: '10',
      prefix: 'Tisch ',
      section: '',
      seats: '4'
    })
  }

  const openEditTable = (table: Table) => {
    setEditingTable(table)
    setTableForm({
      number: table.number.toString(),
      name: table.name || '',
      seats: (table.seats || 4).toString(),
      section: table.section || '',
      notes: table.notes || '',
      isActive: table.isActive,
      status: table.status
    })
    setShowTableDialog(true)
  }

  const getTableUrl = (tableNumber: number) => {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'https://ordero.de'}/r/demo/tisch/${tableNumber}`
  }

  const sections = Array.from(new Set(tables.map(t => t.section).filter(Boolean)))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6" />
            Tische & QR-Codes verwalten
          </h2>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre Tische, generieren und laden Sie QR-Codes herunter
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTables.length > 0 && (
            <Button 
              variant="outline"
              onClick={handleGenerateQRCodes}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              QR-Codes ({selectedTables.length})
            </Button>
          )}
          <Button 
            variant="outline"
            onClick={() => {
              resetBatchForm()
              setShowBatchDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Mehrere Tische
          </Button>
          <Button 
            onClick={() => {
              resetTableForm()
              setShowTableDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tisch hinzufügen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Gesamt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tables.length}</div>
            <p className="text-xs text-gray-500">Tische</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Aktiv</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tables.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-gray-500">Verfügbar</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Plätze</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tables.reduce((sum, t) => sum + (t.seats || 0), 0)}
            </div>
            <p className="text-xs text-gray-500">Gesamt</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ausgewählt</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {selectedTables.length}
            </div>
            <p className="text-xs text-gray-500">
              {selectedTables.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="mt-1 h-6 text-xs"
                  onClick={() => setSelectedTables([])}
                >
                  Auswahl aufheben
                </Button>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {Object.keys(qrPreview).length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>QR-Codes bereit für Download</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadQRCodes}>
                  <Download className="mr-2 h-4 w-4" />
                  Als PDF herunterladen
                </Button>
                <Button variant="outline" size="sm">
                  <Printer className="mr-2 h-4 w-4" />
                  Drucken
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setQrPreview({})}>
                  Schließen
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {tables.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={QrCode}
              title="Keine Tische"
              description="Erstellen Sie Tische, um QR-Codes zu generieren"
              action={{
                label: 'Tische erstellen',
                onClick: () => {
                  resetBatchForm()
                  setShowBatchDialog(true)
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Kachel-Ansicht</TabsTrigger>
            <TabsTrigger value="list">Listen-Ansicht</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tables.map((table) => {
                const statusInfo = tableStatuses[table.status]
                const StatusIcon = statusInfo.icon
                const isSelected = selectedTables.includes(table.id)
                
                return (
                  <Card 
                    key={table.id} 
                    className={`${!table.isActive ? 'opacity-60' : ''} ${
                      isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                    } cursor-pointer transition-all`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTables(selectedTables.filter(id => id !== table.id))
                      } else {
                        setSelectedTables([...selectedTables, table.id])
                      }
                    }}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {table.name || `Tisch ${table.number}`}
                            <StatusIcon className={`h-4 w-4 text-white p-1 rounded-full ${statusInfo.color}`} />
                          </CardTitle>
                          <CardDescription>
                            Nummer: {table.number}
                            {table.seats && ` • ${table.seats} Plätze`}
                            {table.section && ` • ${table.section}`}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant={table.isActive ? 'default' : 'secondary'} className="text-xs">
                            {table.isActive ? 'Aktiv' : 'Inaktiv'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pb-3">
                      {qrPreview[table.id] ? (
                        <div className="mb-4">
                          <img 
                            src={qrPreview[table.id]} 
                            alt={`QR Code für ${table.name || `Tisch ${table.number}`}`}
                            className="w-24 h-24 mx-auto"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                          <QrCode className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <ExternalLink className="h-3 w-3" />
                        <span className="truncate">/tisch/{table.number}</span>
                      </div>
                    </CardContent>
                    
                    <CardFooter className="pt-2 flex justify-between">
                      <Select 
                        value={table.status} 
                        onValueChange={(status: Table['status']) => {
                          handleUpdateTableStatus(table.id, status)
                        }}
                      >
                        <SelectTrigger className="w-32 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(tableStatuses).map(([status, info]) => (
                            <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <info.icon className={`h-3 w-3 text-white p-0.5 rounded-full ${info.color}`} />
                                {info.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            copyTableUrl(table.number)
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(getTableUrl(table.number), '_blank')
                          }}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditTable(table)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteTable(table.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b">
                      <tr className="text-left">
                        <th className="p-4 font-medium">
                          <input
                            type="checkbox"
                            checked={selectedTables.length === tables.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTables(tables.map(t => t.id))
                              } else {
                                setSelectedTables([])
                              }
                            }}
                            className="rounded"
                          />
                        </th>
                        <th className="p-4 font-medium">Nummer</th>
                        <th className="p-4 font-medium">Name</th>
                        <th className="p-4 font-medium">Bereich</th>
                        <th className="p-4 font-medium">Plätze</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Aktiv</th>
                        <th className="p-4 font-medium">Aktionen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tables.map((table) => {
                        const statusInfo = tableStatuses[table.status]
                        const StatusIcon = statusInfo.icon
                        const isSelected = selectedTables.includes(table.id)
                        
                        return (
                          <tr key={table.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedTables([...selectedTables, table.id])
                                  } else {
                                    setSelectedTables(selectedTables.filter(id => id !== table.id))
                                  }
                                }}
                                className="rounded"
                              />
                            </td>
                            <td className="p-4 font-medium">{table.number}</td>
                            <td className="p-4">{table.name || '-'}</td>
                            <td className="p-4">{table.section || '-'}</td>
                            <td className="p-4">{table.seats || '-'}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`h-4 w-4 text-white p-1 rounded-full ${statusInfo.color}`} />
                                {statusInfo.label}
                              </div>
                            </td>
                            <td className="p-4">
                              <Switch
                                checked={table.isActive}
                                onCheckedChange={(checked) => handleToggleTableActive(table.id, checked)}
                              />
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyTableUrl(table.number)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(getTableUrl(table.number), '_blank')}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditTable(table)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTable(table.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Einzelner Tisch Dialog */}
      <Dialog open={showTableDialog} onOpenChange={setShowTableDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTable ? 'Tisch bearbeiten' : 'Neuer Tisch'}
            </DialogTitle>
            <DialogDescription>
              Fügen Sie einen neuen Tisch hinzu oder bearbeiten Sie einen bestehenden
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableNumber">Nummer *</Label>
                <Input
                  id="tableNumber"
                  type="number"
                  value={tableForm.number}
                  onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="tableSeats">Anzahl Plätze</Label>
                <Input
                  id="tableSeats"
                  type="number"
                  value={tableForm.seats}
                  onChange={(e) => setTableForm({ ...tableForm, seats: e.target.value })}
                  placeholder="4"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="tableName">Name (optional)</Label>
              <Input
                id="tableName"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                placeholder="z.B. Terrasse 1, VIP-Tisch"
              />
            </div>
            
            <div>
              <Label htmlFor="tableSection">Bereich (optional)</Label>
              <Input
                id="tableSection"
                value={tableForm.section}
                onChange={(e) => setTableForm({ ...tableForm, section: e.target.value })}
                placeholder="z.B. Terrasse, Innenbereich, Bar"
              />
              {sections.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Vorhandene Bereiche:</p>
                  <div className="flex gap-1 flex-wrap">
                    {sections.map(section => (
                      <Badge 
                        key={section} 
                        variant="outline" 
                        className="text-xs cursor-pointer"
                        onClick={() => setTableForm({ ...tableForm, section: section || '' })}
                      >
                        {section}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="tableNotes">Notizen (optional)</Label>
              <Input
                id="tableNotes"
                value={tableForm.notes}
                onChange={(e) => setTableForm({ ...tableForm, notes: e.target.value })}
                placeholder="Besondere Hinweise zu diesem Tisch"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tableStatus">Status</Label>
                <Select 
                  value={tableForm.status} 
                  onValueChange={(status: Table['status']) => setTableForm({ ...tableForm, status })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tableStatuses).map(([status, info]) => (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <info.icon className={`h-4 w-4 text-white p-1 rounded-full ${info.color}`} />
                          {info.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="tableActive"
                    checked={tableForm.isActive}
                    onCheckedChange={(checked) => setTableForm({ ...tableForm, isActive: checked })}
                  />
                  <Label htmlFor="tableActive">Tisch ist aktiv</Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTableDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveTable}>
              {editingTable ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={showBatchDialog} onOpenChange={setShowBatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mehrere Tische erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie mehrere Tische auf einmal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startNumber">Von Nummer</Label>
                <Input
                  id="startNumber"
                  type="number"
                  value={batchForm.startNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, startNumber: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label htmlFor="endNumber">Bis Nummer</Label>
                <Input
                  id="endNumber"
                  type="number"
                  value={batchForm.endNumber}
                  onChange={(e) => setBatchForm({ ...batchForm, endNumber: e.target.value })}
                  placeholder="10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="prefix">Name-Präfix</Label>
              <Input
                id="prefix"
                value={batchForm.prefix}
                onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                placeholder="Tisch "
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="batchSeats">Plätze pro Tisch</Label>
                <Input
                  id="batchSeats"
                  type="number"
                  value={batchForm.seats}
                  onChange={(e) => setBatchForm({ ...batchForm, seats: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div>
                <Label htmlFor="batchSection">Bereich (optional)</Label>
                <Input
                  id="batchSection"
                  value={batchForm.section}
                  onChange={(e) => setBatchForm({ ...batchForm, section: e.target.value })}
                  placeholder="z.B. Terrasse"
                />
              </div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Es werden {parseInt(batchForm.endNumber) - parseInt(batchForm.startNumber) + 1} Tische erstellt:
              </p>
              <p className="text-sm font-medium">
                {batchForm.prefix}{batchForm.startNumber} bis {batchForm.prefix}{batchForm.endNumber}
              </p>
              {batchForm.section && (
                <p className="text-sm text-gray-600">
                  Bereich: {batchForm.section}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBatchDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleBatchCreate}>
              Tische erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}