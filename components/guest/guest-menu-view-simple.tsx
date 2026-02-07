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
  Calendar,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { GuestLanguageProvider, useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSelector from './language-selector'
import { getLocalizedTableName } from '@/lib/table-helpers'

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
  description?: string | null
  menuItems: MenuItem[]
}

interface Restaurant {
  id: string
  name: string
  slug: string
  description?: string | null
  primaryColor?: string | null
  logo?: string | null
  banner?: string | null
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
  table?: any
  tableNumber?: number
  onCartUpdate?: (cart: CartItem[]) => void
  onCheckout?: () => void
  isPreOrder?: boolean
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

export default function GuestMenuViewSimple({ 
  restaurant, 
  table, 
  tableNumber,
  onCartUpdate,
  onCheckout: onCheckoutProp,
  isPreOrder = false 
}: GuestMenuViewProps) {
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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CARD')
  const [selectedTipOption, setSelectedTipOption] = useState<string>('0')
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)

  // Notify parent when cart changes (for pre-order)
  useEffect(() => {
    if (onCartUpdate) {
      onCartUpdate(cart)
    }
  }, [cart, onCartUpdate])
  
  // Debug logging
  useEffect(() => {
    console.log('Restaurant Data:', {
      name: restaurant.name,
      country: restaurant.country,
      city: restaurant.city,
      settings: restaurant.settings
    })
  }, [restaurant])
  
  // Währungshelfer basierend auf Restaurant-Einstellungen
  const currency = restaurant.settings?.currency || 'EUR'
  const currencySymbol = currency === 'JOD' ? 'JD' : 
                        currency === 'USD' ? '$' : 
                        currency === 'AED' ? 'AED' : 
                        currency === 'SAR' ? 'SAR' :
                        currency === 'KWD' ? 'KWD' :
                        currency === 'BHD' ? 'BHD' :
                        currency === 'QAR' ? 'QAR' :
                        currency === 'OMR' ? 'OMR' :
                        currency === 'EGP' ? 'EGP' : '€'
  const formatPrice = (price: number) => `${currencySymbol}${price.toFixed(2)}`

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

  const openItemDialog = (item: MenuItem) => {
    setSelectedItem(item)
    setSelectedVariant(item.variants.length > 0 ? item.variants[0] : null)
    setSelectedExtras([])
    setItemNotes('')
    setItemQuantity(1)
  }

  const addToCart = () => {
    if (!selectedItem) return

    // Verwende Sonderpreis wenn es ein Tagesgericht mit Sonderpreis ist
    const itemWithPrice = {
      ...selectedItem,
      price: (selectedItem.isDailySpecial && selectedItem.specialPrice && selectedItem.specialPrice < selectedItem.price) 
        ? selectedItem.specialPrice 
        : selectedItem.price
    }

    const variantId = selectedVariant ? `-${selectedVariant.id}` : '-default'
    const extrasId = selectedExtras.length > 0 
      ? `-${selectedExtras.map(e => e.id).sort().join('-')}`
      : ''
    const timestamp = Date.now()
    const cartId = `${selectedItem.id}${variantId}${extrasId}-${timestamp}`
    
    const existingItem = cart.find(c => 
      c.menuItem.id === selectedItem.id && 
      c.variant?.id === selectedVariant?.id &&
      JSON.stringify(c.extras.map(e => e.id).sort()) === JSON.stringify(selectedExtras.map(e => e.id).sort()) &&
      c.notes === itemNotes
    )

    if (existingItem) {
      setCart(cart.map(c => 
        c.id === existingItem.id
          ? { ...c, quantity: c.quantity + itemQuantity }
          : c
      ))
    } else {
      setCart([...cart, {
        id: cartId,
        menuItem: itemWithPrice,
        quantity: itemQuantity,
        variant: selectedVariant || undefined,
        extras: selectedExtras,
        notes: itemNotes || undefined
      }])
    }

    toast.success(`${itemQuantity}x ${selectedItem.name} ${t('common.addToCart')}`)
    setSelectedItem(null)
  }

