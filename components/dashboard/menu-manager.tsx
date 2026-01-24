"use client"

import { useState } from 'react'
import { useLanguage } from '@/contexts/language-context'
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
  const { t } = useLanguage()
  const { formatPrice, getCurrencySymbol } = useRestaurantCurrency()
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categories[0]?.id || null
  )
  
  // Helper function to translate category names
  const translateCategoryName = (name: string): string => {
    const lowerName = name.toLowerCase()
    // Check common German category names
    if (lowerName === 'vorspeisen' || lowerName === 'appetizers' || lowerName === 'starters') {
      return t('menu.categoryNames.appetizers') || name
    }
    if (lowerName === 'hauptgerichte' || lowerName === 'main courses' || lowerName === 'mains') {
      return t('menu.categoryNames.mainCourses') || name
    }
    if (lowerName === 'nachspeisen' || lowerName === 'desserts') {
      return t('menu.categoryNames.desserts') || name
    }
    if (lowerName === 'getränke' || lowerName === 'beverages' || lowerName === 'drinks') {
      return t('menu.categoryNames.beverages') || name
    }
    return name
  }
  
  // Helper function to translate tags
  const translateTag = (tag: string): string => {
    const lowerTag = tag.toLowerCase()
    if (lowerTag === 'vegetarisch' || lowerTag === 'vegetarian') {
      return t('menu.tagNames.vegetarian') || tag
    }
    if (lowerTag === 'vegan') {
      return t('menu.tagNames.vegan') || tag
    }
    if (lowerTag === 'scharf' || lowerTag === 'spicy') {
      return t('menu.tagNames.spicy') || tag
    }
    if (lowerTag === 'beliebt' || lowerTag === 'popular') {
      return t('menu.tagNames.popular') || tag
    }
    if (lowerTag === 'glutenfrei' || lowerTag === 'glutenfree' || lowerTag === 'gluten-free') {
      return t('menu.tagNames.glutenFree') || tag
    }
    return tag
  }
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

      if (!response.ok) throw new Error(t('menu.errorSaving'))

      const savedCategory = await response.json()
      
      if (editingCategory) {
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? { ...cat, ...categoryForm } : cat
        ))
        toast.success(t('menu.categoryUpdated'))
      } else {
        setCategories([...categories, savedCategory.data])
        toast.success(t('menu.categoryCreated'))
      }
      
      setShowCategoryDialog(false)
      resetCategoryForm()
    } catch (error) {
      toast.error(t('menu.errorSavingCategory'))
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

      if (!response.ok) throw new Error(t('menu.errorSaving'))

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
      
      toast.success(editingItem ? t('menu.itemUpdated') : t('menu.itemCreated'))
      setShowItemDialog(false)
      resetItemForm()
    } catch (error) {
      toast.error(t('menu.errorSavingItem'))
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm(t('menu.confirmDeleteCategory'))) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/categories/${categoryId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error(t('menu.errorDeleting'))

      setCategories(categories.filter(cat => cat.id !== categoryId))
      if (selectedCategory === categoryId) {
        setSelectedCategory(categories[0]?.id || null)
      }
      toast.success(t('menu.categoryDeleted'))
    } catch (error) {
      toast.error(t('menu.errorDeletingCategory'))
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(t('menu.confirmDeleteItem'))) {
      return
    }
    
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error(t('menu.errorDeleting'))

      setCategories(categories.map(cat => ({
        ...cat,
        menuItems: cat.menuItems.filter(item => item.id !== itemId)
      })))
      toast.success(t('menu.itemDeleted'))
    } catch (error) {
      toast.error(t('menu.errorDeletingItem'))
    }
  }

  const handleToggleItemAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const response = await fetch(`/api/restaurants/${restaurantId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      })

      if (!response.ok) throw new Error(t('menu.errorUpdating'))

      setCategories(categories.map(cat => ({
        ...cat,
        menuItems: cat.menuItems.map(item => 
          item.id === itemId ? { ...item, isAvailable } : item
        )
      })))
      
      toast.success(isAvailable ? t('menu.itemAvailable') : t('menu.itemOutOfStock'))
    } catch (error) {
      toast.error(t('menu.errorUpdatingAvailability'))
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
      toast.error(t('menu.pleaseEnterNameAndPrice'))
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
      toast.error(t('menu.pleaseEnterNameAndPrice'))
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
          <h1 className="text-3xl font-bold">{t('menu.title')}</h1>
          <p className="text-gray-600">{t('menu.subtitle')}</p>
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
            {t('menu.addCategory')}
          </Button>
          <Button 
            onClick={() => {
              if (!selectedCategory && categories.length > 0) {
                toast.error(t('menu.selectCategory'))
                return
              }
              resetItemForm()
              setShowItemDialog(true)
            }}
            disabled={categories.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            {t('menu.addItem')}
          </Button>
        </div>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ChefHat}
              title={t('menu.noCategories')}
              description={t('menu.createFirstCategory')}
              action={{
                label: t('menu.addCategory'),
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
                <CardTitle>{t('menu.categories')}</CardTitle>
                <CardDescription>
                  {categories.length} {categories.length === 1 ? t('menu.category') : t('menu.categories')}
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
                          <p className="font-medium">{translateCategoryName(category.name)}</p>
                          <p className="text-sm text-gray-500">
                            {category.menuItems.length} {t('menu.itemsInCategory')}
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
                  <CardTitle>{translateCategoryName(selectedCategoryData.name)}</CardTitle>
                  <CardDescription>
                    {selectedCategoryData.description || `${selectedCategoryData.menuItems.length} ${t('menu.itemsInCategory')}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedCategoryData.menuItems.length === 0 ? (
                    <EmptyState
                      icon={Pizza}
                      title={t('menu.noItems')}
                      description={t('menu.addItemsToCategory')}
                      action={{
                        label: t('menu.addItem'),
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
                                  <Badge variant="secondary">{t('menu.outOfStock')}</Badge>
                                )}
                                {!item.isActive && (
                                  <Badge variant="outline">{t('menu.inactive')}</Badge>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-medium">{formatPrice(item.price)}</span>
                                {item.variants && item.variants.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.variants.length} {item.variants.length === 1 ? t('menu.variant') : t('menu.variants_plural')}
                                  </Badge>
                                )}
                                {item.extras && item.extras.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.extras.length} {item.extras.length === 1 ? t('menu.extra') : t('menu.extras_plural')}
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
                                        {translateTag(tag)}
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
                    title={t('menu.selectCategoryFirst')}
                    description={t('menu.selectCategoryDesc')}
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
              {editingCategory ? t('menu.editCategory') : t('menu.newCategory')}
            </DialogTitle>
            <DialogDescription>
              {t('menu.createEditCategory')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">{t('menu.name')}</Label>
              <Input
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder={t('menu.categoryNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="categoryDescription">{t('menu.description')}</Label>
              <Textarea
                id="categoryDescription"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder={t('menu.categoryDescPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCategoryDialog(false)}>
              {t('menu.cancel')}
            </Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? t('menu.save') : t('menu.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Artikel Dialog */}
      <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t('menu.editItem') : t('menu.newItem')}
            </DialogTitle>
            <DialogDescription>
              {t('menu.addNewMenuItem')}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{t('menu.basic')}</TabsTrigger>
              <TabsTrigger value="variants">{t('menu.variants')}</TabsTrigger>
              <TabsTrigger value="extras">{t('menu.extras')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4">
            <div>
              <Label htmlFor="itemName">{t('menu.name')}</Label>
              <Input
                id="itemName"
                value={itemForm.name}
                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                placeholder={t('menu.itemNamePlaceholder')}
              />
            </div>
            
            <div>
              <Label>{t('menu.image')}</Label>
              <ImageUpload
                value={itemForm.image}
                onChange={(url) => setItemForm({ ...itemForm, image: url })}
                onRemove={() => setItemForm({ ...itemForm, image: '' })}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('menu.imageRecommendation')}
              </p>
            </div>
            
            <div>
              <Label htmlFor="itemDescription">{t('menu.description')}</Label>
              <Textarea
                id="itemDescription"
                value={itemForm.description}
                onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                placeholder={t('menu.itemDescPlaceholder')}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="itemPrice">{t('menu.price')} ({getCurrencySymbol()})</Label>
              <Input
                id="itemPrice"
                type="number"
                step="0.01"
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                placeholder={t('menu.pricePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="itemAllergens">{t('menu.allergens')}</Label>
              <Input
                id="itemAllergens"
                value={itemForm.allergens}
                onChange={(e) => setItemForm({ ...itemForm, allergens: e.target.value })}
                placeholder={t('menu.allergensPlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="itemTags">{t('menu.tags')}</Label>
              <Input
                id="itemTags"
                value={itemForm.tags}
                onChange={(e) => setItemForm({ ...itemForm, tags: e.target.value })}
                placeholder={t('menu.tagsPlaceholder')}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="itemActive"
                  checked={itemForm.isActive}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, isActive: checked })}
                />
                <Label htmlFor="itemActive">{t('menu.active')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="itemAvailable"
                  checked={itemForm.isAvailable}
                  onCheckedChange={(checked) => setItemForm({ ...itemForm, isAvailable: checked })}
                />
                <Label htmlFor="itemAvailable">{t('menu.available')}</Label>
              </div>
            </div>
            </TabsContent>
            
            <TabsContent value="variants" className="space-y-4">
              <div>
                <Label>{t('menu.addVariants')}</Label>
                <p className="text-sm text-gray-600 mb-3">
                  {t('menu.variantsDescription')}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('menu.variantNamePlaceholder')}
                    value={variantForm.name}
                    onChange={(e) => setVariantForm({ ...variantForm, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('menu.price')}
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
                  <Label>{t('menu.existingVariants')}</Label>
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
                  {t('menu.noVariantsAdded')}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="extras" className="space-y-4">
              <div>
                <Label>{t('menu.addExtras')}</Label>
                <p className="text-sm text-gray-600 mb-3">
                  {t('menu.extrasDescription')}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder={t('menu.extraNamePlaceholder')}
                    value={extraForm.name}
                    onChange={(e) => setExtraForm({ ...extraForm, name: e.target.value })}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={t('menu.price')}
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
                  <Label>{t('menu.existingExtras')}</Label>
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
                  {t('menu.noExtrasAdded')}
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemDialog(false)}>
              {t('menu.cancel')}
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? t('menu.save') : t('menu.create')}
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