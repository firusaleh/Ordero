"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
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
  Phone,
  Star,
  Sparkles,
  Flame,
  Leaf
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import MenuItemDetail from './menu-item-detail'
import OrderConfirmation from './order-confirmation'
import { getLocalizedTableName } from '@/lib/table-helpers'
import { useGuestLanguage } from '@/contexts/guest-language-context'

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
  cuisine?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  phone?: string | null
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

const tagIcons: { [key: string]: any } = {
  'Vegan': Leaf,
  'Vegetarisch': Leaf,
  'Scharf': Flame,
  'Beliebt': Star,
  'Neu': Sparkles,
  'Empfehlung': Star
}

const cuisineEmojis: { [key: string]: string } = {
  'german': '🇩🇪',
  'italian': '🇮🇹',
  'asian': '🥢',
  'greek': '🇬🇷',
  'turkish': '🇹🇷',
  'indian': '🇮🇳',
  'mexican': '🇲🇽',
  'american': '🍔',
  'french': '🇫🇷',
  'spanish': '🇪🇸',
  'cafe': '☕',
  'bakery': '🥐',
  'other': '🍴'
}

export default function GuestMenuViewEnhanced({ restaurant, table, tableNumber }: GuestMenuViewProps) {
  const { language } = useGuestLanguage()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderNumber, setOrderNumber] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    restaurant.categories[0]?.id || ''
  )
  const [showHero, setShowHero] = useState(true)

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

  // Hide hero after scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 200) {
        setShowHero(false)
      } else {
        setShowHero(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

    toast.success(`${item.name} zum Warenkorb hinzugefügt`, {
      icon: '🛒',
    })
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
        tableNumber: table?.number || tableNumber, // Include tableNumber
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <AnimatePresence>
        {showHero && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative h-64 overflow-hidden"
            style={{ 
              background: `linear-gradient(135deg, ${restaurant.primaryColor || '#3b82f6'}dd, ${restaurant.primaryColor || '#3b82f6'}99)`
            }}
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            
            <div className="relative z-10 h-full flex flex-col justify-end p-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-4xl">{cuisineEmojis[restaurant.cuisine || 'other']}</span>
                  <Badge className="bg-white/20 text-white border-white/40">
                    {getLocalizedTableName(tableNumber, language)}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{restaurant.name}</h1>
                {restaurant.description && (
                  <p className="text-white/90 text-lg">{restaurant.description}</p>
                )}
                
                {/* Restaurant Info */}
                <div className="flex flex-wrap gap-4 mt-4">
                  {restaurant.street && (
                    <div className="flex items-center gap-1 text-white/80 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{restaurant.street}, {restaurant.postalCode} {restaurant.city}</span>
                    </div>
                  )}
                  {restaurant.phone && (
                    <div className="flex items-center gap-1 text-white/80 text-sm">
                      <Phone className="h-4 w-4" />
                      <span>{restaurant.phone}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Header */}
      <div className={cn(
        "sticky z-40 bg-white/95 backdrop-blur-md border-b transition-all duration-300",
        showHero ? "top-0" : "top-0 shadow-lg"
      )}>
        {!showHero && (
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">{restaurant.name}</h2>
              <p className="text-sm text-gray-600">{getLocalizedTableName(tableNumber, language)}</p>
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
            </Sheet>
          </div>
        )}
        
        {/* Categories */}
        <div className="container mx-auto px-4">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 py-3">
              {restaurant.categories.map((category) => {
                const IconComponent = iconComponents[category.icon || 'ChefHat']
                const isSelected = selectedCategory === category.id
                
                return (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all',
                      isSelected 
                        ? 'text-white shadow-lg' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                    style={{
                      backgroundColor: isSelected ? (category.color || restaurant.primaryColor || '#3b82f6') : undefined
                    }}
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    <span className="font-medium">{category.name}</span>
                    <Badge 
                      variant={isSelected ? 'secondary' : 'outline'}
                      className={cn(
                        'ml-1 text-xs',
                        isSelected && 'bg-white/20 text-white border-white/40'
                      )}
                    >
                      {category.menuItems.length}
                    </Badge>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {restaurant.categories
            .filter(cat => cat.id === selectedCategory)
            .map((category) => (
              <motion.div 
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {category.description && (
                  <p className="text-gray-600 mb-6 text-center">{category.description}</p>
                )}
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {category.menuItems.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card 
                        className="overflow-hidden cursor-pointer group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                        onClick={() => {
                          if (item.variants.length > 0 || item.extras.length > 0) {
                            setSelectedItem(item)
                          } else {
                            addToCart(item)
                          }
                        }}
                      >
                        {item.image && (
                          <div className="relative h-48 bg-gray-200 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                            
                            {/* Price Badge */}
                            <div className="absolute top-4 right-4 z-20">
                              <Badge className="bg-white/95 text-gray-900 font-bold text-lg px-3 py-1">
                                €{item.price.toFixed(2)}
                              </Badge>
                            </div>
                            
                            {/* Tags */}
                            {item.tags.length > 0 && (
                              <div className="absolute bottom-4 left-4 z-20 flex gap-2">
                                {item.tags.slice(0, 2).map((tag) => {
                                  const TagIcon = tagIcons[tag]
                                  return (
                                    <Badge 
                                      key={tag} 
                                      className="bg-white/95 text-gray-900"
                                    >
                                      {TagIcon && <TagIcon className="h-3 w-3 mr-1" />}
                                      {tag}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-lg flex-1 pr-2">{item.name}</h3>
                              {!item.image && (
                                <Badge className="font-bold text-lg">
                                  €{item.price.toFixed(2)}
                                </Badge>
                              )}
                            </div>
                            
                            {item.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            
                            {!item.image && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag) => {
                                  const TagIcon = tagIcons[tag]
                                  return (
                                    <Badge 
                                      key={tag} 
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {TagIcon && <TagIcon className="h-3 w-3 mr-1" />}
                                      {tag}
                                    </Badge>
                                  )
                                })}
                              </div>
                            )}
                            
                            {item.allergens.length > 0 && (
                              <div className="flex items-center gap-1 pt-2 border-t">
                                <Info className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  Allergene: {item.allergens.join(', ')}
                                </span>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center pt-3">
                              {(item.variants.length > 0 || item.extras.length > 0) ? (
                                <Button
                                  className="w-full"
                                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedItem(item)
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  Anpassen & Hinzufügen
                                </Button>
                              ) : (
                                <Button
                                  className="w-full"
                                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    addToCart(item)
                                  }}
                                >
                                  <Plus className="h-4 w-4 mr-2" />
                                  In den Warenkorb
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Warenkorb</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Ihr Warenkorb ist leer</p>
                <p className="text-sm text-gray-400 mt-2">
                  Fügen Sie leckere Gerichte hinzu!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
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
                          <p className="text-sm text-gray-500 italic mt-1">"{item.notes}"</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="hover:bg-red-100 hover:text-red-600"
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
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-lg">
                        €{getItemPrice(item).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <SheetFooter className="mt-6">
              <div className="w-full space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg">Zwischensumme</span>
                    <span className="text-lg">€{getCartTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t">
                    <span className="text-xl font-bold">Gesamt</span>
                    <span className="text-xl font-bold">
                      €{getCartTotal().toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleOrder}
                  disabled={isOrdering}
                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                >
                  {isOrdering ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="mr-2"
                      >
                        ⏳
                      </motion.div>
                      Bestellung wird gesendet...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Jetzt bestellen
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Item Detail Modal */}
      {selectedItem && (
        <MenuItemDetail
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onAdd={addToCart}
          primaryColor={restaurant.primaryColor}
        />
      )}

      {/* Floating Cart Button for Mobile */}
      <AnimatePresence>
        {cart.length > 0 && !isCartOpen && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:hidden z-50"
          >
            <Button 
              className="w-full shadow-2xl" 
              size="lg"
              onClick={() => setIsCartOpen(true)}
              style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Warenkorb ({getCartItemCount()}) • €{getCartTotal().toFixed(2)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}