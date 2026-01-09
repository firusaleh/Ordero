"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Minus,
  Download,
  QrCode,
  Loader2,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import Stepper from '@/components/onboarding/stepper'
import { cn } from '@/lib/utils'

const steps = [
  { id: 1, name: 'Restaurant', description: 'Grunddaten', href: '/onboarding' },
  { id: 2, name: 'Plan', description: 'Wählen', href: '/onboarding/plan' },
  { id: 3, name: 'Speisekarte', description: 'Erstellen', href: '/onboarding/menu' },
  { id: 4, name: 'Tische', description: 'QR-Codes', href: '/onboarding/tables' },
  { id: 5, name: 'Fertig', description: 'Los geht\'s', href: '/onboarding/complete' },
]

interface Table {
  number: number
  name: string
  seats: number
}

export default function TablesSetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [tableCount, setTableCount] = useState(10)
  const [customTables, setCustomTables] = useState<Table[]>([])
  const [useCustomNames, setUseCustomNames] = useState(false)

  const handleTableCountChange = (delta: number) => {
    const newCount = tableCount + delta
    if (newCount >= 1 && newCount <= 100) {
      setTableCount(newCount)
      
      // Passe customTables an
      if (newCount > customTables.length) {
        const newTables = [...customTables]
        for (let i = customTables.length; i < newCount; i++) {
          newTables.push({
            number: i + 1,
            name: `Tisch ${i + 1}`,
            seats: 4
          })
        }
        setCustomTables(newTables)
      } else {
        setCustomTables(customTables.slice(0, newCount))
      }
    }
  }

  const updateTableName = (index: number, name: string) => {
    const updated = [...customTables]
    updated[index].name = name
    setCustomTables(updated)
  }

  const updateTableSeats = (index: number, seats: number) => {
    const updated = [...customTables]
    updated[index].seats = Math.max(1, Math.min(20, seats))
    setCustomTables(updated)
  }

  const handleContinue = async () => {
    setIsLoading(true)
    
    try {
      const tables = useCustomNames ? customTables : 
        Array.from({ length: tableCount }, (_, i) => ({
          number: i + 1,
          name: `Tisch ${i + 1}`,
          seats: 4
        }))

      const response = await fetch('/api/onboarding/tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tables }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }

      toast.success(`${tableCount} Tische erstellt!`)
      router.push('/onboarding/complete')
    } catch (error) {
      toast.error('Fehler', {
        description: 'Bitte versuchen Sie es erneut.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Initialisiere customTables wenn nötig
  if (customTables.length === 0 && tableCount > 0) {
    setCustomTables(
      Array.from({ length: tableCount }, (_, i) => ({
        number: i + 1,
        name: `Tisch ${i + 1}`,
        seats: 4
      }))
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper steps={steps} currentStep={3} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tische & QR-Codes einrichten</h1>
        <p className="text-gray-600">
          Erstellen Sie QR-Codes für Ihre Tische. Gäste scannen diese, um die Speisekarte zu sehen und zu bestellen.
        </p>
      </div>

      {/* Anzahl der Tische */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Wie viele Tische haben Sie?</CardTitle>
          <CardDescription>
            Wir erstellen automatisch QR-Codes für jeden Tisch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTableCountChange(-1)}
              disabled={tableCount <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <div className="flex-1 max-w-xs">
              <div className="relative">
                <Input
                  type="number"
                  value={tableCount}
                  onChange={(e) => {
                    const val = parseInt(e.target.value)
                    if (!isNaN(val) && val >= 1 && val <= 100) {
                      setTableCount(val)
                    }
                  }}
                  className="text-center text-2xl font-bold h-16"
                  min="1"
                  max="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                  Tische
                </span>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleTableCountChange(1)}
              disabled={tableCount >= 100}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              Sie können später jederzeit weitere Tische hinzufügen oder entfernen
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Tisch-Namen anpassen */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tisch-Bezeichnungen</CardTitle>
              <CardDescription>
                Optional: Geben Sie den Tischen individuelle Namen
              </CardDescription>
            </div>
            <Button
              variant={useCustomNames ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUseCustomNames(!useCustomNames)}
            >
              {useCustomNames ? 'Anpassen aktiv' : 'Anpassen'}
            </Button>
          </div>
        </CardHeader>
        
        {useCustomNames && (
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 max-h-64 overflow-y-auto">
              {customTables.map((table, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Badge variant="secondary" className="w-12 justify-center">
                    {table.number}
                  </Badge>
                  <Input
                    value={table.name}
                    onChange={(e) => updateTableName(index, e.target.value)}
                    placeholder={`Tisch ${table.number}`}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-1">
                    <Label className="text-xs text-gray-500">Plätze:</Label>
                    <Input
                      type="number"
                      value={table.seats}
                      onChange={(e) => updateTableSeats(index, parseInt(e.target.value) || 1)}
                      className="w-16"
                      min="1"
                      max="20"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* QR-Code Vorschau */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>QR-Code Vorschau</CardTitle>
          <CardDescription>
            So werden Ihre QR-Codes aussehen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 text-center">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <QrCode className="h-20 w-20 text-gray-400" />
              </div>
              <p className="font-medium">Restaurant Name</p>
              <p className="text-sm text-gray-500">Tisch 1</p>
            </div>
            
            <div className="border rounded-lg p-4 text-center opacity-60">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <QrCode className="h-20 w-20 text-gray-400" />
              </div>
              <p className="font-medium">Restaurant Name</p>
              <p className="text-sm text-gray-500">Tisch 2</p>
            </div>
            
            <div className="border rounded-lg p-4 text-center opacity-30">
              <div className="w-32 h-32 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <QrCode className="h-20 w-20 text-gray-400" />
              </div>
              <p className="font-medium">Restaurant Name</p>
              <p className="text-sm text-gray-500">Tisch 3</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800">
              Nach dem Setup können Sie alle QR-Codes als PDF herunterladen und ausdrucken
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Fast fertig! Im nächsten Schritt schließen Sie das Setup ab.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/onboarding/menu')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Erstellen...
                  </>
                ) : (
                  <>
                    Tische erstellen
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}