  const toggleExtra = (extra: MenuItemExtra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id)
      if (exists) {
        return prev.filter(e => e.id !== extra.id)
      } else {
        return [...prev, extra]
      }
    })
  }

  const getDialogItemPrice = () => {
    if (!selectedItem) return 0
    const basePrice = selectedVariant?.price || selectedItem.price
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
    return (basePrice + extrasPrice) * itemQuantity
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
    toast.info(t('cart.removeItem'))
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

  // Translate category names based on common patterns
  const translateCategoryName = (name: string): string => {
    const lowerName = name.toLowerCase()
    
    // German to current language
    if (lowerName === 'vorspeisen' || lowerName === 'starters' || lowerName === 'appetizers') {
      return language === 'ar' ? 'المقبلات' : 
             language === 'en' ? 'Appetizers' : 
             'Vorspeisen'
    }
    if (lowerName === 'hauptgerichte' || lowerName === 'hauptspeisen' || lowerName === 'main courses' || lowerName === 'mains') {
      return language === 'ar' ? 'الأطباق الرئيسية' : 
             language === 'en' ? 'Main Courses' : 
             'Hauptgerichte'
    }
    if (lowerName === 'nachspeisen' || lowerName === 'desserts' || lowerName === 'nachtisch') {
      return language === 'ar' ? 'الحلويات' : 
             language === 'en' ? 'Desserts' : 
             'Nachspeisen'
    }
    if (lowerName === 'getränke' || lowerName === 'beverages' || lowerName === 'drinks') {
      return language === 'ar' ? 'المشروبات' : 
             language === 'en' ? 'Beverages' : 
             'Getränke'
    }
    if (lowerName === 'salate' || lowerName === 'salads') {
      return language === 'ar' ? 'السلطات' : 
             language === 'en' ? 'Salads' : 
             'Salate'
    }
    if (lowerName === 'suppen' || lowerName === 'soups') {
      return language === 'ar' ? 'الشوربات' : 
             language === 'en' ? 'Soups' : 
             'Suppen'
    }
    if (lowerName === 'pizza') {
      return language === 'ar' ? 'البيتزا' : 'Pizza'
    }
    if (lowerName === 'pasta') {
      return language === 'ar' ? 'المعكرونة' : 'Pasta'
    }
    if (lowerName === 'burger' || lowerName === 'burgers') {
      return language === 'ar' ? 'البرجر' : 'Burger'
    }
    if (lowerName === 'sandwiches' || lowerName === 'sandwich') {
      return language === 'ar' ? 'السندويشات' : 'Sandwiches'
    }
    if (lowerName === 'frühstück' || lowerName === 'breakfast') {
      return language === 'ar' ? 'الإفطار' : 
             language === 'en' ? 'Breakfast' : 
             'Frühstück'
    }
    if (lowerName === 'mittagessen' || lowerName === 'lunch') {
      return language === 'ar' ? 'الغداء' : 
             language === 'en' ? 'Lunch' : 
             'Mittagessen'
    }
    if (lowerName === 'abendessen' || lowerName === 'dinner') {
      return language === 'ar' ? 'العشاء' : 
             language === 'en' ? 'Dinner' : 
             'Abendessen'
    }
    if (lowerName === 'beilagen' || lowerName === 'sides' || lowerName === 'side dishes') {
      return language === 'ar' ? 'الأطباق الجانبية' : 
             language === 'en' ? 'Side Dishes' : 
             'Beilagen'
    }
    if (lowerName === 'snacks') {
      return language === 'ar' ? 'الوجبات الخفيفة' : 'Snacks'
    }
    if (lowerName === 'kaffee' || lowerName === 'coffee') {
      return language === 'ar' ? 'القهوة' : 
             language === 'en' ? 'Coffee' : 
             'Kaffee'
    }
    if (lowerName === 'tee' || lowerName === 'tea') {
      return language === 'ar' ? 'الشاي' : 
             language === 'en' ? 'Tea' : 
             'Tee'
    }
    if (lowerName === 'säfte' || lowerName === 'juices') {
      return language === 'ar' ? 'العصائر' : 
             language === 'en' ? 'Juices' : 
             'Säfte'
    }
    
    // Return original name if no translation found
    return name
  }

  // Handle cash order (called from IntegratedCheckout)
  const handleCashOrder = async () => {
    if (cart.length === 0) return

    setIsOrdering(true)

    try {
      const tipPercent = selectedTipOption === 'round' ? 0 : parseInt(selectedTipOption) || 0

      const orderData = {
        restaurantId: restaurant.id,
        tableId: table?.id,
        tableNumber: table?.number || tableNumber,
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
        })),
        tipPercent,
        tipAmount: currentTipAmount,
        paymentMethod: 'CASH'
      }

      const response = await fetch(`/api/public/${restaurant.slug}/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        throw new Error(t('checkout.orderFailed'))
      }

      const result = await response.json()

      toast.success(`${t('guest.orderNumber')} #${result.data.orderNumber} - ${t('guest.orderConfirmed')}`)
      setCart([])
      setIsCartOpen(false)
      setShowCheckout(false)

    } catch (error) {
      toast.error(`${t('checkout.orderFailed')}. ${t('checkout.tryAgain')}.`)
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

    toast.success(t('guest.orderConfirmed'))
    setCart([])
    setIsCartOpen(false)
    setShowCheckout(false)
  }

  const calculateTax = () => {
    const taxRate = restaurant.settings?.taxRate || 19
    const includeTax = restaurant.settings?.includeTax ?? true
    const subtotal = getCartTotal()
    
    if (includeTax) {
      // Preise enthalten bereits MwSt
      const tax = subtotal - (subtotal / (1 + taxRate / 100))
      return {
        subtotal: subtotal - tax,
        tax
      }
    } else {
      // Preise ohne MwSt
      const tax = subtotal * (taxRate / 100)
      return {
        subtotal,
        tax
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Image */}
      {restaurant.banner && (
        <div className="relative h-48 md:h-64 w-full overflow-hidden">
          <img 
            src={restaurant.banner} 
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {/* Logo overlay on banner */}
          {restaurant.logo && (
            <div className="absolute bottom-4 left-4 bg-white rounded-lg p-2 shadow-lg">
              <img 
                src={restaurant.logo} 
                alt={`${restaurant.name} Logo`}
                className="h-16 w-16 object-contain"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Mobile Optimized Header */}
      <div className="bg-white shadow-md sticky top-0 z-50 border-b">
        <div className="px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Logo in header if no banner */}
              {restaurant.logo && !restaurant.banner && (
                <img 
                  src={restaurant.logo} 
                  alt={`${restaurant.name} Logo`}
                  className="h-8 w-8 object-contain rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">
                  {/* Don't show generic menu names as restaurant name */}
                  {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(restaurant.name) 
                    ? t('common.welcome') || 'Welcome' 
                    : restaurant.name}
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {cuisineEmojis[restaurant.cuisine || 'other']} {getLocalizedTableName(tableNumber || 0, language)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <LanguageSelector />
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md transition-all active:scale-95"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <>
                    <span className="ml-1 font-semibold text-xs hidden xs:inline">{formatPrice(getCartTotal())}</span>
                    <Badge 
                      className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]"
                    >
                      {getCartItemCount()}
                    </Badge>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Tagesgerichte und Empfehlungen */}
      {(() => {
        // Debug: Alle Menü-Items prüfen
        const allItems = restaurant.categories.flatMap(cat => cat.menuItems)
        console.log('DEBUG: Alle Menü-Items:', allItems.map(item => ({
          name: item.name,
          isDailySpecial: item.isDailySpecial,
          isFeatured: item.isFeatured,
          isActive: item.isActive
        })))
        
        const dailySpecials = restaurant.categories.flatMap(cat => 
          cat.menuItems.filter(item => item.isDailySpecial && item.isActive !== false)
        )
        const featured = restaurant.categories.flatMap(cat => 
          cat.menuItems.filter(item => item.isFeatured && item.isActive !== false)
        )
        
        console.log('DEBUG: Gefundene Tagesgerichte:', dailySpecials.length)
        console.log('DEBUG: Gefundene Empfehlungen:', featured.length)
        
        return (dailySpecials.length > 0 || featured.length > 0) ? (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <div className="px-4 py-4">
              {/* Tagesgerichte */}
              {dailySpecials.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">🍽️</span>
                    {language === 'de' ? 'Tagesgerichte' : language === 'ar' ? 'أطباق اليوم' : 'Daily Specials'}
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
                                    {language === 'de' ? 'Angebot' : language === 'ar' ? 'عرض' : 'Special'}
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
                    {language === 'de' ? 'Unsere Empfehlungen' : language === 'ar' ? 'توصياتنا' : 'Our Recommendations'}
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

      {/* Quick Actions - Prominente Buttons für Reservierung und Vorbestellung */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <a 
              href={`/${restaurant.slug}/reserve`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-blue-50 border-2 border-blue-300 hover:border-blue-400 rounded-lg p-4 transition-all shadow-sm hover:shadow-lg"
            >
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-base font-semibold text-blue-900">{t('guest.reservation.title') || 'Tisch reservieren'}</span>
            </a>
            <a 
              href={`/${restaurant.slug}/preorder`}
              className="flex items-center justify-center gap-2 bg-white hover:bg-green-50 border-2 border-green-300 hover:border-green-400 rounded-lg p-4 transition-all shadow-sm hover:shadow-lg"
            >
              <ShoppingBag className="h-6 w-6 text-green-600" />
              <span className="text-base font-semibold text-green-900">{t('guest.preorder.title') || 'Vorbestellen'}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Restaurant Info */}
      {(restaurant.description || restaurant.street) && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-3">
            {restaurant.description && (
              <p className="text-gray-600 mb-2">{restaurant.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {restaurant.street && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{restaurant.street}, {restaurant.postalCode} {restaurant.city}</span>
                </div>
              )}
              {restaurant.phone && (
                <div className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  <span>{restaurant.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Categories */}
      <div className="bg-white border-b sticky top-[48px] z-40">
        <div className="px-2">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {restaurant.categories.map((category) => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-2 ${
                    isSelected 
                      ? 'text-white shadow-lg transform scale-105' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: isSelected 
                      ? (restaurant.primaryColor || '#3b82f6') 
                      : undefined
                  }}
                >
                  <span className="font-medium">
                    {/* Avoid showing generic menu names as category names */}
                    {['قائمة الطعام', 'Speisekarte', 'Menu'].includes(category.name) 
                      ? (language === 'ar' ? 'الأصناف' : language === 'de' ? 'Gerichte' : 'Dishes')
                      : translateCategoryName(category.name)}
                  </span>
                  <Badge 
                    variant={isSelected ? "secondary" : "outline"}
                    className={isSelected ? "bg-white/20 text-white border-white/30" : ""}
                  >
                    {category.menuItems.length}
                  </Badge>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Mobile Optimized Menu Grid */}
      <div className="px-3 py-3">
        {restaurant.categories
          .filter(cat => cat.id === selectedCategory)
          .map((category) => (
            <div key={category.id}>
              {/* Don't show admin descriptions in guest view */}
              {category.description && 
               !category.description.includes('إدارة') && 
               !category.description.includes('Verwalten') && 
               !category.description.includes('Manage') && (
                <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
                  <p className="text-gray-600">{category.description}</p>
                </div>
              )}
              
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 menu-grid-mobile">
                {category.menuItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden menu-item-card cursor-pointer">
                    <div onClick={() => {
                      setSelectedItem(item)
                      setSelectedVariant(item.variants[0] || null)
                      setSelectedExtras([])
                      setItemNotes('')
                      setItemQuantity(1)
                    }}>
                    {item.image ? (
                      <div className="relative h-36 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-200">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHRleHQtYW5jaG9yPSJtaWRkbGUiIHg9IjIwMCIgeT0iMTUwIiBzdHlsZT0iZmlsbDojYWFhO2ZvbnQtd2VpZ2h0OmJvbGQ7Zm9udC1zaXplOjI1cHg7Zm9udC1mYW1pbHk6QXJpYWwsSGVsdmV0aWNhLHNhbnMtc2VyaWY7ZG9taW5hbnQtYmFzZWxpbmU6Y2VudHJhbCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+'
                          }}
                        />
                        <div className="absolute top-2 right-2 flex flex-col gap-1">
                          <Badge className="bg-white/95 backdrop-blur-sm text-gray-900 font-bold shadow-lg px-2 py-1">
                            {formatPrice(item.price)}
                          </Badge>
                          {item.variants && item.variants.length > 0 && (
                            <Badge className="bg-blue-500/90 text-white backdrop-blur-sm shadow-md">
                              {item.variants.length} {t('item.sizes') || 'Größen'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-36 sm:h-44 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <span className="text-5xl opacity-30">🍽️</span>
                      </div>
                    )}
                    </div>
                    
                    <CardContent className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <h3 className="font-semibold text-base text-gray-900 line-clamp-2">{item.name}</h3>
                          {item.variants && item.variants.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              {t('item.from') || 'ab'} {formatPrice(Math.min(...item.variants.map(v => v.price)))}
                            </p>
                          )}
                        </div>
                        {!item.image && (
                          <Badge className="font-bold text-lg" style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}>
                            {formatPrice(item.price)}
                          </Badge>
                        )}
                      </div>
                      
                      {item.description && (
                        <p className="text-sm text-gray-600 mb-3">
                          {item.description}
                        </p>
                      )}
                      
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {item.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {item.allergens.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                          <Info className="h-3 w-3" />
                          <span>Allergene: {item.allergens.join(', ')}</span>
                        </div>
                      )}
                      
                      <Button
                        className="w-full"
                        style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                        onClick={() => openItemDialog(item)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {item.variants.length > 0 || item.extras.length > 0 ? t('common.select') : t('common.addToCart')}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t('cart.title')}</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('cart.emptyCart')}</p>
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
                          <p className="text-sm text-gray-500 italic">"{item.notes}"</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPrice((item.variant?.price || item.menuItem.price) + 
                            item.extras.reduce((sum, e) => sum + e.price, 0))} {t('item.perPiece') || 'pro Stück'}
                        </p>
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
                      <span className="font-bold">
                        {formatPrice(getItemPrice(item))}
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
                <div className="bg-gray-100 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">{t('common.total')}</span>
                    <span className="text-xl font-bold">
                      {formatPrice(getCartTotal())}
                    </span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    if (isPreOrder && onCheckoutProp) {
                      onCheckoutProp()
                    } else {
                      setShowCheckout(true)
                    }
                  }}
                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                >
                  {isPreOrder ? t('guest.preorder.proceed') : t('checkout.proceedToCheckout')}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedItem.name}</DialogTitle>
                {selectedItem.image && (
                  <div className="relative h-48 rounded-lg overflow-hidden mt-2">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {selectedItem.description && (
                  <p className="text-sm text-gray-600">{selectedItem.description}</p>
                )}
                
                {/* {t('item.variants')} */}
                {selectedItem.variants.length > 0 && (
                  <div>
                    <Label className="text-base font-medium mb-3 block">{t('item.variants')}</Label>
                    <RadioGroup
                      value={selectedVariant?.id || ''}
                      onValueChange={(value) => {
                        const variant = selectedItem.variants.find(v => v.id === value)
                        setSelectedVariant(variant || null)
                      }}
                    >
                      {selectedItem.variants.map((variant) => (
                        <div key={variant.id} className="flex items-center space-x-2 mb-2">
                          <RadioGroupItem value={variant.id} id={variant.id} />
                          <Label 
                            htmlFor={variant.id} 
                            className="flex-1 cursor-pointer flex justify-between"
                          >
                            <span>{variant.name}</span>
                            <span className="font-medium">{formatPrice(variant.price)}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
                
                {/* {t('item.extras')} */}
                {selectedItem.extras.length > 0 && (
                  <div>
                    <Label className="text-base font-medium mb-3 block">{t('item.extras')}</Label>
                    <div className="space-y-2">
                      {selectedItem.extras.map((extra) => (
                        <div key={extra.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={extra.id}
                            checked={selectedExtras.some(e => e.id === extra.id)}
                            onCheckedChange={() => toggleExtra(extra)}
                          />
                          <Label 
                            htmlFor={extra.id} 
                            className="flex-1 cursor-pointer flex justify-between"
                          >
                            <span>{extra.name}</span>
                            <span className="font-medium">+{formatPrice(extra.price)}</span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notizen */}
                <div>
                  <Label htmlFor="notes" className="text-base font-medium mb-2 block">
                    {t('item.specialRequest')}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={t('common.optional')}
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                {/* {t('common.quantity')} */}
                <div>
                  <Label className="text-base font-medium mb-3 block">{t('common.quantity')}</Label>
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                      disabled={itemQuantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-xl font-medium w-12 text-center">{itemQuantity}</span>
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
                  <div className="flex items-start gap-2 text-sm text-gray-500 pt-2 border-t">
                    <Info className="h-4 w-4 mt-0.5" />
                    <div>
                      <span className="font-medium">Allergene:</span>
                      <span className="ml-1">{selectedItem.allergens.join(', ')}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  style={{ backgroundColor: restaurant.primaryColor || '#3b82f6' }}
                  onClick={addToCart}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('common.addToCart')} ({t('common.currency')}{getDialogItemPrice().toFixed(2)})
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Unified Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{t('checkout.paymentOptions') || 'Zahlungsoptionen'}</DialogTitle>
          <DialogDescription className="sr-only">{t('checkout.selectPaymentMethod') || 'Wählen Sie Ihre Zahlungsmethode'}</DialogDescription>
          {cart.length > 0 && (() => {
            const { subtotal, tax } = calculateTax()

            return (
              <IntegratedCheckout
                restaurantId={restaurant.id}
                tableId={table?.id}
                tableNumber={tableNumber}
                subtotal={subtotal}
                serviceFee={tax}
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
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}