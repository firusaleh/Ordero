'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import CheckoutWithTip from './checkout-with-tip'
import StripeCheckout from './stripe-checkout-new'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
  Search,
  Filter,
  ChevronRight,
  Check,
  Sparkles,
  Heart,
  TrendingUp,
  Flame
} from 'lucide-react'
import { toast } from 'sonner'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import LanguageSelector from './language-selector'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

// ... (interfaces bleiben gleich)

export default function GuestMenuViewModern({ restaurant, table, tableNumber }: GuestMenuViewProps) {
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
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>('CASH')
  const [currentTipAmount, setCurrentTipAmount] = useState<number>(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  // Währungshelfer
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
      setCart(JSON.parse(savedCart))
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

  const getCartItemCount = () => cart.reduce((sum, item) => sum + item.quantity, 0)
  const getCartTotal = () => cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0)
  const getItemPrice = (item: CartItem) => {
    const basePrice = item.variant?.price || item.menuItem.price
    const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0)
    return basePrice + extrasPrice
  }

  const addToCart = (item: MenuItem, variant?: MenuItemVariant, extras: MenuItemExtra[] = [], notes?: string, quantity: number = 1) => {
    const cartItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      menuItem: item,
      quantity,
      variant,
      extras,
      notes
    }
    
    setCart([...cart, cartItem])
    toast.success(`${item.name} ${t('guest.addedToCart') || 'zum Warenkorb hinzugefügt'}`, {
      duration: 2000,
      position: 'bottom-center'
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

  // Filter menu items based on search
  const filteredCategories = restaurant.categories.map(category => ({
    ...category,
    menuItems: category.menuItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => 
    searchQuery === '' || category.menuItems.length > 0
  )

  const currentCategory = filteredCategories.find(c => c.id === selectedCategory)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {t('guest.table')} {tableNumber}
                </Badge>
                {restaurant.cuisine && (
                  <span className="text-xs text-gray-500">{restaurant.cuisine}</span>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className="relative"
              >
                <Search className="h-5 w-5" />
              </Button>
              
              <LanguageSelector />
              
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <>
                    <span className="ml-2 font-semibold">{formatPrice(getCartTotal())}</span>
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white"
                    >
                      {getCartItemCount()}
                    </Badge>
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* Search Bar */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3"
              >
                <Input
                  type="text"
                  placeholder={t('guest.searchMenu') || 'Menü durchsuchen...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* Categories Tabs */}
        <div className="border-t">
          <div className="px-2 overflow-x-auto">
            <div className="flex gap-1 py-2">
              {restaurant.categories.map((category) => {
                const isSelected = selectedCategory === category.id
                const hasItems = filteredCategories.find(c => c.id === category.id)?.menuItems.length > 0
                
                if (!hasItems && searchQuery) return null
                
                return (
                  <Button
                    key={category.id}
                    variant={isSelected ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      whitespace-nowrap flex items-center gap-1 transition-all
                      ${isSelected 
                        ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-md' 
                        : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    <span>{category.icon || '🍽️'}</span>
                    <span>{category.name}</span>
                    {category.menuItems.length > 0 && (
                      <Badge variant="secondary" className="ml-1 px-1 text-xs">
                        {category.menuItems.length}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="px-4 py-4">
        {currentCategory?.menuItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-500">
              {t('guest.noItemsInCategory') || 'Keine Artikel in dieser Kategorie'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentCategory?.menuItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => {
                    setSelectedItem(item)
                    setSelectedVariant(item.variants[0] || null)
                    setSelectedExtras([])
                    setItemNotes('')
                    setItemQuantity(1)
                  }}
                >
                  {/* Item Image */}
                  {item.image ? (
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      {/* Popular Badge */}
                      {Math.random() > 0.7 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                          <Flame className="h-3 w-3 mr-1" />
                          Beliebt
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <span className="text-6xl opacity-50">🍽️</span>
                    </div>
                  )}
                  
                  {/* Item Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 flex-1 pr-2">{item.name}</h3>
                      <div className="text-right">
                        {item.variants.length > 0 ? (
                          <div className="text-sm text-gray-500">
                            ab <span className="text-lg font-bold text-gray-900">
                              {formatPrice(Math.min(...item.variants.map(v => v.price)))}
                            </span>
                          </div>
                        ) : (
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(item.price)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Info className="h-3 w-3 mr-1" />
                          Allergene
                        </Badge>
                      )}
                      {item.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedItem.name}</DialogTitle>
              </DialogHeader>
              
              {/* Image */}
              {selectedItem.image && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden">
                  <Image
                    src={selectedItem.image}
                    alt={selectedItem.name}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              
              <div className="space-y-4">
                {/* Description */}
                {selectedItem.description && (
                  <p className="text-gray-600">{selectedItem.description}</p>
                )}
                
                {/* Allergens */}
                {selectedItem.allergens.length > 0 && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-yellow-800">
                      <Info className="h-4 w-4" />
                      <span className="font-medium">Allergene:</span>
                      <span>{selectedItem.allergens.join(', ')}</span>
                    </div>
                  </div>
                )}
                
                {/* Variants */}
                {selectedItem.variants.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      {t('guest.chooseSize') || 'Größe wählen'}
                    </Label>
                    <RadioGroup
                      value={selectedVariant?.id}
                      onValueChange={(value) => {
                        const variant = selectedItem.variants.find(v => v.id === value)
                        setSelectedVariant(variant || null)
                      }}
                    >
                      {selectedItem.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer mb-2"
                          onClick={() => setSelectedVariant(variant)}
                        >
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={variant.id} id={variant.id} />
                            <Label htmlFor={variant.id} className="cursor-pointer">
                              {variant.name}
                            </Label>
                          </div>
                          <span className="font-semibold">{formatPrice(variant.price)}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
                
                {/* Extras */}
                {selectedItem.extras.length > 0 && (
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      {t('guest.addExtras') || 'Extras hinzufügen'}
                    </Label>
                    <div className="space-y-2">
                      {selectedItem.extras.map((extra) => (
                        <div
                          key={extra.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (selectedExtras.find(e => e.id === extra.id)) {
                              setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
                            } else {
                              setSelectedExtras([...selectedExtras, extra])
                            }
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={!!selectedExtras.find(e => e.id === extra.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedExtras([...selectedExtras, extra])
                                } else {
                                  setSelectedExtras(selectedExtras.filter(e => e.id !== extra.id))
                                }
                              }}
                            />
                            <Label className="cursor-pointer">{extra.name}</Label>
                          </div>
                          <span className="font-semibold">+{formatPrice(extra.price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Notes */}
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-2 block">
                    {t('guest.specialRequests') || 'Besondere Wünsche'}
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder={t('guest.notesPlaceholder') || 'z.B. ohne Zwiebeln, extra scharf...'}
                    value={itemNotes}
                    onChange={(e) => setItemNotes(e.target.value)}
                    className="min-h-20"
                  />
                </div>
                
                {/* Quantity */}
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">
                    {t('guest.quantity') || 'Anzahl'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-12 text-center font-semibold text-lg">{itemQuantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setItemQuantity(itemQuantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {t('guest.addToCart') || 'In den Warenkorb'} • {
                    formatPrice((selectedVariant?.price || selectedItem.price) + 
                    selectedExtras.reduce((sum, e) => sum + e.price, 0)) 
                  } × {itemQuantity}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Sheet */}
      <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader>
            <SheetTitle className="text-xl">
              {t('guest.yourOrder') || 'Ihre Bestellung'}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto py-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {t('guest.cartEmpty') || 'Ihr Warenkorb ist leer'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.menuItem.name}</h4>
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
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500 hover:text-red-700"
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
                      <span className="font-semibold">
                        {formatPrice(getItemPrice(item) * item.quantity)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          
          {cart.length > 0 && (
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>{t('common.total') || 'Gesamt'}</span>
                  <span className="text-xl">{formatPrice(getCartTotal())}</span>
                </div>
                <Button
                  onClick={() => {
                    setIsCartOpen(false)
                    setShowCheckout(true)
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  size="lg"
                >
                  <ChevronRight className="h-5 w-5 mr-2" />
                  {t('guest.proceedToCheckout') || 'Zur Kasse'}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {t('guest.checkout') || 'Kasse'}
            </DialogTitle>
          </DialogHeader>
          {(() => {
            const { subtotal, tax } = calculateTax()
            const isMiddleEast = ['JO', 'SA', 'AE', 'KW', 'BH', 'QA', 'OM', 'EG'].includes(restaurant.country || '')
            const paymentProvider = isMiddleEast ? 'PayTabs' : 'Stripe'
            
            return (
              <CheckoutWithTip
                subtotal={subtotal}
                tax={tax}
                onConfirm={handleOrder}
                isProcessing={isOrdering}
                currency={currency}
                currencySymbol={currencySymbol}
                paymentProvider={paymentProvider}
              />
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Stripe Checkout Dialog */}
      <Dialog open={showStripeCheckout} onOpenChange={(open) => {
        if (!open && !isOrdering) {
          handleStripeCancel()
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>💳 {t('payment.cardPayment') || 'Kartenzahlung'}</DialogTitle>
          </DialogHeader>
          
          {cart.length > 0 && (() => {
            const { subtotal, tax } = calculateTax()
            const baseAmount = subtotal + tax
            
            return (
              <StripeCheckout
                amount={baseAmount}
                currency={currency}
                orderId={`temp-${Date.now()}`}
                restaurantId={restaurant.id}
                tip={currentTipAmount}
                onSuccess={handleStripeSuccess}
                onCancel={handleStripeCancel}
                country={restaurant.country || 'DE'}
              />
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}