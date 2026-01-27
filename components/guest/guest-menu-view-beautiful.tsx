'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import IntegratedCheckout from './integrated-checkout'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X,
  Info,
  MapPin,
  Phone,
  Clock,
  Star,
  Heart,
  Sparkles,
  ChefHat,
  Flame,
  TrendingUp,
  Award,
  Zap
} from 'lucide-react'
import { toast } from 'sonner'
import OrderSuccessDialog from './order-success-dialog'
import OrderHistorySheet from './order-history-sheet'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSelector from './language-selector'
import { getLocalizedTableName } from '@/lib/table-helpers'

// Types (gleich wie vorher)
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
  icon?: string | null
  description?: string | null
  menuItems: MenuItem[]
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  cuisine?: string | null
  street?: string | null
  city?: string | null
  postalCode?: string | null
  phone?: string | null
  country?: string | null
  categories: Category[]
  settings: {
    currency?: string
    [key: string]: any
  }
  primaryColor?: string | null
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

export default function GuestMenuViewBeautiful({ restaurant, table, tableNumber }: GuestMenuViewProps) {
  const { t, language } = useGuestLanguage()
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>(
    restaurant.categories[0]?.id || ''
  )
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | null>(null)
  const [selectedExtras, setSelectedExtras] = useState<MenuItemExtra[]>([])
  const [itemNotes, setItemNotes] = useState('')
  const [itemQuantity, setItemQuantity] = useState(1)
  const [showCheckout, setShowCheckout] = useState(false)
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)
  const [selectedTipOption, setSelectedTipOption] = useState<string>('0')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CARD')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Currency helpers
  const currency = restaurant.settings?.currency || 'EUR'
  const currencySymbol = currency === 'JOD' ? 'JD' : 
                        currency === 'USD' ? '$' : 
                        currency === 'AED' ? 'AED' : '€'
  const formatPrice = (price: number) => `${currencySymbol}${price.toFixed(2)}`

  // Cart persistence
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart-${restaurant.slug}-${tableNumber}`)
    if (savedCart) {
      setCart(JSON.parse(savedCart))
    }
  }, [restaurant.slug, tableNumber])

  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem(`cart-${restaurant.slug}-${tableNumber}`, JSON.stringify(cart))
    } else {
      localStorage.removeItem(`cart-${restaurant.slug}-${tableNumber}`)
    }
  }, [cart, restaurant.slug, tableNumber])

  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  const getCartTotal = () => cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  
  const getItemPrice = (item: CartItem) => {
    const basePrice = item.variant?.price || item.menuItem.price
    const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0)
    return basePrice + extrasPrice
  }

  const addToCart = (item: MenuItem, variant?: MenuItemVariant | null, extras: MenuItemExtra[] = [], notes?: string, quantity: number = 1) => {
    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItem: item,
      quantity,
      variant: variant || undefined,
      extras,
      notes
    }
    
    setCart([...cart, cartItem])
    
    // Animate cart button
    const button = document.getElementById('cart-button')
    button?.classList.add('animate-bounce')
    setTimeout(() => button?.classList.remove('animate-bounce'), 500)
    
    toast.success(
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎉</span>
        <span>{item.name} {t('menuItem.wasAdded') || 'wurde hinzugefügt'}!</span>
      </div>,
      {
        duration: 2000,
        position: 'bottom-center'
      }
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
    toast.info('Artikel entfernt', { duration: 1500 })
  }

  const updateQuantity = (itemId: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(1, item.quantity + change)
        return { ...item, quantity: newQuantity }
      }
      return item
    }))
  }

  // Handle cash order (called from IntegratedCheckout)
  const handleCashOrder = async () => {
    setIsOrdering(true)

    try {
      const tipPercent = selectedTipOption === 'round' ? 0 : parseInt(selectedTipOption) || 0

      const orderData = {
        tableId: table?.id,
        tableNumber: table?.number || tableNumber,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          variantId: item.variant?.id,
          extraIds: item.extras.map(e => e.id),
          notes: item.notes
        })),
        paymentMethod: 'CASH',
        tipAmount: currentTipAmount,
        tipPercent
      }

      const response = await fetch(`/api/public/${restaurant.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (response.ok) {
        const data = await response.json()
        const orderId = data.data?.id
        const orderNum = data.data?.orderNumber || '#0000'

        // Save order ID to localStorage for history
        const sessionKey = `orders-${restaurant.slug}-table-${tableNumber}`
        const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
        if (!storedOrderIds.includes(orderId)) {
          storedOrderIds.push(orderId)
          localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))
        }

        // Dispatch event for order history component
        window.dispatchEvent(new CustomEvent('orderCreated', {
          detail: { orderNumber: orderNum, orderId }
        }))

        setOrderNumber(orderNum)
        setCart([])
        setShowCheckout(false)
        setShowSuccessDialog(true)
      } else {
        throw new Error('Bestellung fehlgeschlagen')
      }
    } catch (error) {
      toast.error('Fehler bei der Bestellung. Bitte versuchen Sie es erneut.')
    } finally {
      setIsOrdering(false)
    }
  }

  // Handle successful card payment (called from IntegratedCheckout)
  const handlePaymentSuccess = (pendingPaymentId: string, orderNumber: string) => {
    const sessionKey = `orders-${restaurant.slug}-table-${tableNumber}`
    const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
    storedOrderIds.push(pendingPaymentId)
    localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))

    setOrderNumber(orderNumber)
    setCart([])
    setShowCheckout(false)
    setShowSuccessDialog(true)
  }

  const currentCategory = restaurant.categories.find(c => c.id === selectedCategory)

  // Popular items (mock - würde normalerweise aus Datenbank kommen)
  const isPopular = (item: MenuItem) => Math.random() > 0.7

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      {/* Beautiful Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 sticky top-0 z-50 shadow-2xl">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 backdrop-blur-lg rounded-full animate-pulse">
                  <ChefHat className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                    {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(restaurant.name) 
                      ? t('common.welcome') 
                      : restaurant.name}
                  </h1>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < 4 ? 'text-yellow-300 fill-yellow-300' : 'text-white/50'}`} />
                      ))}
                    </div>
                    <span className="text-white/90 text-sm">4.8 (127 Bewertungen)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Beautiful Cart Button */}
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button
                id="cart-button"
                onClick={() => setIsCartOpen(true)}
                className="relative bg-white/20 backdrop-blur-lg hover:bg-white/30 text-white border-2 border-white/30 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.length > 0 && (
                  <>
                    <span className="ml-2 font-bold">{formatPrice(getCartTotal())}</span>
                    <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <span className="text-xs font-bold text-white">{getCartItemCount()}</span>
                    </div>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Categories */}
      <div className="bg-white sticky top-[88px] z-40 shadow-md">
        <div className="px-3 py-4">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {restaurant.categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    px-5 py-3 rounded-full font-semibold whitespace-nowrap transition-all duration-500 transform
                    ${isSelected 
                      ? 'bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 text-white shadow-2xl scale-110 rotate-1' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 shadow-lg hover:shadow-xl hover:scale-105'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon || '🍽️'}</span>
                    <span>
                      {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(category.name) 
                        ? (language === 'ar' ? 'الأطباق' : language === 'de' ? 'Gerichte' : 'Dishes')
                        : category.name}
                    </span>
                    {isSelected && (
                      <Sparkles className="h-4 w-4 animate-pulse" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="mx-4 mt-6 mb-4">
        <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-500 p-1 rounded-2xl shadow-xl">
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-orange-100 to-pink-100 rounded-full">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800">{getLocalizedTableName(tableNumber, language)}</p>
                <p className="text-sm text-gray-600">{restaurant.cuisine || 'International'} • Schnelle Lieferung</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              <span className="text-sm font-semibold text-gray-700">15-25 Min</span>
            </div>
          </div>
        </div>
      </div>

      {/* Beautiful Menu Grid */}
      <div className="px-4 py-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCategory?.menuItems.map((item) => (
            <Card 
              key={item.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:rotate-1 cursor-pointer bg-white border-2 border-transparent hover:border-pink-300"
              onClick={() => {
                setSelectedItem(item)
                setSelectedVariant(item.variants[0] || null)
                setSelectedExtras([])
                setItemNotes('')
                setItemQuantity(1)
              }}
            >
              {/* Image or Placeholder */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-orange-100 via-pink-100 to-purple-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-200/50 via-transparent to-purple-200/50"></div>
                    <span className="text-7xl transform group-hover:scale-125 transition-transform duration-500">🍴</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {isPopular(item) && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full shadow-lg animate-pulse flex items-center gap-1">
                      <Flame className="h-4 w-4 animate-bounce" />
                      <span className="font-bold text-sm">BELIEBT</span>
                    </div>
                  )}
                  {item.tags.includes('vegan') && (
                    <Badge className="bg-green-500 text-white shadow-lg">
                      🌱 Vegan
                    </Badge>
                  )}
                  {item.tags.includes('neu') && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Neu
                    </Badge>
                  )}
                </div>

                {/* Price Badge */}
                <div className="absolute bottom-3 right-3">
                  <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 p-0.5 rounded-xl shadow-2xl transform rotate-3 group-hover:rotate-0 transition-transform">
                    <div className="bg-white rounded-xl px-4 py-2">
                      <span className="text-2xl font-black bg-gradient-to-r from-orange-500 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                        {formatPrice(item.price)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                  {item.name}
                </h3>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {item.allergens.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        <Info className="h-3 w-3 mr-1" />
                        Allergene
                      </Badge>
                    )}
                    {item.variants.length > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {item.variants.length} Größen
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    size="sm"
                    className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white shadow-lg transform transition-all hover:scale-110"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (item.variants.length === 0 && item.extras.length === 0) {
                        addToCart(item)
                      } else {
                        setSelectedItem(item)
                        setSelectedVariant(item.variants[0] || null)
                      }
                    }}
                  >
                    <Plus className="h-5 w-5 animate-pulse" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  {selectedItem.name}
                  {isPopular(selectedItem) && (
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
                      <Flame className="h-3 w-3 mr-1" />
                      Beliebt
                    </Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Bild */}
                {selectedItem.image && (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                {/* Beschreibung */}
                {selectedItem.description && (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}

                {/* Varianten */}
                {selectedItem.variants.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Größe wählen</Label>
                    <RadioGroup
                      value={selectedVariant?.id}
                      onValueChange={(value) => {
                        const variant = selectedItem.variants.find(v => v.id === value)
                        setSelectedVariant(variant || null)
                      }}
                    >
                      <div className="space-y-2">
                        {selectedItem.variants.map((variant) => (
                          <div
                            key={variant.id}
                            className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <RadioGroupItem value={variant.id} id={variant.id} />
                            <Label
                              htmlFor={variant.id}
                              className="flex-1 cursor-pointer flex justify-between items-center"
                            >
                              <span>{variant.name}</span>
                              <span className="font-semibold">{formatPrice(variant.price)}</span>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>
                )}

                {/* Extras */}
                {selectedItem.extras.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{t('item.addExtras') || 'Extras hinzufügen'}</Label>
                    <div className="space-y-2">
                      {selectedItem.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (selectedExtras.find(e => e.id === extra.id)) {
                              setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
                            } else {
                              setSelectedExtras([...selectedExtras, extra])
                            }
                          }}
                        >
                          <Checkbox
                            id={extra.id}
                            checked={!!selectedExtras.find(e => e.id === extra.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedExtras([...selectedExtras, extra])
                              } else {
                                setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
                              }
                            }}
                          />
                          <Label
                            htmlFor={extra.id}
                            className="flex-1 cursor-pointer flex justify-between items-center"
                          >
                            <span>{extra.name}</span>
                            <span className="font-semibold">+{formatPrice(extra.price)}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notizen */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">Besondere Wünsche?</Label>
                  <Textarea
                    placeholder="z.B. ohne Zwiebeln, extra scharf..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                {/* Menge */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Menge</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{itemQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-5 w-5 animate-pulse" />
                    </Button>
                  </div>
                </div>

                {/* Allergene */}
                {selectedItem.allergens.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-yellow-800">Allergene:</p>
                        <p className="text-sm text-yellow-700">
                          {selectedItem.allergens.join(', ')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button
                  onClick={() => {
                    addToCart(
                      selectedItem,
                      selectedVariant,
                      selectedExtras,
                      itemNotes,
                      itemQuantity
                    )
                    setSelectedItem(null)
                  }}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white py-6"
                  size="lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      <ShoppingCart className="h-5 w-5" />
                      {t('menuItem.addToCart') || 'In den Warenkorb'}
                    </span>
                    <span className="text-lg font-bold">
                      {formatPrice((selectedVariant?.price || selectedItem.price) * itemQuantity)}
                    </span>
                  </div>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Beautiful Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-gradient-to-b from-orange-50 via-pink-50 to-purple-50">
          <SheetHeader className="pb-4 border-b border-gray-200">
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-600 to-purple-700 bg-clip-text text-transparent flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-pink-500" />
              {t('cart.title') || 'Ihr Warenkorb'}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-7xl mb-4 animate-bounce">🛒</div>
                <p className="text-gray-600 text-xl font-semibold">Noch keine Auswahl</p>
                <p className="text-gray-500 text-sm mt-2">Entdecken Sie unsere köstlichen Gerichte!</p>
                <div className="mt-6 flex justify-center">
                  <div className="flex gap-2">
                    {['🍕', '🍔', '🌮', '🍣', '🥗'].map((emoji, i) => (
                      <span key={i} className="text-3xl animate-pulse" style={{animationDelay: `${i * 0.1}s`}}>
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-4 bg-white shadow-xl border-l-4 border-gradient-to-b from-orange-400 via-pink-500 to-purple-600 hover:shadow-2xl transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{item.menuItem.name}</h4>
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
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <span className="font-bold text-lg bg-gradient-to-r from-orange-500 via-pink-600 to-purple-700 bg-clip-text text-transparent">
                        {formatPrice(getItemPrice(item) * item.quantity)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4 bg-white">
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">{t('common.total') || 'Gesamt'}</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 via-pink-600 to-purple-700 bg-clip-text text-transparent animate-pulse">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 hover:from-orange-500 hover:via-pink-600 hover:to-purple-700 text-white py-6 shadow-2xl transform hover:scale-105 transition-all"
                  size="lg"
                >
                  <span className="flex items-center gap-2 text-lg font-semibold">
                    <Zap className="h-5 w-5" />
                    Zur Kasse
                  </span>
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Unified Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Zahlungsoptionen</DialogTitle>
          <DialogDescription className="sr-only">Wählen Sie Ihre Zahlungsmethode</DialogDescription>
          <IntegratedCheckout
            restaurantId={restaurant.id}
            tableId={table?.id}
            tableNumber={tableNumber}
            subtotal={getCartTotal()}
            serviceFee={getCartTotal() * 0.19}
            tipAmount={currentTipAmount}
            currency={currency}
            currencySymbol={currencySymbol}
            cartItems={cart.map(item => ({
              menuItemId: item.menuItem.id,
              name: item.menuItem.name,
              quantity: item.quantity,
              unitPrice: item.variant?.price || item.menuItem.price,
              variantId: item.variant?.id,
              variantName: item.variant?.name,
              extraIds: item.extras.map(e => e.id),
              extraNames: item.extras.map(e => e.name),
              extraPrices: item.extras.map(e => e.price),
              notes: item.notes
            }))}
            selectedPaymentMethod={selectedPaymentMethod}
            selectedTipOption={selectedTipOption}
            onTipChange={(option, amount) => {
              setSelectedTipOption(option)
              setCurrentTipAmount(amount)
            }}
            onPaymentMethodChange={setSelectedPaymentMethod}
            onSuccess={handlePaymentSuccess}
            onCashOrder={handleCashOrder}
            onError={(error) => toast.error(error)}
            isProcessingCash={isOrdering}
            primaryColor={restaurant.primaryColor || '#FF6B35'}
            t={t}
            formatPrice={formatPrice}
          />
        </DialogContent>
      </Dialog>

      {/* Order Success Dialog */}
      <OrderSuccessDialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        orderNumber={orderNumber}
        estimatedTime="15-20 Minuten"
        primaryColor={restaurant.primaryColor || '#FF6B35'}
      />

      {/* Order History Sheet */}
      <OrderHistorySheet
        restaurantSlug={restaurant.slug}
        tableNumber={tableNumber}
        currency={currency}
        primaryColor={restaurant.primaryColor || '#FF6B35'}
      />
    </div>
  )
}