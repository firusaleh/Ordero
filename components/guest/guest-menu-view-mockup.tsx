'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import IntegratedCheckout from './integrated-checkout'
import OrderSuccessDialog from './order-success-dialog'
import OrderHistorySheet from './order-history-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
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
  Check,
  Calendar,
  ShoppingBag,
  Loader2
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
  isDailySpecial?: boolean
  isFeatured?: boolean
  specialPrice?: number | null
  specialValidUntil?: Date | null
  isActive?: boolean
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
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)
  const [selectedTipOption, setSelectedTipOption] = useState<string>('0')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CARD')
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [orderNumber, setOrderNumber] = useState('')

  // Use restaurant's primary color or fallback to orange
  const primaryColor = restaurant.primaryColor || '#FF6B35'
  const primaryColorHover = restaurant.primaryColor ?
    restaurant.primaryColor + 'dd' : '#ff5420'

  // Calculate service fee
  const calculateServiceFee = (subtotal: number) => {
    if (!restaurant.settings?.serviceFeeEnabled) return 0
    if (restaurant.settings.serviceFeeType === 'PERCENT') {
      return subtotal * (restaurant.settings.serviceFeePercent / 100)
    }
    return restaurant.settings.serviceFeeAmount || 0
  }

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
        throw new Error('Order failed')
      }
    } catch (error) {
      toast.error(t('toast.error'))
    } finally {
      setIsOrdering(false)
    }
  }

  const handlePaymentSuccess = (pendingPaymentId: string, orderNum: string) => {
    // Save to order history
    const sessionKey = `orders-${restaurant.slug}-table-${tableNumber}`
    const storedOrderIds = JSON.parse(localStorage.getItem(sessionKey) || '[]')
    storedOrderIds.push(pendingPaymentId)
    localStorage.setItem(sessionKey, JSON.stringify(storedOrderIds))

    setOrderNumber(orderNum)
    setCart([])
    setShowCheckout(false)
    setShowSuccessDialog(true)
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

      {/* Quick Actions - Reservierung und Vorbestellung */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
        <div className="px-5 py-3">
          <div className="grid grid-cols-2 gap-3">
            <a
              href={`/${restaurant.slug}/reserve`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-400 rounded-lg p-3 transition-all shadow-sm hover:shadow-md"
            >
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">{t('guest.actions.reserve')}</span>
            </a>
            <a
              href={`/${restaurant.slug}/preorder`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-400 rounded-lg p-3 transition-all shadow-sm hover:shadow-md"
            >
              <ShoppingBag className="h-5 w-5 text-green-600" />
              <span className="text-sm font-semibold text-green-900">{t('guest.actions.preorder')}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Tagesgerichte und Empfehlungen */}
      {(() => {
        const dailySpecials = restaurant.categories.flatMap(cat => 
          cat.menuItems.filter(item => item.isDailySpecial && item.isActive !== false)
        )
        const featured = restaurant.categories.flatMap(cat => 
          cat.menuItems.filter(item => item.isFeatured && item.isActive !== false)
        )
        
        return (dailySpecials.length > 0 || featured.length > 0) ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <div className="px-5 py-4">
              {/* Tagesgerichte */}
              {dailySpecials.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    {t('menu.dailySpecials') || 'Tagesgerichte'}
                  </h2>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {dailySpecials.slice(0, 3).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item)
                          setSelectedVariant(item.variants?.[0] || null)
                          setSelectedExtras([])
                          setItemNotes('')
                          setItemQuantity(1)
                        }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer border-2 border-amber-200"
                      >
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-base flex-1 pr-2">{item.name}</h3>
                            <div className="text-right">
                              {item.specialPrice && item.specialPrice < item.price ? (
                                <>
                                  <Badge className="bg-red-500 text-white mb-1">
                                    {t('menu.specialOffer') || 'Angebot'}
                                  </Badge>
                                  <div>
                                    <span className="text-sm text-gray-400 line-through">{formatPrice(item.price)}</span>
                                    <span className="font-bold text-lg text-red-600 ml-2">{formatPrice(item.specialPrice)}</span>
                                  </div>
                                </>
                              ) : (
                                <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Restaurant-Empfehlungen */}
              {featured.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    {t('menu.ourRecommendations') || 'Unsere Empfehlungen'}
                  </h2>
                  <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {featured.slice(0, 3).map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => {
                          setSelectedItem(item)
                          setSelectedVariant(item.variants?.[0] || null)
                          setSelectedExtras([])
                          setItemNotes('')
                          setItemQuantity(1)
                        }}
                        className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all cursor-pointer border-2 border-yellow-200"
                      >
                        <div className="p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-base flex-1 pr-2">{item.name}</h3>
                            <span className="font-bold text-lg">{formatPrice(item.price)}</span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null
      })()}

      {/* Categories */}
      <div className="bg-white border-b border-gray-100 sticky top-[140px] z-40">
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
                {restaurant.settings?.serviceFeeEnabled && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      {t('cart.serviceFee')}
                      {restaurant.settings.serviceFeeType === 'PERCENT' &&
                        ` (${restaurant.settings.serviceFeePercent}%)`}
                    </span>
                    <span>{formatPrice(calculateServiceFee(getCartTotal()))}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t">
                  <span>{t('cart.total')}</span>
                  <span>{formatPrice(getCartTotal() + calculateServiceFee(getCartTotal()))}</span>
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

      {/* Checkout Dialog - Uses IntegratedCheckout Component */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">Zahlungsoptionen</DialogTitle>
          <DialogDescription className="sr-only">Wählen Sie Ihre Zahlungsmethode und Trinkgeld</DialogDescription>
          <IntegratedCheckout
            restaurantId={restaurant.id}
            tableId={table?.id}
            tableNumber={tableNumber}
            subtotal={getCartTotal()}
            serviceFee={calculateServiceFee(getCartTotal())}
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
            primaryColor={primaryColor}
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
        primaryColor={primaryColor}
      />

      {/* Order History Sheet */}
      <OrderHistorySheet
        restaurantSlug={restaurant.slug}
        tableNumber={tableNumber}
        currency={currency}
        primaryColor={primaryColor}
      />
    </div>
  )
}
