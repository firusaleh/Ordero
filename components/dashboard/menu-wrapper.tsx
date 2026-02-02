'use client'

import { useState } from 'react'
import MenuManager from './menu-manager'
import { useLanguage } from '@/contexts/language-context'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface POSSettings {
  posSystem: string | null
  lastSync: Date | null
}

interface MenuWrapperProps {
  restaurantId: string
  initialCategories: any[]
  posSettings?: POSSettings | null
}

export default function MenuWrapper({ restaurantId, initialCategories, posSettings }: MenuWrapperProps) {
  const { t } = useLanguage()
  const [isSyncing, setIsSyncing] = useState(false)

  const syncMenu = async () => {
    setIsSyncing(true)

    try {
      const response = await fetch('/api/pos/sync-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success(data.message || 'Menü synchronisiert')
        // Reload page to show updated menu
        window.location.reload()
      } else {
        toast.error(data.error || 'Synchronisation fehlgeschlagen')
      }
    } catch (error) {
      toast.error('Fehler bei der Menü-Synchronisation')
    } finally {
      setIsSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('menu.title')}</h1>
          <p className="text-gray-600">{t('menu.subtitle')}</p>
        </div>

        {posSettings && (
          <Button
            onClick={syncMenu}
            disabled={isSyncing}
            variant="outline"
            size="sm"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Synchronisiere...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                POS Sync
              </>
            )}
          </Button>
        )}
      </div>

      <MenuManager
        restaurantId={restaurantId}
        initialCategories={initialCategories}
      />
    </div>
  )
}