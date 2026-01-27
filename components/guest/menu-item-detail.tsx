"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Info, Plus, Minus } from 'lucide-react'
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

interface MenuItemDetailProps {
  item: MenuItem
  onClose: () => void
  onAdd: (
    item: MenuItem,
    variant?: MenuItemVariant,
    extras?: MenuItemExtra[],
    notes?: string
  ) => void
  primaryColor?: string | null
}

export default function MenuItemDetail({
  item,
  onClose,
  onAdd,
  primaryColor
}: MenuItemDetailProps) {
  const { t } = useGuestLanguage()
  const [selectedVariant, setSelectedVariant] = useState<MenuItemVariant | undefined>(
    item.variants.length > 0 ? item.variants[0] : undefined
  )
  const [selectedExtras, setSelectedExtras] = useState<MenuItemExtra[]>([])
  const [notes, setNotes] = useState('')
  const [quantity, setQuantity] = useState(1)

  const toggleExtra = (extra: MenuItemExtra) => {
    setSelectedExtras(prev => {
      const exists = prev.find(e => e.id === extra.id)
      if (exists) {
        return prev.filter(e => e.id !== extra.id)
      }
      return [...prev, extra]
    })
  }

  const calculatePrice = () => {
    const basePrice = selectedVariant?.price || item.price
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0)
    return (basePrice + extrasPrice) * quantity
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      onAdd(item, selectedVariant, selectedExtras, notes)
    }
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {item.image && (
            <div className="w-full h-48 bg-gray-200 rounded-lg" />
          )}

          {item.description && (
            <p className="text-sm text-gray-600">{item.description}</p>
          )}

          {item.allergens.length > 0 && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                {t('item.allergens') || 'Allergene'}: {item.allergens.join(', ')}
              </span>
            </div>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {item.tags.map(tag => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Varianten */}
          {item.variants.length > 0 && (
            <div className="space-y-3">
              <Label>{t('item.selectSize') || 'Größe wählen'}</Label>
              <RadioGroup
                value={selectedVariant?.id}
                onValueChange={(value) => {
                  const variant = item.variants.find(v => v.id === value)
                  setSelectedVariant(variant)
                }}
              >
                {item.variants.map(variant => (
                  <div key={variant.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={variant.id} id={variant.id} />
                      <Label htmlFor={variant.id} className="font-normal cursor-pointer">
                        {variant.name}
                      </Label>
                    </div>
                    <span className="text-sm font-medium">
                      €{variant.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Extras */}
          {item.extras.length > 0 && (
            <div className="space-y-3">
              <Label>{t('item.addExtras') || 'Extras hinzufügen'}</Label>
              <div className="space-y-2">
                {item.extras.map(extra => (
                  <div key={extra.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={extra.id}
                        checked={selectedExtras.some(e => e.id === extra.id)}
                        onCheckedChange={() => toggleExtra(extra)}
                      />
                      <Label htmlFor={extra.id} className="font-normal cursor-pointer">
                        {extra.name}
                      </Label>
                    </div>
                    <span className="text-sm font-medium">
                      +€{extra.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notizen */}
          <div className="space-y-2">
            <Label htmlFor="notes">{t('item.specialRequests') || 'Besondere Wünsche'}</Label>
            <Textarea
              id="notes"
              placeholder="z.B. ohne Zwiebeln, extra scharf..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Menge */}
          <div className="flex items-center justify-between">
            <Label>{t('item.quantity') || 'Menge'}</Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            size="lg"
            onClick={handleAddToCart}
            style={{ backgroundColor: primaryColor || '#3b82f6' }}
          >
            {t('menuItem.addToCart') || 'Zum Warenkorb hinzufügen'} • €{calculatePrice().toFixed(2)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}