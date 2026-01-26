'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ShoppingCart, 
  Clock, 
  Phone, 
  Mail, 
  User, 
  Plus, 
  Minus, 
  CheckCircle,
  Package,
  ChefHat,
  ArrowLeft
} from 'lucide-react'
import { format, addMinutes } from 'date-fns'
import { de, ar, enUS } from 'date-fns/locale'
import { toast } from 'sonner'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface PreOrderFormProps {
  restaurantSlug: string
  language?: string
}

interface CartItem {
  menuItemId: string
  menuItem: any
  quantity: number
  variant?: string
  extras: Array<{ name: string; price: number }>
  notes?: string
  totalPrice: number
}

export default function PreOrderForm({ restaurantSlug, language = 'de' }: PreOrderFormProps) {
  const { t } = useGuestLanguage()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState('')
  
  // Restaurant & Menu Data
  const [restaurant, setRestaurant] = useState<any>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  
  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  
  // Form Data
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    pickupTime: format(addMinutes(new Date(), 30), "yyyy-MM-dd'T'HH:mm"),
    orderType: 'PICKUP',
    notes: '',
    paymentMethod: 'CASH'
  })

  // Lade Restaurant und Menü
  useEffect(() => {
    loadMenuData()
  }, [])

  const loadMenuData = async () => {
    try {
      const response = await fetch(`/api/public/${restaurantSlug}/preorders`)
      
      if (response.ok) {
        const data = await response.json()
        setRestaurant(data.restaurant)
        setCategories(data.categories)
        if (data.categories.length > 0) {
          setSelectedCategory(data.categories[0].id)
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden des Menüs:', error)
      toast.error(t('guest.toast.menuLoadError'))
    }
  }

  // Artikel zum Warenkorb hinzufügen
  const addToCart = (menuItem: any, variant?: string, extras: any[] = []) => {
    const existingItem = cart.find(item => 
      item.menuItemId === menuItem.id && 
      item.variant === variant &&
      JSON.stringify(item.extras) === JSON.stringify(extras)
    )

    if (existingItem) {
      // Erhöhe Menge
      setCart(cart.map(item => 
        item === existingItem 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      // Neuer Artikel
      const basePrice = variant 
        ? menuItem.variants?.find((v: any) => v.name === variant)?.price || menuItem.price || 0
        : menuItem.price || 0
      
      const extrasPrice = extras.reduce((sum, extra) => sum + (extra.price || 0), 0)
      const totalPrice = basePrice + extrasPrice

      setCart([...cart, {
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1,
        variant,
        extras,
        totalPrice
      }])
    }

    toast.success(t('guest.toast.addedToCart'))
  }

  // Menge ändern
  const updateQuantity = (index: number, delta: number) => {
    const newCart = [...cart]
    newCart[index].quantity += delta
    
    if (newCart[index].quantity <= 0) {
      newCart.splice(index, 1)
    }
    
    setCart(newCart)
  }

  // Gesamtsumme berechnen
  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0)
  }

  const getLocale = () => {
    switch(language) {
      case 'ar': return ar
      case 'en': return enUS
      default: return de
    }
  }

  // Bestellung absenden
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (cart.length === 0) {
      toast.error(t('guest.toast.emptyCart'))
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`/api/public/${restaurantSlug}/preorders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          items: cart.map(item => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            variant: item.variant,
            extras: item.extras,
            notes: item.notes
          }))
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setOrderId(data.preOrder?.id || data.orderId || 'ORDER')
        
        // Wenn Online-Zahlung, leite zu Stripe weiter
        if (formData.paymentMethod === 'ONLINE' && data.preOrder?.paymentUrl) {
          window.location.href = data.preOrder.paymentUrl
        }
      } else {
        toast.error(data.error || t('guest.toast.orderError'))
      }
    } catch (error) {
      toast.error(t('guest.toast.networkError'))
    } finally {
      setLoading(false)
    }
  }

  // Erfolgsansicht
  if (success && formData.paymentMethod !== 'ONLINE') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold">{t('guest.preorderForm.success.title')}</h2>
            <p className="text-gray-600">
              {t('guest.preorderForm.success.message')}
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">{t('guest.preorderForm.success.orderNumber')}</p>
              <p className="text-2xl font-mono font-bold">{orderId.slice(-8).toUpperCase()}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <Clock className="h-5 w-5 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-800">
                {t('guest.preorderForm.success.pickupTime')} {format(new Date(formData.pickupTime), 'PPp', { locale: getLocale() })}
              </p>
            </div>
            <div className="pt-4">
              <Button onClick={() => window.location.reload()}>
                {t('guest.preorderForm.success.newOrder')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Menü */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4 mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => window.location.href = `/r/${restaurantSlug}`}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1">
                  <CardTitle>
                    <ChefHat className="inline h-5 w-5 mr-2" />
                    {t('guest.preorderForm.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('guest.preorderForm.subtitle')}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Kategorien */}
              <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                  {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.id}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {/* Menü-Items */}
                {categories.map(category => (
                  <TabsContent key={category.id} value={category.id} className="space-y-4">
                    {category.menuItems.map((item: any) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-lg font-bold">€{(item.price || 0).toFixed(2)}</span>
                                {item.tags?.includes('vegan') && (
                                  <Badge variant="secondary" className="text-xs">{t('guest.preorderForm.tags.vegan')}</Badge>
                                )}
                                {item.tags?.includes('vegetarian') && (
                                  <Badge variant="secondary" className="text-xs">{t('guest.preorderForm.tags.vegetarian')}</Badge>
                                )}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Varianten */}
                          {item.variants && item.variants.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm font-medium mb-2">Größe wählen:</p>
                              <div className="flex gap-2">
                                {item.variants.map((variant: any) => (
                                  <Button
                                    key={variant.name}
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addToCart(item, variant.name)}
                                  >
                                    {variant.name} - €{(variant.price || 0).toFixed(2)}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Warenkorb & Checkout */}
        <div className="space-y-6">
          {/* Warenkorb */}
          <Card>
            <CardHeader>
              <CardTitle>
                <ShoppingCart className="inline h-5 w-5 mr-2" />
                {t('guest.preorderForm.cart')} ({cart.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  {t('guest.preorderForm.emptyCart')}
                </p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.menuItem.name}</p>
                        {item.variant && (
                          <p className="text-xs text-gray-500">{item.variant}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateQuantity(index, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <span className="ml-2 font-medium">
                          €{((item.totalPrice || 0) * (item.quantity || 1)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-3 border-t">
                    <div className="flex justify-between font-bold">
                      <span>{t('guest.preorderForm.total')}:</span>
                      <span>€{getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Checkout Form */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('guest.preorderForm.yourData')}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="pickupTime">
                      <Clock className="inline h-4 w-4 mr-1" />
                      {t('guest.preorderForm.pickupTime')} *
                    </Label>
                    <Input
                      id="pickupTime"
                      type="datetime-local"
                      required
                      min={format(addMinutes(new Date(), 20), "yyyy-MM-dd'T'HH:mm")}
                      max={format(addMinutes(new Date(), 24 * 60), "yyyy-MM-dd'T'HH:mm")}
                      value={formData.pickupTime}
                      onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">
                      <User className="inline h-4 w-4 mr-1" />
                      {t('guest.preorderForm.name')} *
                    </Label>
                    <Input
                      id="name"
                      required
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">
                      <Phone className="inline h-4 w-4 mr-1" />
                      {t('guest.preorderForm.phone')} *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      {t('guest.preorderForm.email')} *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">{t('guest.preorderForm.notes')}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>{t('guest.preorderForm.paymentMethod')}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <Button
                        type="button"
                        variant={formData.paymentMethod === 'CASH' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'CASH' })}
                      >
                        {t('guest.preorderForm.payLater')}
                      </Button>
                      <Button
                        type="button"
                        variant={formData.paymentMethod === 'ONLINE' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormData({ ...formData, paymentMethod: 'ONLINE' })}
                      >
                        {t('guest.preorderForm.payNow')}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? t('guest.preorderForm.processing') : t('guest.preorderForm.placeOrder')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}