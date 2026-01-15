'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import OrderSuccessDialog from './order-success-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
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
  Star,
  Clock,
  ChevronLeft,
  Check
} from 'lucide-react'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSwitcher from './language-switcher'

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
  logo?: string | null
  banner?: string | null
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

export default function GuestMenuViewMockup({ restaurant, table, tableNumber }: GuestMenuViewProps) {
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
  const [selectedTipOption, setSelectedTipOption] = useState<string>('10')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CARD')
  const [customTipAmount, setCustomTipAmount] = useState<string>('')
  const [showCustomTip, setShowCustomTip] = useState<boolean>(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')
  
  // Use restaurant's primary color or fallback to orange
  const primaryColor = restaurant.primaryColor || '#FF6B35'
  const primaryColorHover = restaurant.primaryColor ? 
    restaurant.primaryColor + 'dd' : '#ff5420'

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
    
    toast.success(`${item.name} ${t('toast.addedToCart')}`, {
      duration: 2000,
      position: 'bottom-center',
      style: {
        background: primaryColor,
        color: 'white',
        border: 'none'
      }
    })
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
        setOrderNumber(data.data?.orderNumber || '#0000')
        setCart([])
        setShowCheckout(false)
        setShowSuccessDialog(true)
      } else {
        throw new Error('Order failed')
      }
    } catch (error) {
      toast.error(t('toast.error'))
    } finally {
      setIsOrdering(false)
    }
  }

  const currentCategory = restaurant.categories.find(c => c.id === selectedCategory)

  // Get emoji for food items (mock)
  const getFoodEmoji = (name: string): string => {
    const emojiMap: { [key: string]: string } = {
      'pizza': '🍕',
      'pasta': '🍝',
      'salad': '🥗',
      'burger': '🍔',
      'sandwich': '🥪',
      'soup': '🍲',
      'steak': '🥩',
      'chicken': '🍗',
      'fish': '🐟',
      'sushi': '🍣',
      'dessert': '🍰',
      'cake': '🎂',
      'coffee': '☕',
      'tea': '🍵',
      'beer': '🍺',
      'wine': '🍷',
      'cocktail': '🍹',
      'juice': '🧃'
    }
    
    const nameLower = name.toLowerCase()
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (nameLower.includes(key)) return emoji
    }
    return '🍽️'
  }

  // Check if item is popular
  const isPopular = (item: MenuItem) => {
    return item.tags?.includes('popular') || Math.random() > 0.7
  }

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {restaurant.logo && (
                <img 
                  src={restaurant.logo} 
                  alt={restaurant.name}
                  className="h-10 w-10 object-contain"
                />
              )}
              <h1 className="text-xl font-bold text-gray-900">{restaurant.name}</h1>
            </div>
            <div className="relative">
              <Button
                onClick={() => setIsCartOpen(true)}
                style={{ 
                  backgroundColor: primaryColor,
                  color: 'white'
                }}
                className="text-white rounded-full px-4 py-2 h-auto hover:opacity-90 transition-opacity"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                <span className="font-semibold">{formatPrice(getCartTotal())}</span>
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-gray-900 text-white border-0 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                    {getCartItemCount()}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>{restaurant.cuisine || t('header.international')} {restaurant.cuisine ? getFoodEmoji(restaurant.cuisine) : '🍽️'}</span>
            <Badge 
              style={{ backgroundColor: primaryColor }}
              className="text-white border-0 px-3 py-1 rounded-full text-xs font-semibold">
              {t('header.table')} {tableNumber}
            </Badge>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white border-b border-gray-100 sticky top-[73px] z-40">
        <div className="px-5 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {restaurant.categories.map((category) => {
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                  ${isSelected 
                    ? 'text-white' 
                    : 'bg-white text-gray-600 border border-gray-200'
                  }
                `}
                style={isSelected ? { backgroundColor: primaryColor } : {}}
              >
                {category.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-5 py-4">
        <div className="space-y-3">
          {currentCategory?.menuItems.map((item) => (
            <div 
              key={item.id}
              className="bg-white rounded-2xl shadow-sm overflow-hidden"
              onClick={() => {
                if (item.variants.length > 0 || item.extras.length > 0) {
                  setSelectedItem(item)
                  setSelectedVariant(item.variants[0] || null)
                  setSelectedExtras([])
                  setItemNotes('')
                  setItemQuantity(1)
                } else {
                  addToCart(item)
                }
              }}
            >
              <div className="flex gap-3 p-3">
                {/* Food Emoji/Image */}
                <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {item.image ? (
                    <img 
                      src={item.image} 
                      alt={item.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <span className="text-4xl">{getFoodEmoji(item.name)}</span>
                  )}
                </div>
                
                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 text-base">
                      {item.name}
                      {isPopular(item) && (
                        <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs px-2 py-0">
                          {t('menu.popular')}
                        </Badge>
                      )}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: primaryColor }}>
                      {formatPrice(item.price)}
                    </span>
                    <Button
                      className="text-white rounded-xl h-8 w-8 p-0 hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: primaryColor }}
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
          ))}
        </div>
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-3xl">
          {selectedItem && (
            <>
              <DialogHeader className="relative">
                {/* Image/Emoji Header */}
                <div className="w-full h-48 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  {selectedItem.image ? (
                    <img 
                      src={selectedItem.image} 
                      alt={selectedItem.name}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  ) : (
                    <span className="text-7xl">{getFoodEmoji(selectedItem.name)}</span>
                  )}
                </div>
                <DialogTitle className="text-xl font-bold text-gray-900">
                  {selectedItem.name}
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  {selectedItem.description || 'Wählen Sie Ihre Optionen'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 mt-4">
                {/* Variants */}
                {selectedItem.variants.length > 0 && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('menu.chooseSize')}
                    </Label>
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
                            className="flex items-center p-3 rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] cursor-pointer transition-colors"
                            onClick={() => setSelectedVariant(variant)}
                          >
                            <RadioGroupItem value={variant.id} id={variant.id} className="text-[#FF6B35]" />
                            <Label
                              htmlFor={variant.id}
                              className="flex-1 cursor-pointer flex justify-between items-center ml-3"
                            >
                              <span className="font-medium">{variant.name}</span>
                              <span className="font-bold text-[#FF6B35]">{formatPrice(variant.price)}</span>
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
                    <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                      {t('menu.addExtras')}
                    </Label>
                    <div className="space-y-2">
                      {selectedItem.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center p-3 rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] cursor-pointer transition-colors"
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
                            className="border-gray-300 data-[state=checked]:bg-[#FF6B35] data-[state=checked]:border-[#FF6B35]"
                          />
                          <Label
                            htmlFor={extra.id}
                            className="flex-1 cursor-pointer flex justify-between items-center ml-3"
                          >
                            <span className="font-medium">{extra.name}</span>
                            <span className="font-bold text-[#FF6B35]">+{formatPrice(extra.price)}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Special Requests */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                    {t('menu.specialRequests')}
                  </Label>
                  <Textarea
                    placeholder={t('menu.specialRequestsPlaceholder')}
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="w-full rounded-xl border-gray-200 focus:border-[#FF6B35] focus:ring-[#FF6B35]"
                    rows={3}
                  />
                </div>

                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">{t('menu.quantity')}</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 border-gray-200"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-bold text-lg">{itemQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl h-10 w-10 border-gray-200"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-6">
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
                  className="w-full bg-[#FF6B35] hover:bg-[#ff5420] text-white rounded-xl py-6 text-base font-semibold"
                >
                  {t('menu.addToCart')} • {formatPrice(
                    ((selectedVariant?.price || selectedItem.price) + 
                    selectedExtras.reduce((sum, e) => sum + e.price, 0)) * itemQuantity
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md bg-[#f8f8f8] p-0">
          {/* Cart Header */}
          <div className="bg-white border-b border-gray-200 px-5 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{t('cart.yourOrder')}</h2>
              <Badge 
                style={{ backgroundColor: primaryColor }}
                className="text-white px-3 py-1 rounded-full">
                {getCartItemCount()} {t('cart.items')}
              </Badge>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <ShoppingCart className="h-10 w-10 text-gray-300" />
                </div>
                <p className="text-gray-600 text-lg font-medium">{t('cart.empty')}</p>
                <p className="text-gray-400 text-sm mt-1">{t('cart.emptyMessage')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
                    {/* Quantity Badge */}
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-sm text-[#FF6B35]">{item.quantity}×</span>
                    </div>
                    
                    {/* Item Info */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">{item.menuItem.name}</h4>
                      <p className="text-xs text-gray-500">
                        {formatPrice(getItemPrice(item))} {t('cart.each')}
                        {item.variant && ` • ${item.variant.name}`}
                      </p>
                      {item.extras.length > 0 && (
                        <p className="text-xs text-gray-500">
                          + {item.extras.map(e => e.name).join(', ')}
                        </p>
                      )}
                    </div>
                    
                    {/* Total Price */}
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(getItemPrice(item) * item.quantity)}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.id)}
                        className="text-xs text-gray-400 hover:text-red-500 p-0 h-auto"
                      >
                        {t('cart.remove')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cart.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4 pb-safe rounded-t-3xl shadow-lg">
              {/* Summary */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('cart.subtotal')}</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{t('cart.serviceFee')}</span>
                  <span>{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
              </div>
              
              {/* Checkout Button */}
              <Button
                onClick={() => {
                  setIsCartOpen(false)
                  setShowCheckout(true)
                }}
                className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] hover:from-[#E85A24] hover:to-[#FF6B35] text-white rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-2"
              >
                {t('cart.checkout')}
                <span>→</span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog - Payment Methods */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Zahlungsoptionen</DialogTitle>
          <DialogDescription className="sr-only">Wählen Sie Ihre Zahlungsmethode und Trinkgeld</DialogDescription>
          {/* Payment Header */}
          <div className="bg-white px-6 py-6 text-center border-b">
            <p className="text-gray-600 text-sm font-medium mb-2">{t('payment.subtotal')}</p>
            <div className="text-4xl font-bold mb-4">
              <span className="text-[#FF6B35]">{currencySymbol}</span>
              <span className="text-gray-900">{getCartTotal().toFixed(2)}</span>
            </div>
            
            {/* Tip Options */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">{t('payment.tipQuestion')}</p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                {/* No Tip */}
                <button
                  onClick={() => {
                    setSelectedTipOption('0')
                    setCurrentTipAmount(0)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === '0' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">😐</span>
                  <span className="text-xs font-medium">{t('payment.noTip')}</span>
                </button>
                
                {/* 5% */}
                <button
                  onClick={() => {
                    setSelectedTipOption('5')
                    setCurrentTipAmount(getCartTotal() * 0.05)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === '5' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">🙂</span>
                  <span className="text-xs font-medium">5%</span>
                  <span className="text-xs opacity-75">{currencySymbol}{(getCartTotal() * 0.05).toFixed(2)}</span>
                </button>
                
                {/* 10% */}
                <button
                  onClick={() => {
                    setSelectedTipOption('10')
                    setCurrentTipAmount(getCartTotal() * 0.10)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === '10' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">😊</span>
                  <span className="text-xs font-medium">10%</span>
                  <span className="text-xs opacity-75">{currencySymbol}{(getCartTotal() * 0.10).toFixed(2)}</span>
                </button>
                
                {/* 15% */}
                <button
                  onClick={() => {
                    setSelectedTipOption('15')
                    setCurrentTipAmount(getCartTotal() * 0.15)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === '15' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">😃</span>
                  <span className="text-xs font-medium">15%</span>
                  <span className="text-xs opacity-75">{currencySymbol}{(getCartTotal() * 0.15).toFixed(2)}</span>
                </button>
                
                {/* 20% */}
                <button
                  onClick={() => {
                    setSelectedTipOption('20')
                    setCurrentTipAmount(getCartTotal() * 0.20)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === '20' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">😍</span>
                  <span className="text-xs font-medium">20%</span>
                  <span className="text-xs opacity-75">{currencySymbol}{(getCartTotal() * 0.20).toFixed(2)}</span>
                </button>
                
                {/* Round Up */}
                <button
                  onClick={() => {
                    setSelectedTipOption('round')
                    const total = getCartTotal()
                    const nextFive = Math.ceil(total / 5) * 5
                    const nextTen = Math.ceil(total / 10) * 10
                    const roundedUp = (nextFive - total) < (nextTen - total) && (nextFive - total) > 0.5 ? nextFive : nextTen
                    setCurrentTipAmount(roundedUp - total)
                    setShowCustomTip(false)
                  }}
                  className={`py-3 px-3 rounded-xl transition-all flex flex-col items-center gap-1 ${
                    selectedTipOption === 'round' 
                      ? 'bg-[#FF6B35] text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-xl">💝</span>
                  <span className="text-xs font-medium">{t('payment.roundUp')}</span>
                  <span className="text-xs opacity-75">
                    {(() => {
                      const total = getCartTotal()
                      const nextFive = Math.ceil(total / 5) * 5
                      const nextTen = Math.ceil(total / 10) * 10
                      const roundedUp = (nextFive - total) < (nextTen - total) && (nextFive - total) > 0.5 ? nextFive : nextTen
                      return `+${currencySymbol}${(roundedUp - total).toFixed(2)}`
                    })()}
                  </span>
                </button>
              </div>
              
              {/* Custom Amount Button */}
              <button
                onClick={() => {
                  setShowCustomTip(!showCustomTip)
                  setSelectedTipOption('custom')
                  if (!showCustomTip) {
                    setCustomTipAmount('')
                    setCurrentTipAmount(0)
                  }
                }}
                className={`w-full py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                  selectedTipOption === 'custom' 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t('payment.customAmount')}
              </button>
              
              {/* Custom Amount Input */}
              {showCustomTip && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-gray-600">{currencySymbol}</span>
                  <input
                    type="number"
                    value={customTipAmount}
                    onChange={(e) => {
                      const value = e.target.value
                      setCustomTipAmount(value)
                      const amount = parseFloat(value) || 0
                      setCurrentTipAmount(amount)
                    }}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="0.00"
                    min="0"
                    step="0.50"
                  />
                </div>
              )}
              
              {/* Tip Amount Display */}
              {currentTipAmount > 0 && (
                <div className="mt-3 p-3 bg-orange-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{t('payment.tip')}</span>
                    <span className="font-semibold text-[#FF6B35]">
                      +{currencySymbol}{currentTipAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-orange-100">
                    <span className="text-sm font-semibold text-gray-700">{t('payment.total')}</span>
                    <span className="text-lg font-bold text-gray-900">
                      {currencySymbol}{(getCartTotal() + currentTipAmount).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-[#f8f8f8] px-5 py-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t('payment.selectPaymentMethod')}
            </p>
            
            <div className="space-y-3">
              {/* Apple Pay */}
              <button
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                  selectedPaymentMethod === 'APPLE_PAY' ? 'border-[#FF6B35] bg-orange-50' : 'border-transparent hover:border-[#FF6B35]'
                }`}
                onClick={() => setSelectedPaymentMethod('APPLE_PAY')}
              >
                <div className="w-12 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  Pay
                </div>
                <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.applePay')}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPaymentMethod === 'APPLE_PAY' ? 'bg-[#FF6B35]' : 'bg-gray-200'
                }`}>
                  {selectedPaymentMethod === 'APPLE_PAY' && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
              
              {/* Google Pay */}
              <button
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                  selectedPaymentMethod === 'GOOGLE_PAY' ? 'border-[#FF6B35] bg-orange-50' : 'border-transparent hover:border-[#FF6B35]'
                }`}
                onClick={() => setSelectedPaymentMethod('GOOGLE_PAY')}
              >
                <div className="w-12 h-8 bg-white border rounded-lg flex items-center justify-center font-bold text-xs">
                  G Pay
                </div>
                <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.googlePay')}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPaymentMethod === 'GOOGLE_PAY' ? 'bg-[#FF6B35]' : 'bg-gray-200'
                }`}>
                  {selectedPaymentMethod === 'GOOGLE_PAY' && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
              
              {/* Credit Card */}
              <button
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                  selectedPaymentMethod === 'CARD' ? 'border-[#FF6B35] bg-orange-50' : 'border-transparent hover:border-[#FF6B35]'
                }`}
                onClick={() => setSelectedPaymentMethod('CARD')}
              >
                <div className="w-12 h-8 bg-gradient-to-r from-purple-500 to-purple-700 rounded-lg flex items-center justify-center text-white">
                  💳
                </div>
                <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.creditCard')}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPaymentMethod === 'CARD' ? 'bg-[#FF6B35]' : 'bg-gray-200'
                }`}>
                  {selectedPaymentMethod === 'CARD' && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
              
              {/* Cash */}
              <button
                className={`w-full bg-white rounded-2xl p-4 flex items-center gap-4 border-2 transition-all ${
                  selectedPaymentMethod === 'CASH' ? 'border-[#FF6B35] bg-orange-50' : 'border-transparent hover:border-[#FF6B35]'
                }`}
                onClick={() => setSelectedPaymentMethod('CASH')}
              >
                <div className="w-12 h-8 bg-green-500 rounded-lg flex items-center justify-center text-white">
                  💵
                </div>
                <span className="flex-1 text-left font-semibold text-gray-900">{t('payment.cash')}</span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  selectedPaymentMethod === 'CASH' ? 'bg-[#FF6B35]' : 'bg-gray-200'
                }`}>
                  {selectedPaymentMethod === 'CASH' && <Check className="h-3 w-3 text-white" />}
                </div>
              </button>
            </div>
            
            {/* Pay Button */}
            <Button
              onClick={() => {
                const tipPercent = selectedTipOption === 'round' ? 0 : parseInt(selectedTipOption) || 0
                handleOrder(tipPercent, currentTipAmount, selectedPaymentMethod)
              }}
              className="w-full bg-gradient-to-r from-[#FF6B35] to-[#E85A24] hover:from-[#E85A24] hover:to-[#FF6B35] text-white rounded-2xl py-5 text-lg font-bold mt-6 shadow-lg flex items-center justify-center gap-2"
            >
              {selectedPaymentMethod === 'CASH' ? t('payment.placeOrder') : t('payment.payNow')}
              • {currencySymbol}{(getCartTotal() + currentTipAmount).toFixed(2)}
              <span>→</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout */}
      {showStripeCheckout && (
        <Dialog open={showStripeCheckout} onOpenChange={setShowStripeCheckout}>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogTitle className="sr-only">Stripe Zahlung</DialogTitle>
            <DialogDescription className="sr-only">Sichere Zahlung mit Stripe</DialogDescription>
            <StripeCheckout
              restaurantId={restaurant.id}
              orderId={`order-${Date.now()}`}
              amount={getCartTotal() + (getCartTotal() * 0.19) + currentTipAmount}
              tip={currentTipAmount}
              currency={currency}
              onSuccess={(paymentIntentId) => {
                setCart([])
                setShowStripeCheckout(false)
                toast.success(t('toast.paymentSuccess'), {
                  style: {
                    background: primaryColor,
                    color: 'white',
                    border: 'none'
                  }
                })
              }}
              onError={(error) => {
                toast.error(`Error: ${error}`)
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
        primaryColor={primaryColor}
      />
    </div>
  )
}