"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Eye
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
  qrCodeUrl?: string | null
}

interface Restaurant {
  id: string
  name: string
  slug: string
}

interface TablesManagerProps {
  restaurant: Restaurant
  initialTables: Table[]
}

export default function TablesManager({ restaurant, initialTables }: TablesManagerProps) {
  const [tables, setTables] = useState<Table[]>(initialTables)
  const [showTableDialog, setShowTableDialog] = useState(false)
  const [showBatchDialog, setShowBatchDialog] = useState(false)
  const [editingTable, setEditingTable] = useState<Table | null>(null)
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Form States
  const [tableForm, setTableForm] = useState({
    number: '',
    name: '',
    seats: '4',
    isActive: true
  })
  
  const [batchForm, setBatchForm] = useState({
    startNumber: '1',
    endNumber: '10',
    prefix: 'Tisch ',
    seats: '4'
  })

  const [qrPreview, setQrPreview] = useState<{ [key: string]: string }>({})

  // Generate QR codes for existing tables on mount
  useEffect(() => {
    const generateExistingQRCodes = async () => {
      const previews: { [key: string]: string } = {}
      
      for (const table of tables) {
        if (table.qrCodeUrl || table.number) {
          const url = table.qrCodeUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurant.slug}/tisch/${table.number}`
          try {
            const qrDataUrl = await QRCode.toDataURL(url, {
              width: 300,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#ffffff',
              },
              errorCorrectionLevel: 'H',
            })
            previews[table.id] = qrDataUrl
          } catch (error) {
            console.error(`Error generating QR code for table ${table.number}:`, error)
          }
        }
      }
      
      setQrPreview(previews)
    }
    
    if (tables.length > 0) {
      generateExistingQRCodes()
    }
  }, [tables, restaurant.slug])

  const handleSaveTable = async () => {
    try {
      const method = editingTable ? 'PATCH' : 'POST'
      const url = editingTable 
        ? `/api/restaurants/${restaurant.id}/tables/${editingTable.id}`
        : `/api/restaurants/${restaurant.id}/tables`
      
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
    
    try {
      const tablesToCreate = []
      for (let i = start; i <= end; i++) {
        tablesToCreate.push({
          number: i,
          name: `${batchForm.prefix}${i}`,
          seats,
          isActive: true
        })
      }
      
      const response = await fetch(`/api/restaurants/${restaurant.id}/tables/batch`, {
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
      const response = await fetch(`/api/restaurants/${restaurant.id}/tables/${tableId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Löschen')

      setTables(tables.filter(table => table.id !== tableId))
      toast.success('Tisch gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Tisches')
    }
  }

  const handleToggleTableActive = async (tableId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/tables/${tableId}`, {
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

  const generateQRCode = async (tableNumber: number) => {
    try {
      const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurant.slug}/tisch/${tableNumber}`
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
      const selectedTablesList = selectedTables.length > 0 
        ? tables.filter(t => selectedTables.includes(t.id))
        : tables
      
      const previews: { [key: string]: string } = {}
      
      for (const table of selectedTablesList) {
        const qrCode = await generateQRCode(table.number)
        if (qrCode) {
          previews[table.id] = qrCode
        }
      }
      
      setQrPreview(previews)
      toast.success('QR-Codes generiert')
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
      
      const selectedTablesList = selectedTables.length > 0 
        ? tables.filter(t => selectedTables.includes(t.id))
        : tables
      
      const response = await fetch('/api/dashboard/tables/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tables: selectedTablesList.map(t => ({
            number: t.number,
            name: t.name
          })),
          restaurantSlug: restaurant.slug,
          restaurantName: restaurant.name
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
      link.download = `qr-codes-${restaurant.slug}.pdf`
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

  const resetTableForm = () => {
    setTableForm({
      number: '',
      name: '',
      seats: '4',
      isActive: true
    })
    setEditingTable(null)
  }

  const resetBatchForm = () => {
    setBatchForm({
      startNumber: '1',
      endNumber: '10',
      prefix: 'Tisch ',
      seats: '4'
    })
  }

  const openEditTable = (table: Table) => {
    setEditingTable(table)
    setTableForm({
      number: table.number.toString(),
      name: table.name || '',
      seats: (table.seats || 4).toString(),
      isActive: table.isActive
    })
    setShowTableDialog(true)
  }

  const getTableUrl = (tableNumber: number) => {
    return `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.oriido.com'}/r/${restaurant.slug}/tisch/${tableNumber}`
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tische & QR-Codes</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Tische und generieren Sie QR-Codes</p>
        </div>
        <div className="flex gap-2">
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
            <CardDescription>QR-Codes</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              size="sm" 
              className="w-full"
              onClick={handleGenerateQRCodes}
              disabled={isGenerating || tables.length === 0}
            >
              {isGenerating ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <QrCode className="mr-2 h-4 w-4" />
              )}
              Generieren
            </Button>
          </CardContent>
        </Card>
      </div>

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
        <>
          {/* QR-Code Actions */}
          {Object.keys(qrPreview).length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>QR-Codes bereit</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadQRCodes}>
                      <Download className="mr-2 h-4 w-4" />
                      Als PDF
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="mr-2 h-4 w-4" />
                      Drucken
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Tische Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tables.map((table) => (
              <Card key={table.id} className={!table.isActive ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {table.name || `Tisch ${table.number}`}
                      </CardTitle>
                      <CardDescription>
                        Nummer: {table.number}
                        {table.seats && ` • ${table.seats} Plätze`}
                      </CardDescription>
                    </div>
                    <Badge variant={table.isActive ? 'default' : 'secondary'}>
                      {table.isActive ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {qrPreview[table.id] ? (
                    <div className="mb-4">
                      <img 
                        src={qrPreview[table.id]} 
                        alt={`QR Code für ${table.name || `Tisch ${table.number}`}`}
                        className="w-32 h-32 mx-auto"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <QrCode className="h-16 w-16 text-gray-300" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <ExternalLink className="h-3 w-3" />
                    <span className="truncate">/r/{restaurant.slug}/tisch/{table.number}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Switch
                    checked={table.isActive}
                    onCheckedChange={(checked) => handleToggleTableActive(table.id, checked)}
                  />
                  <div className="flex gap-1">
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
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
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
            <div>
              <Label htmlFor="tableNumber">Nummer</Label>
              <Input
                id="tableNumber"
                type="number"
                value={tableForm.number}
                onChange={(e) => setTableForm({ ...tableForm, number: e.target.value })}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="tableName">Name (optional)</Label>
              <Input
                id="tableName"
                value={tableForm.name}
                onChange={(e) => setTableForm({ ...tableForm, name: e.target.value })}
                placeholder="z.B. Terrasse 1"
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
            <div className="flex items-center space-x-2">
              <Switch
                id="tableActive"
                checked={tableForm.isActive}
                onCheckedChange={(checked) => setTableForm({ ...tableForm, isActive: checked })}
              />
              <Label htmlFor="tableActive">Tisch ist aktiv</Label>
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
              <Label htmlFor="prefix">Prefix</Label>
              <Input
                id="prefix"
                value={batchForm.prefix}
                onChange={(e) => setBatchForm({ ...batchForm, prefix: e.target.value })}
                placeholder="Tisch "
              />
            </div>
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
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Es werden {parseInt(batchForm.endNumber) - parseInt(batchForm.startNumber) + 1} Tische erstellt:
              </p>
              <p className="text-sm font-medium">
                {batchForm.prefix}{batchForm.startNumber} bis {batchForm.prefix}{batchForm.endNumber}
              </p>
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