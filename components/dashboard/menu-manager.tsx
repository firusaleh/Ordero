"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'
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
  GripVertical,
  Image as ImageIcon,
  Euro,
  Tag,
  Info,
  ChefHat,
  Coffee,
  Pizza,
  Soup,
  Wine,
  IceCream,
  Salad
} from 'lucide-react'
import { toast } from 'sonner'
import EmptyState from '@/components/shared/empty-state'
import { ImageUpload } from '@/components/image-upload'

interface MenuItemVariant {
  id: string
  name: string
  price: number
}

interface MenuItemExtra {
  id: string
  name: string
  price: number
}

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isActive: boolean
  isAvailable: boolean
  allergens: string[]
  tags: string[]
  variants: MenuItemVariant[]
  extras: MenuItemExtra[]
}

interface Category {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  isActive: boolean
  menuItems: MenuItem[]
}

interface MenuManagerProps {
  restaurantId: string
  initialCategories: Category[]
}

const iconComponents: { [key: string]: any } = {
  Salad, Pizza, Soup, IceCream, Coffee, Wine, ChefHat
}

export default function MenuManager({ restaurantId, initialCategories }: MenuManagerProps) {
  const { formatPrice, getCurrencySymbol } = useRestaurantCurrency()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0]?.id || null
  )
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  
  // Form States
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    icon: 'ChefHat',
    color: '#3b82f6'
  })
  
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    allergens: '',
    tags: '',
    isActive: true,
    isAvailable: true,
    variants: [] as MenuItemVariant[],
    extras: [] as MenuItemExtra[]
  })
  
  const [variantForm, setVariantForm] = useState({ name: '', price: '' })
  const [extraForm, setExtraForm] = useState({ name: '', price: '' })

  const handleSaveCategory = async () => {
    try {
      const method = editingCategory ? 'PATCH' : 'POST'
      const url = editingCategory 
        ? `/api/restaurants/${restaurantId}/categories/${editingCategory.id}`
        : `/api/restaurants/${restaurantId}/categories`
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      const savedCategory = await response.json()
      
      if (editingCategory) {
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, ...categoryForm } : cat
        ))
        toast.success('Kategorie aktualisiert')
      } else {
        setCategories([...categories, savedCategory.data])
        toast.success('Kategorie erstellt')
      }
      
      setShowCategoryDialog(false)
      resetCategoryForm()
    } catch (error) {
      toast.error('Fehler beim Speichern der Kategorie')
    }
  }

  const handleSaveItem = async () => {
    if (!selectedCategory) return
    
    try {
      const method = editingItem ? 'PATCH' : 'POST'
      const url = editingItem 
        ? `/api/restaurants/${restaurantId}/items/${editingItem.id}`
        : `/api/restaurants/${restaurantId}/items`
      
      const itemData = {
        ...itemForm,
        categoryId: selectedCategory,
        price: parseFloat(itemForm.price),
        image: itemForm.image || null,
        allergens: itemForm.allergens.split(',').filter(Boolean).map(a => a.trim()),
        tags: itemForm.tags.split(',').filter(Boolean).map(t => t.trim()),
        variants: itemForm.variants,
        extras: itemForm.extras
      }
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData)
      })

      if (!response.ok) throw new Error('Fehler beim Speichern')

      const savedItem = await response.json()
      
      setCategories(categories.map(cat => {
        if (cat.id === selectedCategory) {
          if (editingItem) {
            return {
              ...cat,
              menuItems: cat.menuItems.map(item => 
                item.id === editingItem.id ? { ...item, ...itemData } : item
              )
            }
          } else {
            return {
              ...cat,
              menuItems: [...cat.menuItems, savedItem.data]
            }
          }
        }
        return cat
      }))
      
      toast.success(editingItem ? 'Artikel aktualisiert' : 'Artikel erstellt')
      setShowItemDialog(false)
      resetItemForm()
    } catch (error) {
      toast.error('Fehler beim Speichern des Artikels')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Möchten Sie diese Kategorie wirklich löschen? Alle Artikel werden ebenfalls gelöscht.')) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Löschen')

      setCategories(categories.filter(cat => cat.id !== categoryId))
      if (selectedCategory === categoryId) {
        setSelectedCategory(categories[0]?.id || null)
      }
      toast.success('Kategorie gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen der Kategorie')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Möchten Sie diesen Artikel wirklich löschen?')) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Fehler beim Löschen')

      setCategories(categories.map(cat => ({
        ...cat,
        menuItems: cat.menuItems.filter(item => item.id !== itemId)
      })))
      toast.success('Artikel gelöscht')
    } catch (error) {
      toast.error('Fehler beim Löschen des Artikels')
    }
  }

  const handleToggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      })

      if (!response.ok) throw new Error('Fehler beim Aktualisieren')

      setCategories(categories.map(cat => ({
        ...cat,
        menuItems: cat.menuItems.map(item => 
          item.id === itemId ? { ...item, isAvailable } : item
        )
      })))
      
      toast.success(isAvailable ? 'Artikel ist verfügbar' : 'Artikel ist ausverkauft')
    } catch (error) {
      toast.error('Fehler beim Aktualisieren der Verfügbarkeit')
    }
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      icon: 'ChefHat',
      color: '#3b82f6'
    })
    setEditingCategory(null)
  }

  const resetItemForm = () => {
    setItemForm({
      name: '',
      description: '',
      price: '',
      image: '',
      allergens: '',
      tags: '',
      isActive: true,
      isAvailable: true,
      variants: [],
      extras: []
    })
    setEditingItem(null)
    setVariantForm({ name: '', price: '' })
    setExtraForm({ name: '', price: '' })
  }
  
  const addVariant = () => {
    if (!variantForm.name || !variantForm.price) {
      toast.error('Bitte Name und Preis eingeben')
      return
    }
    const newVariant: MenuItemVariant = {
      id: Date.now().toString(),
      name: variantForm.name,
      price: parseFloat(variantForm.price)
    }
    setItemForm({ ...itemForm, variants: [...itemForm.variants, newVariant] })
    setVariantForm({ name: '', price: '' })
  }
  
  const removeVariant = (id: string) => {
    setItemForm({
      ...itemForm,
      variants: itemForm.variants.filter(v => v.id !== id)
    })
  }
  
  const addExtra = () => {
    if (!extraForm.name || !extraForm.price) {
      toast.error('Bitte Name und Preis eingeben')
      return
    }
    const newExtra: MenuItemExtra = {
      id: Date.now().toString(),
      name: extraForm.name,
      price: parseFloat(extraForm.price)
    }
    setItemForm({ ...itemForm, extras: [...itemForm.extras, newExtra] })
    setExtraForm({ name: '', price: '' })
  }
  
  const removeExtra = (id: string) => {
    setItemForm({
      ...itemForm,
      extras: itemForm.extras.filter(e => e.id !== id)
    })
  }

  const openEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'ChefHat',
      color: category.color || '#3b82f6'
    })
    setShowCategoryDialog(true)
  }

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image: item.image || '',
      allergens: item.allergens.join(', '),
      tags: item.tags.join(', '),
      isActive: item.isActive,
      isAvailable: item.isAvailable,
      variants: item.variants || [],
      extras: item.extras || []
    })
    setShowItemDialog(true)
  }

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Speisekarte</h1>
          <p className="text-gray-600">Verwalten Sie Ihre Kategorien und Artikel</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => {
              resetCategoryForm()
              setShowCategoryDialog(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Kategorie
          </Button>
          <Button 
            onClick={() => {
              if (!selectedCategory && categories.length > 0) {
                toast.error('Bitte wählen Sie zuerst eine Kategorie')
                return
              }
              resetItemForm()
              setShowItemDialog(true)
            }}
            disabled={categories.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Artikel
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ChefHat}
              title="Keine Kategorien"
              description="Erstellen Sie Ihre erste Kategorie, um Artikel hinzuzufügen"
              action={{
                label: 'Kategorie erstellen',
                onClick: () => {
                  resetCategoryForm()
                  setShowCategoryDialog(true)
                }
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Kategorien Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Kategorien</CardTitle>
                <CardDescription>
                  {categories.length} {categories.length === 1 ? 'Kategorie' : 'Kategorien'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const IconComponent = iconComponents[category.icon || 'ChefHat']
                  const isSelected = selectedCategory === category.id
                  
                  return (
                    <div
                      key={category.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                        isSelected ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50'
                      )}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: (category.color || '#3b82f6') + '20' }}
                        >
                          {IconComponent && (
                            <IconComponent 
                              className="h-5 w-5" 
                              style={{ color: category.color || '#3b82f6' }}
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">
                            {category.menuItems.length} Artikel
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditCategory(category)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteCategory(category.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Artikel Liste */}
          <div className="lg:col-span-2">
            {selectedCategoryData ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedCategoryData.name}</CardTitle>
                  <CardDescription>
                    {selectedCategoryData.description || 'Artikel in dieser Kategorie'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCategoryData.menuItems.length === 0 ? (
                    <EmptyState
                      icon={Pizza}
                      title="Keine Artikel"
                      description="Fügen Sie Artikel zu dieser Kategorie hinzu"
                      action={{
                        label: 'Artikel hinzufügen',
                        onClick: () => {
                          resetItemForm()
                          setShowItemDialog(true)
                        }
                      }}
                    />
                  ) : (
                    <div className="space-y-4">
                      {selectedCategoryData.menuItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start gap-4">
                            {item.image && (
                              <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{item.name}</h4>
                                {!item.isAvailable && (
                                  <Badge variant="secondary">Ausverkauft</Badge>
                                )}
                                {!item.isActive && (
                                  <Badge variant="outline">Inaktiv</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-medium">{formatPrice(item.price)}</span>
                                {item.variants && item.variants.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.variants.length} Variante{item.variants.length > 1 ? 'n' : ''}
                                  </Badge>
                                )}
                                {item.extras && item.extras.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.extras.length} Extra{item.extras.length > 1 ? 's' : ''}
                                  </Badge>
                                )}
                                {item.allergens.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Info className="h-3 w-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {item.allergens.join(', ')}
                                    </span>
                                  </div>
                                )}
                                {item.tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {item.tags.map((tag) => (
                                      <Badge key={tag} variant="outline" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={item.isAvailable}
                                onCheckedChange={(checked) => handleToggleItemAvailability(item.id, checked)}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Pizza}
                    title="Kategorie wählen"
                    description="Wählen Sie eine Kategorie aus, um die Artikel zu sehen"
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Kategorie Dialog */}
      <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
            </DialogTitle>
            <DialogDescription>
              Erstellen oder bearbeiten Sie eine Kategorie für Ihre Speisekarte
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Name</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="z.B. Hauptgerichte"
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">Beschreibung (optional)</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Beschreiben Sie diese Kategorie..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Artikel Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </DialogTitle>
            <DialogDescription>
              Fügen Sie einen neuen Artikel zur Speisekarte hinzu
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Grunddaten</TabsTrigger>
              <TabsTrigger value="variants">Varianten</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="itemName">Name</Label>
              <Input
                id="itemName"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder="z.B. Pizza Margherita"
              />
            </div>
            
            <div>
              <Label>Bild</Label>
              <ImageUpload
                value={itemForm.image}
                onChange={(url) => setItemForm({ ...itemForm, image: url })}
                onRemove={() => setItemForm({ ...itemForm, image: '' })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Empfohlen: 800x600px, max. 2MB
              </p>
            </div>
            
            <div>
              <Label htmlFor="itemDescription">Beschreibung (optional)</Label>
              <Textarea
                id="itemDescription"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder="Beschreiben Sie das Gericht..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="itemPrice">Preis ({getCurrencySymbol()})</Label>
              <Input
                id="itemPrice"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder="12.50"
              />
            </div>
            <div>
              <Label htmlFor="itemAllergens">Allergene (kommagetrennt)</Label>
              <Input
                id="itemAllergens"
                value={itemForm.allergens}
                onChange={(e) => setItemForm({ ...itemForm, allergens: e.target.value })}
                placeholder="Gluten, Milch, Eier"
              />
            </div>
            <div>
              <Label htmlFor="itemTags">Tags (kommagetrennt)</Label>
              <Input
                id="itemTags"
                value={itemForm.tags}
                onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                placeholder="vegetarisch, scharf, vegan"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="itemActive"
                  checked={itemForm.isActive}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, isActive: checked })}
                />
                <Label htmlFor="itemActive">Aktiv</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="itemAvailable"
                  checked={itemForm.isAvailable}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, isAvailable: checked })}
                />
                <Label htmlFor="itemAvailable">Verfügbar</Label>
              </div>
            </div>
            </TabsContent>
            
            <TabsContent value="variants" className="space-y-4">
              <div>
                <Label>Varianten hinzufügen</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Fügen Sie verschiedene Größen oder Varianten hinzu (z.B. Klein, Mittel, Groß)
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name (z.B. Klein)"
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preis"
                    value={variantForm.price}
                    onChange={(e) => setVariantForm({ ...variantForm, price: e.target.value })}
                    className="w-32"
                  />
                  <Button type="button" onClick={addVariant}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {itemForm.variants.length > 0 && (
                <div>
                  <Label>Vorhandene Varianten</Label>
                  <div className="space-y-2 mt-2">
                    {itemForm.variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{variant.name}</span>
                          <span className="ml-2 text-gray-600">{formatPrice(variant.price)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(variant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {itemForm.variants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Keine Varianten hinzugefügt
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="extras" className="space-y-4">
              <div>
                <Label>Extras hinzufügen</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Fügen Sie optionale Extras hinzu (z.B. Extra Käse, Bacon)
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Name (z.B. Extra Käse)"
                    value={extraForm.name}
                    onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Preis"
                    value={extraForm.price}
                    onChange={(e) => setExtraForm({ ...extraForm, price: e.target.value })}
                    className="w-32"
                  />
                  <Button type="button" onClick={addExtra}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {itemForm.extras.length > 0 && (
                <div>
                  <Label>Vorhandene Extras</Label>
                  <div className="space-y-2 mt-2">
                    {itemForm.extras.map((extra) => (
                      <div key={extra.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <span className="font-medium">{extra.name}</span>
                          <span className="ml-2 text-gray-600">+{formatPrice(extra.price)}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExtra(extra.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {itemForm.extras.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Keine Extras hinzugefügt
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}