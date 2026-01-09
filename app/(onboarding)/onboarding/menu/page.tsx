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
  Trash2, 
  Loader2,
  Coffee,
  Pizza,
  Soup,
  Wine,
  IceCream,
  Salad
} from 'lucide-react'
import { toast } from 'sonner'
import Stepper from '@/components/onboarding/stepper'

const steps = [
  { id: 1, name: 'Restaurant', description: 'Grunddaten', href: '/onboarding' },
  { id: 2, name: 'Plan', description: 'Wählen', href: '/onboarding/plan' },
  { id: 3, name: 'Speisekarte', description: 'Erstellen', href: '/onboarding/menu' },
  { id: 4, name: 'Tische', description: 'QR-Codes', href: '/onboarding/tables' },
  { id: 5, name: 'Fertig', description: 'Los geht\'s', href: '/onboarding/complete' },
]

const defaultCategories = [
  { name: 'Vorspeisen', icon: 'Salad', color: '#10b981' },
  { name: 'Hauptgerichte', icon: 'Pizza', color: '#3b82f6' },
  { name: 'Suppen', icon: 'Soup', color: '#f59e0b' },
  { name: 'Desserts', icon: 'IceCream', color: '#ec4899' },
  { name: 'Getränke', icon: 'Coffee', color: '#8b5cf6' },
  { name: 'Weine', icon: 'Wine', color: '#ef4444' },
]

const iconComponents: { [key: string]: any } = {
  Salad, Pizza, Soup, IceCream, Coffee, Wine
}

interface Category {
  name: string
  icon: string
  color: string
  itemCount?: number
}

interface MenuItem {
  name: string
  price: string
  categoryIndex: number
}

export default function MenuSetupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [showAddItem, setShowAddItem] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', price: '', categoryIndex: 0 })

  const handleAddCategory = () => {
    const name = prompt('Name der neuen Kategorie:')
    if (name) {
      setCategories([...categories, {
        name,
        icon: 'Pizza',
        color: '#3b82f6'
      }])
    }
  }

  const handleRemoveCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index))
    // Entferne auch alle Items dieser Kategorie
    setMenuItems(menuItems.filter(item => item.categoryIndex !== index))
  }

  const handleAddItem = () => {
    if (newItem.name && newItem.price) {
      setMenuItems([...menuItems, {
        ...newItem,
        price: parseFloat(newItem.price).toFixed(2)
      }])
      setNewItem({ name: '', price: '', categoryIndex: 0 })
      setShowAddItem(false)
    }
  }

  const handleRemoveItem = (index: number) => {
    setMenuItems(menuItems.filter((_, i) => i !== index))
  }

  const handleContinue = async () => {
    if (categories.length === 0) {
      toast.error('Bitte fügen Sie mindestens eine Kategorie hinzu')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/onboarding/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories, menuItems }),
      })

      if (!response.ok) {
        throw new Error('Fehler beim Speichern')
      }

      toast.success('Speisekarte gespeichert!')
      router.push('/onboarding/tables')
    } catch (error) {
      toast.error('Fehler', {
        description: 'Bitte versuchen Sie es erneut.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryItemCount = (index: number) => {
    return menuItems.filter(item => item.categoryIndex === index).length
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Stepper steps={steps} currentStep={2} />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Speisekarte erstellen</h1>
        <p className="text-gray-600">
          Fügen Sie Kategorien hinzu und optional einige Beispiel-Artikel. Sie können die Speisekarte später jederzeit bearbeiten.
        </p>
      </div>

      {/* Kategorien */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Kategorien</CardTitle>
              <CardDescription>
                Organisieren Sie Ihre Speisekarte in Kategorien
              </CardDescription>
            </div>
            <Button onClick={handleAddCategory} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Kategorie
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {categories.map((category, index) => {
              const IconComponent = iconComponents[category.icon]
              const itemCount = getCategoryItemCount(index)
              
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                  style={{ borderColor: category.color + '40' }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      {IconComponent && (
                        <IconComponent 
                          className="h-5 w-5" 
                          style={{ color: category.color }}
                        />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-gray-500">
                        {itemCount} {itemCount === 1 ? 'Artikel' : 'Artikel'}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCategory(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Beispiel-Artikel */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Beispiel-Artikel (Optional)</CardTitle>
              <CardDescription>
                Fügen Sie einige Artikel hinzu, um Ihre Speisekarte zu starten
              </CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddItem(true)} 
              size="sm"
              disabled={categories.length === 0}
            >
              <Plus className="mr-2 h-4 w-4" />
              Artikel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddItem && (
            <div className="mb-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <Label htmlFor="itemName">Name</Label>
                  <Input
                    id="itemName"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="z.B. Pizza Margherita"
                  />
                </div>
                <div>
                  <Label htmlFor="itemPrice">Preis (€)</Label>
                  <Input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="12.50"
                  />
                </div>
                <div>
                  <Label htmlFor="itemCategory">Kategorie</Label>
                  <select
                    id="itemCategory"
                    className="w-full h-10 px-3 rounded-md border border-gray-200"
                    value={newItem.categoryIndex}
                    onChange={(e) => setNewItem({ ...newItem, categoryIndex: parseInt(e.target.value) })}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={idx}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={handleAddItem}>
                  Hinzufügen
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setShowAddItem(false)
                    setNewItem({ name: '', price: '', categoryIndex: 0 })
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}

          {menuItems.length > 0 ? (
            <div className="space-y-2">
              {menuItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {categories[item.categoryIndex]?.name}
                      </Badge>
                      <span className="text-sm text-gray-500">€{item.price}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">
              Noch keine Artikel hinzugefügt
            </p>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Sie können die Speisekarte später im Dashboard vollständig bearbeiten
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push('/onboarding/plan')}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button
                onClick={handleContinue}
                disabled={isLoading || categories.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Speichern...
                  </>
                ) : (
                  <>
                    Weiter
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