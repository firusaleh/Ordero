"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  ShoppingCart,
  MenuSquare,
  QrCode,
  Settings,
  CreditCard,
  Users,
  BarChart,
  LogOut,
  Rocket
} from 'lucide-react'
import { handleSignOut } from '@/app/actions/auth'
import { useLanguage } from '@/contexts/language-context'

export default function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const navigation = [
    { name: t('nav.dashboard'), href: '/dashboard', icon: Home },
    { name: 'Einrichtung', href: '/dashboard/setup', icon: Rocket },
    { name: t('nav.orders'), href: '/dashboard/orders', icon: ShoppingCart },
    { name: t('nav.menu'), href: '/dashboard/menu', icon: MenuSquare },
    { name: t('nav.tables'), href: '/dashboard/tables', icon: QrCode },
    { name: t('nav.statistics'), href: '/dashboard/stats', icon: BarChart },
    { name: t('nav.staff'), href: '/dashboard/staff', icon: Users },
    { name: t('nav.billing'), href: '/dashboard/billing', icon: CreditCard },
    { name: t('nav.settings'), href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <img src="/oriido-logo.png" alt="Oriido" className="h-14 w-auto" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          pathname === item.href
                            ? 'bg-gray-50 text-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                        )}
                      >
                        <Icon
                          className={cn(
                            pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600',
                            'h-5 w-5 shrink-0 transition-colors'
                          )}
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600 w-full transition-colors"
                >
                  <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-600 transition-colors" />
                  {t('common.logout')}
                </button>
              </form>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}