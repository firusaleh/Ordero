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
  LogOut
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Übersicht', href: '/dashboard', icon: Home },
  { name: 'Bestellungen', href: '/dashboard/orders', icon: ShoppingCart },
  { name: 'Speisekarte', href: '/dashboard/menu', icon: MenuSquare },
  { name: 'Tische & QR', href: '/dashboard/tables', icon: QrCode },
  { name: 'Statistiken', href: '/dashboard/stats', icon: BarChart },
  { name: 'Mitarbeiter', href: '/dashboard/staff', icon: Users },
  { name: 'Abrechnung', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Einstellungen', href: '/dashboard/settings', icon: Settings },
]

interface MobileNavProps {
  onClose: () => void
}

export default function MobileNav({ onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <Link href="/dashboard" className="flex items-center space-x-2" onClick={onClose}>
          <img src="/oriido-logo.png" alt="Oriido" className="h-12 w-auto" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col p-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  onClick={onClose}
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
          <li className="mt-auto">
            <button
              onClick={() => {
                signOut({ callbackUrl: '/login' })
                onClose()
              }}
              className="group flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-700 hover:bg-gray-50 hover:text-red-600 w-full transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0 text-gray-400 group-hover:text-red-600 transition-colors" />
              Abmelden
            </button>
          </li>
        </ul>
      </nav>
    </div>
  )
}