'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import CheckoutWithTip from './checkout-with-tip'
import StripeCheckout from './stripe-checkout-new'
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
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSelector from './language-selector'

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
  const { t } = useGuestLanguage()
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
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)

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
        <span>{item.name} wurde hinzugefügt!</span>
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

  const handleOrder = async (tipPercent: number, tipAmount: number, paymentMethod: string) => {
    setCurrentTipAmount(tipAmount)
    
    if (paymentMethod === 'CARD') {
      setShowCheckout(false)
      setShowStripeCheckout(true)
      return
    }
    
    setIsOrdering(true)
    
    try {
      const orderData = {
        tableId: table?.id,
        items: cart.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          variantId: item.variant?.id,
          extraIds: item.extras.map(e => e.id),
          notes: item.notes
        })),
        paymentMethod,
        tipAmount,
        tipPercent
      }
      
      const response = await fetch(`/api/restaurants/${restaurant.id}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })
      
      if (response.ok) {
        setCart([])
        setShowCheckout(false)
        toast.success(
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold">Bestellung aufgegeben!</p>
              <p className="text-sm">Sie wird in Kürze zubereitet</p>
            </div>
          </div>,
          { duration: 4000 }
        )
      } else {
        throw new Error('Bestellung fehlgeschlagen')
      }
    } catch (error) {
      toast.error('Fehler bei der Bestellung. Bitte versuchen Sie es erneut.')
    } finally {
      setIsOrdering(false)
    }
  }

  const currentCategory = restaurant.categories.find(c => c.id === selectedCategory)

  // Popular items (mock - würde normalerweise aus Datenbank kommen)
  const isPopular = (item: MenuItem) => Math.random() > 0.7

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Beautiful Header */}
      <div className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-gray-100 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  {restaurant.name}
                </h1>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0">
                  <Star className="h-3 w-3 mr-1" />
                  4.8
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  <ChefHat className="h-3 w-3 mr-1" />
                  {restaurant.cuisine || 'International'}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  📍 Tisch {tableNumber}
                </Badge>
              </div>
            </div>
            
            {/* Beautiful Cart Button */}
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button
                id="cart-button"
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                size="default"
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
      <div className="bg-white/60 backdrop-blur-sm sticky top-[72px] z-40 border-b border-gray-100">
        <div className="px-3 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {restaurant.categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    px-4 py-2 rounded-2xl font-medium whitespace-nowrap transition-all duration-300
                    ${isSelected 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md hover:shadow-lg'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{category.icon || '🍽️'}</span>
                    <span>{category.name}</span>
                    <Badge 
                      variant={isSelected ? "secondary" : "outline"} 
                      className={`ml-1 ${isSelected ? 'bg-white/20 text-white' : ''}`}
                    >
                      {category.menuItems.length}
                    </Badge>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Beautiful Menu Grid */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentCategory?.menuItems.map((item) => (
            <Card 
              key={item.id}
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white/90 backdrop-blur-sm"
              onClick={() => {
                setSelectedItem(item)
                setSelectedVariant(item.variants[0] || null)
                setSelectedExtras([])
                setItemNotes('')
                setItemQuantity(1)
              }}
            >
              {/* Image or Placeholder */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-6xl opacity-50">🍴</span>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {isPopular(item) && (
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg">
                      <Flame className="h-3 w-3 mr-1" />
                      Beliebt
                    </Badge>
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
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                    <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-800">{item.name}</h3>
                
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
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
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
                    <Plus className="h-4 w-4" />
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
                    <Label className="text-sm font-semibold mb-2 block">Extras hinzufügen</Label>
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
                      <Plus className="h-4 w-4" />
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
                      In den Warenkorb
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
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Ihr Warenkorb
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-gray-500 text-lg">Ihr Warenkorb ist noch leer</p>
                <p className="text-gray-400 text-sm mt-2">Fügen Sie leckere Gerichte hinzu!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-4 bg-white shadow-lg">
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
                      <span className="font-bold text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
                  <span className="text-lg font-semibold">Gesamt</span>
                  <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-6"
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

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <CheckoutWithTip
            subtotal={getCartTotal()}
            tax={getCartTotal() * 0.19}
            onConfirm={handleOrder}
            isProcessing={isOrdering}
            currency={currency}
            currencySymbol={currencySymbol}
            paymentProvider="Stripe"
          />
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout Dialog */}
      {showStripeCheckout && (
        <Dialog open={showStripeCheckout} onOpenChange={setShowStripeCheckout}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <StripeCheckout
              restaurantId={restaurant.id}
              orderId={`order-${Date.now()}`}
              amount={getCartTotal() + (getCartTotal() * 0.19) + currentTipAmount}
              tip={currentTipAmount}
              currency={currency}
              onSuccess={(paymentIntentId) => {
                setCart([])
                setShowStripeCheckout(false)
                toast.success('Zahlung erfolgreich! 🎉')
              }}
              onError={(error) => {
                toast.error(`Fehler: ${error}`)
              }}
              onCancel={() => {
                setShowStripeCheckout(false)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}