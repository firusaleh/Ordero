'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface OrderSuccessDialogProps {
  open: boolean
  onClose: () => void
  orderNumber: string
  estimatedTime?: string
  primaryColor?: string
}

export default function OrderSuccessDialog({
  open,
  onClose,
  orderNumber,
  estimatedTime = '15-20 Minuten',
  primaryColor = '#2EC4B6'
}: OrderSuccessDialogProps) {
  const { t } = useGuestLanguage()
  useEffect(() => {
    if (open) {
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        onClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [open, onClose])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md p-0 overflow-hidden border-0"
        style={{
          background: `linear-gradient(180deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`
        }}
      >
        <div className="relative flex flex-col items-center justify-center p-8 text-center text-white">
          {/* Confetti Animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-sm animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#FF6B35', '#F7C59F', '#fff', '#FFD700', '#FF69B4'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Success Icon */}
          <div className="relative mb-6">
            <div className="w-28 h-28 bg-white/20 rounded-full flex items-center justify-center animate-success-pop">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Check className="w-10 h-10" style={{ color: primaryColor }} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Title & Subtitle */}
          <h2 className="text-2xl font-bold mb-2">{t('order.successTitle') || 'Bestellung erfolgreich!'}</h2>
          <p className="text-white/90 mb-8">{t('orderStatus.readyNotification') || 'Ihre Bestellung wird gerade zubereitet'}</p>

          {/* Order Card */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 w-full max-w-xs">
            <div className="text-xs uppercase tracking-wider text-white/70 mb-2">
              {t('order.orderNumber') || 'Bestellnummer'}
            </div>
            <div className="text-3xl font-bold tracking-wider mb-4">
              {orderNumber}
            </div>
            <div className="pt-4 border-t border-white/20">
              <div className="text-xs text-white/60 mb-1">{t('order.estimatedTime') || 'Geschätzte Zeit'}</div>
              <div className="text-lg font-semibold">{estimatedTime}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}