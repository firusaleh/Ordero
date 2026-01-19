'use client'

import { useGuestLanguage } from '@/contexts/guest-language-context'

interface TableNotFoundProps {
  tableNumber: number
  restaurantSlug: string
}

export default function TableNotFound({ tableNumber, restaurantSlug }: TableNotFoundProps) {
  const { t } = useGuestLanguage()
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t('guest.tableNotFound.title')}</h1>
          <p className="text-gray-600 mb-6">
            {t('guest.tableNotFound.description').replace('{{number}}', tableNumber.toString())}
          </p>
          <a 
            href={`/r/${restaurantSlug}`}
            className="text-blue-600 hover:underline"
          >
            {t('guest.tableNotFound.backToRestaurant')}
          </a>
        </div>
      </div>
    </div>
  )
}