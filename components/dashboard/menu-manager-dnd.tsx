"use client"

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  MeasuringStrategy
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Edit, Trash2, GripVertical, Plus, ChefHat } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/contexts/language-context'
import { useRestaurantCurrency } from '@/hooks/use-restaurant-currency'

interface MenuItem {
  id: string
  name: string
  description?: string | null
  price: number
  image?: string | null
  isActive: boolean
  isAvailable: boolean
  isDailySpecial?: boolean
  isFeatured?: boolean
  specialPrice?: number | null
  allergens: string[]
  tags: string[]
  variants: any[]
  extras: any[]
  categoryId?: string
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

interface MenuManagerDnDProps {
  restaurantId: string
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (categoryId: string) => void
  onAddItem: () => void
  onEditItem: (item: MenuItem) => void
  onDeleteItem: (itemId: string) => void
  onToggleItemAvailability: (itemId: string, isAvailable: boolean) => void
  onItemsReorder?: (items: MenuItem[]) => void
}

// Draggable Menu Item Component
function DraggableMenuItem({ 
  item, 
  isDragging,
  formatPrice,
  onEdit,
  onDelete,
  onToggleAvailability 
}: {
  item: MenuItem
  isDragging?: boolean
  formatPrice: (price: number) => string
  onEdit: () => void
  onDelete: () => void
  onToggleAvailability: (isAvailable: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-white border rounded-lg p-4 mb-3",
        isDragging && "shadow-lg"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        )}
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-medium">{item.name}</h4>
                {item.isDailySpecial && (
                  <Badge variant="secondary" className="text-xs">
                    Tagesgericht
                  </Badge>
                )}
                {item.isFeatured && (
                  <Badge variant="default" className="text-xs">
                    Empfohlen
                  </Badge>
                )}
              </div>
              {item.description && (
                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2">
                <span className="font-semibold">
                  {item.specialPrice ? (
                    <>
                      <span className="line-through text-gray-400 text-sm mr-2">
                        {formatPrice(item.price)}
                      </span>
                      <span className="text-red-600">{formatPrice(item.specialPrice)}</span>
                    </>
                  ) : (
                    formatPrice(item.price)
                  )}
                </span>
                <Switch
                  checked={item.isAvailable}
                  onCheckedChange={onToggleAvailability}
                />
                <span className="text-sm text-gray-500">
                  {item.isAvailable ? 'Verfügbar' : 'Ausverkauft'}
                </span>
              </div>
            </div>
            
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Droppable Category Component
function DroppableCategory({ 
  category, 
  isSelected,
  isOver,
  children,
  onSelect,
  onEdit,
  onDelete,
  formatCategoryName
}: {
  category: Category
  isSelected: boolean
  isOver: boolean
  children: React.ReactNode
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  formatCategoryName: (name: string) => string
}) {
  const iconComponents: { [key: string]: any } = {
    ChefHat
  }
  const IconComponent = iconComponents[category?.icon || 'ChefHat'] || ChefHat

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all',
        isSelected ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50',
        isOver && !isSelected && 'bg-green-50 border-green-200 border-2'
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: (category?.color || '#3b82f6') + '20' }}
        >
          <IconComponent 
            className="h-5 w-5" 
            style={{ color: category?.color || '#3b82f6' }}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{formatCategoryName(category?.name || '')}</p>
            {!category?.isActive && (
              <Badge variant="secondary" className="text-xs">
                Inaktiv
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {category?.menuItems?.length || 0} Artikel
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function MenuManagerDnD({
  restaurantId,
  categories,
  selectedCategory,
  onCategorySelect,
  onEditCategory,
  onDeleteCategory,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItemAvailability,
  onItemsReorder
}: MenuManagerDnDProps) {
  const { t } = useLanguage()
  const { formatPrice } = useRestaurantCurrency(restaurantId)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const [localCategories, setLocalCategories] = useState(categories)

  // Update local categories when props change
  useState(() => {
    setLocalCategories(categories)
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const selectedCategoryData = localCategories.find(cat => cat.id === selectedCategory)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString())
  }

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over
    if (!over) {
      setOverId(null)
      return
    }

    const overId = over.id.toString()
    setOverId(overId)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) {
      setActiveId(null)
      setOverId(null)
      return
    }

    const activeId = active.id.toString()
    const overId = over.id.toString()

    // Find the item being dragged
    let draggedItem: MenuItem | undefined
    let sourceCategory: Category | undefined
    
    for (const category of localCategories) {
      const item = category.menuItems.find(item => item.id === activeId)
      if (item) {
        draggedItem = item
        sourceCategory = category
        break
      }
    }

    if (!draggedItem || !sourceCategory) {
      setActiveId(null)
      setOverId(null)
      return
    }

    // Check if dropped on a category
    const targetCategory = localCategories.find(cat => cat.id === overId)
    
    if (targetCategory && targetCategory.id !== sourceCategory.id) {
      // Move item to different category
      try {
        // Update backend
        const response = await fetch(`/api/restaurants/${restaurantId}/items/${activeId}/category`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryId: targetCategory.id })
        })

        if (!response.ok) throw new Error('Failed to move item')

        // Update local state
        setLocalCategories(prev => prev.map(cat => {
          if (cat.id === sourceCategory.id) {
            return {
              ...cat,
              menuItems: cat.menuItems.filter(item => item.id !== activeId)
            }
          }
          if (cat.id === targetCategory.id) {
            return {
              ...cat,
              menuItems: [...cat.menuItems, { ...draggedItem, categoryId: targetCategory.id }]
            }
          }
          return cat
        }))

        toast.success(`${draggedItem.name} wurde nach ${targetCategory.name} verschoben`)
      } catch (error) {
        toast.error('Fehler beim Verschieben des Artikels')
      }
    } else if (overId !== activeId && sourceCategory.id === selectedCategory) {
      // Reorder within same category
      const oldIndex = sourceCategory.menuItems.findIndex(item => item.id === activeId)
      const newIndex = sourceCategory.menuItems.findIndex(item => item.id === overId)
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(sourceCategory.menuItems, oldIndex, newIndex)
        
        setLocalCategories(prev => prev.map(cat => 
          cat.id === sourceCategory.id 
            ? { ...cat, menuItems: newItems }
            : cat
        ))

        if (onItemsReorder) {
          onItemsReorder(newItems)
        }
      }
    }

