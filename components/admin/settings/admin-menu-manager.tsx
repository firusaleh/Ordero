'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
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
  Salad,
  Move,
  Copy,
  MoreVertical,
  Search
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
  order: number
}

interface Category {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  isActive: boolean
  order: number
  menuItems: MenuItem[]
}

interface AdminMenuManagerProps {
  restaurantId: string
}

const iconComponents: { [key: string]: any } = {
  Salad, Pizza, Soup, IceCream, Coffee, Wine, ChefHat
}

const availableIcons = Object.keys(iconComponents)

const defaultAllergens = [
  'Gluten', 'Krebstiere', 'Eier', 'Fisch', 'Erdnüsse', 
  'Soja', 'Milch', 'Nüsse', 'Sellerie', 'Senf', 
  'Sesam', 'Schwefeldioxid', 'Lupinen', 'Weichtiere'
]

const defaultTags = [
  'Vegetarisch', 'Vegan', 'Glutenfrei', 'Laktosefrei', 
  'Scharf', 'Mild', 'Bio', 'Regional', 'Hausgemacht', 
  'Empfehlung des Hauses', 'Neu', 'Saisonal'
]

export default function AdminMenuManager({ restaurantId }: AdminMenuManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  
  // Dialog states
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showBulkDialog, setShowBulkDialog] = useState(false)
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
    allergens: [] as string[],
    tags: [] as string[],
    isActive: true,
    isAvailable: true,
    variants: [] as MenuItemVariant[],
    extras: [] as MenuItemExtra[]
  })
  
  const [variantForm, setVariantForm] = useState({ name: '', price: '' })
  const [extraForm, setExtraForm] = useState({ name: '', price: '' })
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | 'move'>('activate')
  const [bulkTargetCategory, setBulkTargetCategory] = useState('')

  // Load data
  useEffect(() => {
    loadCategories()
  }, [restaurantId])

  const loadCategories = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/restaurants/${restaurantId}/categories`)
      if (!response.ok) throw new Error('Fehler beim Laden der Kategorien')
      
      const data = await response.json()
      setCategories(data.categories || [])
      if (!selectedCategory && data.categories?.length > 0) {
        setSelectedCategory(data.categories[0].id)
      }
    } catch (error) {
      toast.error('Fehler beim Laden der Kategorien')
    } finally {
      setIsLoading(false)
    }
  }

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
        setSelectedCategory(categories.find(cat => cat.id !== categoryId)?.id || null)
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

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return

    const { source, destination, type } = result

    if (type === 'category') {
      // Reorder categories
      const newCategories = Array.from(categories)
      const [reorderedCategory] = newCategories.splice(source.index, 1)
      newCategories.splice(destination.index, 0, reorderedCategory)
      
      setCategories(newCategories)
      
      // Save new order
      try {
        await fetch(`/api/restaurants/${restaurantId}/categories/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categories: newCategories.map((cat, index) => ({
              id: cat.id,
              order: index
            }))
          })
        })
      } catch (error) {
        toast.error('Fehler beim Speichern der Reihenfolge')
        loadCategories()
      }
    } else if (type === 'item') {
      // Reorder items within category
      const category = categories.find(cat => cat.id === selectedCategory)
      if (!category) return

      const newItems = Array.from(category.menuItems)
      const [reorderedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, reorderedItem)

      setCategories(categories.map(cat => 
        cat.id === selectedCategory 
          ? { ...cat, menuItems: newItems }
          : cat
      ))

      // Save new order
      try {
        await fetch(`/api/restaurants/${restaurantId}/items/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: newItems.map((item, index) => ({
              id: item.id,
              order: index
            }))
          })
        })
      } catch (error) {
        toast.error('Fehler beim Speichern der Reihenfolge')
        loadCategories()
      }
    }
  }

  const handleBulkAction = async () => {
    if (selectedItems.length === 0) {
      toast.error('Bitte wählen Sie mindestens einen Artikel aus')
      return
    }

    try {
      let response
      switch (bulkAction) {
        case 'activate':
          response = await fetch(`/api/restaurants/${restaurantId}/items/bulk`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              itemIds: selectedItems, 
              updates: { isActive: true }
            })
          })
          break
        case 'deactivate':
          response = await fetch(`/api/restaurants/${restaurantId}/items/bulk`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              itemIds: selectedItems, 
              updates: { isActive: false }
            })
          })
          break
        case 'delete':
          if (!confirm(`Möchten Sie wirklich ${selectedItems.length} Artikel löschen?`)) {
            return
          }
          response = await fetch(`/api/restaurants/${restaurantId}/items/bulk`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemIds: selectedItems })
          })
          break
        case 'move':
          if (!bulkTargetCategory) {
            toast.error('Bitte wählen Sie eine Zielkategorie aus')
            return
          }
          response = await fetch(`/api/restaurants/${restaurantId}/items/bulk`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              itemIds: selectedItems, 
              updates: { categoryId: bulkTargetCategory }
            })
          })
          break
      }

      if (!response || !response.ok) throw new Error('Fehler beim Ausführen der Aktion')

      toast.success('Massenaktion erfolgreich ausgeführt')
      setSelectedItems([])
      setShowBulkDialog(false)
      loadCategories()
    } catch (error) {
      toast.error('Fehler beim Ausführen der Massenaktion')
    }
  }

  // Helper functions
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
      allergens: [],
      tags: [],
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
      allergens: item.allergens || [],
      tags: item.tags || [],
      isActive: item.isActive,
      isAvailable: item.isAvailable,
      variants: item.variants || [],
      extras: item.extras || []
    })
    setShowItemDialog(true)
  }

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)
  const filteredItems = selectedCategoryData?.menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

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
            <ChefHat className="h-6 w-6" />
            Speisekarte verwalten
          </h2>
          <p className="text-gray-600 mt-2">
            Verwalten Sie Ihre Kategorien und Artikel mit Drag & Drop
          </p>
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
          {selectedItems.length > 0 && (
            <Button 
              variant="outline"
              onClick={() => setShowBulkDialog(true)}
            >
              <MoreVertical className="mr-2 h-4 w-4" />
              Massenbearbeitung ({selectedItems.length})
            </Button>
          )}
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
        <DragDropContext onDragEnd={handleDragEnd}>
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
                <CardContent>
                  <Droppable droppableId="categories" type="category">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {categories.map((category, index) => {
                          const IconComponent = iconComponents[category.icon || 'ChefHat']
                          const isSelected = selectedCategory === category.id
                          
                          return (
                            <Draggable key={category.id} draggableId={category.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                                    isSelected ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border border-transparent'
                                  }`}
                                  onClick={() => setSelectedCategory(category.id)}
                                >
                                  <div className="flex items-center gap-3">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="h-4 w-4 text-gray-400" />
                                    </div>
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
                              )}
                            </Draggable>
                          )
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            </div>

            {/* Artikel Liste */}
            <div className="lg:col-span-2">
              {selectedCategoryData ? (
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>{selectedCategoryData.name}</CardTitle>
                        <CardDescription>
                          {selectedCategoryData.description || 'Artikel in dieser Kategorie'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            placeholder="Artikel suchen..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-64"
                          />
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredItems.length === 0 ? (
                      searchTerm ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500">Keine Artikel gefunden für "{searchTerm}"</p>
                        </div>
                      ) : (
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
                      )
                    ) : (
                      <Droppable droppableId="items" type="item">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {filteredItems.map((item, index) => (
                              <Draggable key={item.id} draggableId={item.id} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="border rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start gap-4">
                                      <div className="flex items-center gap-3">
                                        <div {...provided.dragHandleProps}>
                                          <GripVertical className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <Checkbox
                                          checked={selectedItems.includes(item.id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedItems([...selectedItems, item.id])
                                            } else {
                                              setSelectedItems(selectedItems.filter(id => id !== item.id))
                                            }
                                          }}
                                        />
                                      </div>
                                      
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
                                          <span className="font-medium">€{item.price.toFixed(2)}</span>
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
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
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
        </DragDropContext>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoryIcon">Symbol</Label>
                <Select
                  value={categoryForm.icon}
                  onValueChange={(value) => setCategoryForm({ ...categoryForm, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableIcons.map((iconName) => {
                      const IconComponent = iconComponents[iconName]
                      return (
                        <SelectItem key={iconName} value={iconName}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {iconName}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="categoryColor">Farbe</Label>
                <Input
                  id="categoryColor"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
              </div>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Artikel bearbeiten' : 'Neuer Artikel'}
            </DialogTitle>
            <DialogDescription>
              Fügen Sie einen neuen Artikel zur Speisekarte hinzu
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Grunddaten</TabsTrigger>
              <TabsTrigger value="variants">Varianten</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
              <TabsTrigger value="tags">Tags & Allergene</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="itemPrice">Preis (€)</Label>
                  <Input
                    id="itemPrice"
                    type="number"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="12.50"
                  />
                </div>
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
                          <span className="ml-2 text-gray-600">€{variant.price.toFixed(2)}</span>
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
                          <span className="ml-2 text-gray-600">+€{extra.price.toFixed(2)}</span>
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

            <TabsContent value="tags" className="space-y-4">
              <div>
                <Label>Allergene</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Wählen Sie alle zutreffenden Allergene aus
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {defaultAllergens.map((allergen) => (
                    <div key={allergen} className="flex items-center space-x-2">
                      <Checkbox
                        id={`allergen-${allergen}`}
                        checked={itemForm.allergens.includes(allergen)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setItemForm({
                              ...itemForm,
                              allergens: [...itemForm.allergens, allergen]
                            })
                          } else {
                            setItemForm({
                              ...itemForm,
                              allergens: itemForm.allergens.filter(a => a !== allergen)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`allergen-${allergen}`} className="text-sm">
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Markieren Sie besondere Eigenschaften des Gerichts
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {defaultTags.map((tag) => (
                    <div key={tag} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tag-${tag}`}
                        checked={itemForm.tags.includes(tag)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setItemForm({
                              ...itemForm,
                              tags: [...itemForm.tags, tag]
                            })
                          } else {
                            setItemForm({
                              ...itemForm,
                              tags: itemForm.tags.filter(t => t !== tag)
                            })
                          }
                        }}
                      />
                      <Label htmlFor={`tag-${tag}`} className="text-sm">
                        {tag}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
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

      {/* Massenbearbeitung Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Massenbearbeitung</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie {selectedItems.length} ausgewählte Artikel auf einmal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Aktion wählen</Label>
              <Select value={bulkAction} onValueChange={(value: any) => setBulkAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activate">Alle aktivieren</SelectItem>
                  <SelectItem value="deactivate">Alle deaktivieren</SelectItem>
                  <SelectItem value="move">In andere Kategorie verschieben</SelectItem>
                  <SelectItem value="delete">Alle löschen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {bulkAction === 'move' && (
              <div>
                <Label>Zielkategorie</Label>
                <Select value={bulkTargetCategory} onValueChange={setBulkTargetCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Kategorie wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat.id !== selectedCategory).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleBulkAction} variant={bulkAction === 'delete' ? 'destructive' : 'default'}>
              Ausführen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}