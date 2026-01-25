'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import CheckoutWithTip from './checkout-with-tip'
import StripeCheckout from './stripe-checkout-new'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  X,
  Info,
  MapPin,
  Phone,
  Clock,
  Star,
  Heart,
  ChefHat,
  Leaf,
  Award,
  TrendingUp,
  Check,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import OrderSuccessDialog from './order-success-dialog'
import OrderHistorySheet from './order-history-sheet'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSelector from './language-selector'
import { getLocalizedTableName } from '@/lib/table-helpers'

// Types
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

export default function GuestMenuViewElegant({ restaurant, table, tableNumber }: GuestMenuViewProps) {
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
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)
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
    
    toast.success(
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4" />
        <span>{item.name} wurde hinzugefügt</span>
      </div>,
      {
        duration: 2000,
        position: 'bottom-center',
        className: 'bg-green-50 border-green-200'
      }
    )
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId))
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
        tableNumber: table?.number || tableNumber, // Include tableNumber
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

  const currentCategory = restaurant.categories.find(c => c.id === selectedCategory)

  // Check if item is popular (mock - would normally come from database)
  const isPopular = (item: MenuItem) => Math.random() > 0.7
  const isNew = (item: MenuItem) => Math.random() > 0.8

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Elegant Header */}
      <div className="bg-white shadow-sm sticky top-0 z-50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(restaurant.name) 
                  ? t('common.welcome') 
                  : restaurant.name}
              </h1>
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">4.8</span>
                  <span className="text-sm text-gray-500">(127)</span>
                </div>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{restaurant.cuisine || 'International'}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-600">{getLocalizedTableName(tableNumber, language)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSelector />
              <Button
                onClick={() => setIsCartOpen(true)}
                className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
                size="default"
              >
                <ShoppingBag className="h-4 w-4" />
                {cart.length > 0 && (
                  <>
                    <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                    <Badge className="bg-white text-gray-900 ml-1">
                      {getCartItemCount()}
                    </Badge>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories - Elegant Tabs */}
      <div className="bg-white sticky top-[72px] z-40 border-b">
        <div className="px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-3">
            {restaurant.categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`
                    px-6 py-2 font-medium whitespace-nowrap transition-all duration-200 border-b-2
                    ${isSelected 
                      ? 'text-gray-900 border-gray-900' 
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                    }
                  `}
                >
                  {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(category.name) 
                    ? (language === 'ar' ? 'الأطباق' : language === 'de' ? 'Gerichte' : 'Dishes')
                    : category.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Menu Items - Elegant Cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {currentCategory && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentCategory.name}</h2>
            {currentCategory.description && 
             !currentCategory.description.includes('إدارة') && 
             !currentCategory.description.includes('Verwalten') && 
             !currentCategory.description.includes('Manage') && (
              <p className="text-gray-600">{currentCategory.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentCategory?.menuItems.map((item) => (
            <Card 
              key={item.id}
              className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer bg-white"
              onClick={() => {
                setSelectedItem(item)
                setSelectedVariant(item.variants[0] || null)
                setSelectedExtras([])
                setItemNotes('')
                setItemQuantity(1)
              }}
            >
              <div className="flex">
                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {item.name}
                        </h3>
                        {isPopular(item) && (
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            Beliebt
                          </Badge>
                        )}
                        {isNew(item) && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            Neu
                          </Badge>
                        )}
                        {item.tags.includes('vegan') && (
                          <Leaf className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">
                          {formatPrice(item.price)}
                        </span>
                        
                        <Button 
                          size="sm"
                          className="bg-gray-900 hover:bg-gray-800 text-white"
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
                    </div>
                  </div>
                </div>

                {/* Image */}
                {item.image && (
                  <div className="w-32 h-32 relative">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Item Detail Dialog - Professional */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  {selectedItem.name}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Image */}
                {selectedItem.image && (
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}

                {/* Description */}
                {selectedItem.description && (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}

                {/* Variants */}
                {selectedItem.variants.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">{t('menu.chooseSize')}</Label>
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
                    <Label className="text-sm font-semibold mb-2 block">{t('menu.addExtras')}</Label>
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

                {/* Notes */}
                <div>
                  <Label className="text-sm font-semibold mb-2 block">{t('menu.specialRequests')}</Label>
                  <Textarea
                    placeholder="z.B. ohne Zwiebeln, extra scharf..."
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full"
                    rows={3}
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">{t('menu.quantity')}</Label>
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

                {/* Allergens */}
                {selectedItem.allergens.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-amber-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-800">Allergene:</p>
                        <p className="text-sm text-amber-700">
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
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6"
                  size="lg"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2">
                      In den Warenkorb
                    </span>
                    <span className="text-lg font-bold">
                      {formatPrice((selectedVariant?.price || selectedItem.price) * itemQuantity + selectedExtras.reduce((sum, e) => sum + e.price, 0) * itemQuantity)}
                    </span>
                  </div>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet - Clean & Professional */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full bg-white">
          <SheetHeader className="border-b pb-4">
            <SheetTitle className="text-2xl font-bold">
              Warenkorb
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">{t('cart.empty')}</p>
                <p className="text-gray-400 text-sm mt-2">Wählen Sie Gerichte aus der Speisekarte</p>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{item.menuItem.name}</h4>
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
                        className="text-gray-400 hover:text-red-600"
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
                      <span className="font-bold text-gray-900">
                        {formatPrice(getItemPrice(item) * item.quantity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Gesamt</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(getCartTotal())}
                  </span>
                </div>
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white py-6"
                  size="lg"
                >
                  <span className="flex items-center gap-2 text-lg">
                    Zur Kasse
                    <ArrowRight className="h-5 w-5" />
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

      {/* Stripe Checkout Dialog - Pass cart data, order created after payment */}
      {showStripeCheckout && (
        <Dialog open={showStripeCheckout} onOpenChange={setShowStripeCheckout}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">Stripe Zahlung</DialogTitle>
            <DialogDescription className="sr-only">Sichere Zahlung mit Stripe</DialogDescription>
            <StripeCheckout
              restaurantId={restaurant.id}
              tableId={table?.id}
              tableNumber={tableNumber}
              amount={getCartTotal() + (getCartTotal() * 0.19) + currentTipAmount}
              tip={currentTipAmount}
              currency={currency}
              cartData={{
                items: cart.map(item => ({
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
                })),
                subtotal: getCartTotal(),
                tax: getCartTotal() * 0.19,
                tip: currentTipAmount
              }}
              onSuccess={async (pendingPaymentId: string, orderNumber: string) => {
                // Save to order history
                const sessionKey = `orders-${restaurant.slug}-table-${tableNumber}`
                const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
                storedOrderIds.push(pendingPaymentId)
                localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))

                setOrderNumber(orderNumber)
                setCart([])
                setShowStripeCheckout(false)
                setShowSuccessDialog(true)
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

      {/* Order Success Dialog */}
      <OrderSuccessDialog
        open={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        orderNumber={orderNumber}
        estimatedTime="15-20 Minuten"
        primaryColor="#10B981"
      />

      {/* Order History Sheet */}
      <OrderHistorySheet
        restaurantSlug={restaurant.slug}
        tableNumber={tableNumber}
        currency={currency}
        primaryColor="#10B981"
      />
    </div>
  )
}