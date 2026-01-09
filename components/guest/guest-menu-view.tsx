"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  ChefHat,
  Coffee,
  Pizza,
  Soup,
  Wine,
  IceCream,
  Salad,
  Info,
  Clock,
  MapPin,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import MenuItemDetail from './menu-item-detail'
import OrderConfirmation from './order-confirmation'

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
  menuItems: MenuItem[]
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  primaryColor?: string | null
  categories: Category[]
  settings: any
}

interface CartItem {
  id: string
  menuItem: MenuItem
  quantity: number
  variant?: MenuItemVariant
  extras: MenuItemExtra[]
  notes?: string
}

interface GuestMenuViewProps {
  restaurant: Restaurant
  table: any
  tableNumber: number
}

const iconComponents: { [key: string]: any } = {
  Salad, Pizza, Soup, IceCream, Coffee, Wine, ChefHat
}

export default function GuestMenuView({ restaurant, table, tableNumber }: GuestMenuViewProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    restaurant.categories[0]?.id || ''
  )

  // Lade Warenkorb aus localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${restaurant.slug}-${tableNumber}`)
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart))
      } catch (e) {
        console.error('Error loading cart:', e)
      }
    }
  }, [restaurant.slug, tableNumber])

  // Speichere Warenkorb in localStorage
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart-${restaurant.slug}-${tableNumber}`, JSON.stringify(cart))
    } else {
      localStorage.removeItem(`cart-${restaurant.slug}-${tableNumber}`)
    }
  }, [cart, restaurant.slug, tableNumber])

  const addToCart = (item: MenuItem, variant?: MenuItemVariant, extras: MenuItemExtra[] = [], notes?: string) => {
    const cartId = `${item.id}-${variant?.id || 'default'}-${extras.map(e => e.id).join(',')}`
    
    const existingItem = cart.find(c => 
      c.id === cartId
    )

    if (existingItem) {
      setCart(cart.map(c => 
        c.id === cartId 
          ? { ...c, quantity: c.quantity + 1 }
          : c
      ))
    } else {
      setCart([...cart, {
        id: cartId,
        menuItem: item,
        quantity: 1,
        variant,
        extras,
        notes
      }])
    }

    toast.success(`${item.name} zum Warenkorb hinzugefügt`)
    setSelectedItem(null)
  }

  const updateQuantity = (cartId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === cartId) {
        const newQuantity = item.quantity + delta
        if (newQuantity <= 0) return item
        return { ...item, quantity: newQuantity }
      }
      return item
    }).filter(item => item.quantity > 0))
  }

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.id !== cartId))
    toast.info('Artikel entfernt')
  }

  const getItemPrice = (item: CartItem) => {
    const basePrice = item.variant?.price || item.menuItem.price
    const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0)
    return (basePrice + extrasPrice) * item.quantity
  }

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + getItemPrice(item), 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0)
  }

  const handleOrder = async () => {
    if (cart.length === 0) return

    setIsOrdering(true)
    
    try {
      const orderData = {
        restaurantId: restaurant.id,
        tableId: table?.id,
        tableNumber,
        type: 'DINE_IN',
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          variant: item.variant?.name,
          variantPrice: item.variant?.price,
          extras: item.extras.map(e => ({
            name: e.name,
            price: e.price
          })),
          notes: item.notes
        }))
      }

      const response = await fetch(`/api/public/${restaurant.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error('Bestellung fehlgeschlagen')
      }

      const result = await response.json()
      
      setOrderNumber(result.data.orderNumber)
      setOrderComplete(true)
      setCart([])
      setIsCartOpen(false)
      
    } catch (error) {
      toast.error('Bestellung fehlgeschlagen', {
        description: 'Bitte versuchen Sie es erneut.'
      })
    } finally {
      setIsOrdering(false)
    }
  }

  if (orderComplete && orderNumber) {
    return <OrderConfirmation 
      orderNumber={orderNumber} 
      restaurantName={restaurant.name}
      onNewOrder={() => {
        setOrderComplete(false)
        setOrderNumber(null)
      }}
    />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">{restaurant.name}</h1>
              <p className="text-sm text-gray-600">
                Tisch {tableNumber}
              </p>
            </div>
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="sm" 
                  className="relative"
                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.length > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 flex items-center justify-center"
                      variant="destructive"
                    >
                      {getCartItemCount()}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Warenkorb</SheetTitle>
                </SheetHeader>
                
                <div className="mt-6 flex-1 overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="text-center py-8">
                      <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Ihr Warenkorb ist leer</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-medium">{item.menuItem.name}</h4>
                              {item.variant && (
                                <p className="text-sm text-gray-600">{item.variant.name}</p>
                              )}
                              {item.extras.length > 0 && (
                                <p className="text-sm text-gray-600">
                                  + {item.extras.map(e => e.name).join(', ')}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-sm text-gray-500 italic">{item.notes}</p>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, -1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center">{item.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(item.id, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="font-medium">
                              €{getItemPrice(item).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {cart.length > 0 && (
                  <SheetFooter className="mt-6">
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center py-3 border-t">
                        <span className="text-lg font-semibold">Gesamt</span>
                        <span className="text-lg font-semibold">
                          €{getCartTotal().toFixed(2)}
                        </span>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleOrder}
                        disabled={isOrdering}
                        style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                      >
                        {isOrdering ? 'Bestellung wird gesendet...' : 'Jetzt bestellen'}
                      </Button>
                    </div>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Kategorien Tabs */}
      <div className="sticky top-[73px] z-30 bg-white border-b">
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto">
            <div className="flex gap-2 py-3">
              {restaurant.categories.map((category) => {
                const IconComponent = iconComponents[category.icon || 'ChefHat']
                const isSelected = selectedCategory === category.id
                
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors',
                      isSelected 
                        ? 'text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                    style={{
                      backgroundColor: isSelected ? (category.color || restaurant.primaryColor || '#3b82f6') : undefined
                    }}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {category.name}
                    <Badge 
                      variant={isSelected ? 'secondary' : 'outline'}
                      className={cn(
                        'ml-1',
                        isSelected && 'bg-white/20 text-white border-white/40'
                      )}
                    >
                      {category.menuItems.length}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menü Items */}
      <div className="container mx-auto px-4 py-6">
        {restaurant.categories
          .filter(cat => cat.id === selectedCategory)
          .map((category) => (
            <div key={category.id}>
              {category.description && (
                <p className="text-gray-600 mb-4">{category.description}</p>
              )}
              
              <div className="grid gap-4">
                {category.menuItems.map((item) => (
                  <Card 
                    key={item.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      if (item.variants.length > 0 || item.extras.length > 0) {
                        setSelectedItem(item)
                      } else {
                        addToCart(item)
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.image && (
                          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {item.description}
                                </p>
                              )}
                              
                              <div className="flex flex-wrap gap-2 mt-2">
                                {item.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              {item.allergens.length > 0 && (
                                <div className="flex items-center gap-1 mt-2">
                                  <Info className="h-3 w-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    Allergene: {item.allergens.join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="font-semibold">
                                €{item.price.toFixed(2)}
                              </p>
                              {(item.variants.length > 0 || item.extras.length > 0) && (
                                <Button
                                  size="sm"
                                  className="mt-2"
                                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedItem(item)
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <MenuItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addToCart}
          primaryColor={restaurant.primaryColor}
        />
      )}

      {/* Floating Cart Button für Mobile */}
      {cart.length > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden">
          <Button 
            className="w-full shadow-lg" 
            size="lg"
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Warenkorb ({getCartItemCount()}) • €{getCartTotal().toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}