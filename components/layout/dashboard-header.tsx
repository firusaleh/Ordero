"use client"

import { useState } from 'react'
import { Menu, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import MobileNav from './mobile-nav'
import { useLanguage } from '@/contexts/language-context'
import NotificationsDropdown from './notifications-dropdown'
import { handleSignOut } from '@/app/actions/auth'
import RestaurantSwitcher from './restaurant-switcher'

interface DashboardHeaderProps {
  currentRestaurantId?: string
}

export default function DashboardHeader({ currentRestaurantId }: DashboardHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileMenuOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">{t('dashboard.title')}</h1>
          <RestaurantSwitcher currentRestaurantId={currentRestaurantId} />
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mein Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
                {t('common.profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                {t('nav.settingsLabel')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true)
                  await handleSignOut()
                }}
              >
                {isSigningOut ? 'Abmelden...' : t('common.logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <MobileNav onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}