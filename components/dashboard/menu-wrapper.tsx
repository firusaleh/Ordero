'use client'

import MenuManager from './menu-manager'
import { useLanguage } from '@/contexts/language-context'

interface MenuWrapperProps {
  restaurantId: string
  initialCategories: any[]
}

export default function MenuWrapper({ restaurantId, initialCategories }: MenuWrapperProps) {
  const { t } = useLanguage()
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('menu.title')}</h1>
        <p className="text-gray-600">{t('menu.subtitle')}</p>
      </div>
      
      <MenuManager 
        restaurantId={restaurantId} 
        initialCategories={initialCategories}
      />
    </div>
  )
}