    setActiveId(null)
    setOverId(null)
  }

  const translateCategoryName = (name: string): string => {
    const lowerName = name.toLowerCase()
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

  const activeItem = activeId 
    ? localCategories.flatMap(cat => cat.menuItems).find(item => item.id === activeId)
    : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.Always
        }
      }}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{t('menu.categories')}</CardTitle>
              <CardDescription>
                {localCategories.length} {localCategories.length === 1 ? t('menu.category') : t('menu.categories')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {localCategories.map((category) => (
                <DroppableCategory
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory === category.id}
                  isOver={overId === category.id && activeId !== null}
                  onSelect={() => onCategorySelect(category.id)}
                  onEdit={() => onEditCategory(category)}
                  onDelete={() => onDeleteCategory(category.id)}
                  formatCategoryName={translateCategoryName}
                >
                  <div />
                </DroppableCategory>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Items List */}
        <div className="lg:col-span-2">
          {selectedCategoryData ? (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{translateCategoryName(selectedCategoryData.name)}</CardTitle>
                    <CardDescription>
                      {selectedCategoryData.description || `${selectedCategoryData.menuItems.length} ${t('menu.itemsInCategory')}`}
                    </CardDescription>
                  </div>
                  <Button onClick={onAddItem}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('menu.addItem')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedCategoryData.menuItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>{t('menu.noItems')}</p>
                    <p className="text-sm">{t('menu.addItemsToCategory')}</p>
                  </div>
                ) : (
                  <SortableContext
                    items={selectedCategoryData.menuItems.map(item => item.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-3">
                      {selectedCategoryData.menuItems.map((item) => (
                        <DraggableMenuItem
                          key={item.id}
                          item={item}
                          isDragging={activeId === item.id}
                          formatPrice={formatPrice}
                          onEdit={() => onEditItem(item)}
                          onDelete={() => onDeleteItem(item.id)}
                          onToggleAvailability={(isAvailable) => 
                            onToggleItemAvailability(item.id, isAvailable)
                          }
                        />
                      ))}
                    </div>
                  </SortableContext>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <ChefHat className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('menu.selectCategory')}</p>
                <p className="text-sm">{t('menu.selectCategoryDesc')}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeItem && (
          <div className="bg-white border rounded-lg p-4 shadow-xl opacity-90">
            <div className="flex items-center gap-3">
              <GripVertical className="h-5 w-5 text-gray-400" />
              {activeItem.image && (
                <img
                  src={activeItem.image}
                  alt={activeItem.name}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div>
                <p className="font-medium">{activeItem.name}</p>
                <p className="text-sm text-gray-500">{formatPrice(activeItem.price)}</p>
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}