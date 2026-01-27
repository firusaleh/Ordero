"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Clock, Home } from 'lucide-react'
import Confetti from 'react-confetti'
import { useGuestLanguage } from '@/contexts/guest-language-context'

interface OrderConfirmationProps {
  orderNumber: number
  restaurantName: string
  onNewOrder: () => void
}

export default function OrderConfirmation({
  orderNumber,
  restaurantName,
  onNewOrder
}: OrderConfirmationProps) {
  const { t } = useGuestLanguage()
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0
  })

  useEffect(() => {
    const updateDimensions = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Confetti
        width={windowDimensions.width}
        height={windowDimensions.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.1}
      />
      
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">{t('order.successTitle') || 'Bestellung erfolgreich!'}</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              {t('order.thankYou') || 'Vielen Dank für Ihre Bestellung bei'} {restaurantName}
            </p>
            
            <div className="bg-gray-100 rounded-lg p-6">
              <p className="text-sm text-gray-500 mb-2">{t('order.orderNumber') || 'Ihre Bestellnummer'}</p>
              <p className="text-3xl font-bold">{orderNumber}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Clock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">{t('orderStatus.preparing') || 'Bestellung wird vorbereitet'}</p>
                <p className="text-xs">{t('orderStatus.notification') || 'Sie werden benachrichtigt, wenn Ihre Bestellung fertig ist'}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t">
            <Button 
              className="w-full" 
              onClick={onNewOrder}
            >
              {t('order.newOrder') || 'Neue Bestellung aufgeben'}
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = '/'}
            >
              <Home className="mr-2 h-4 w-4" />
              {t('common.home') || 'Zur Startseite'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}