"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Store,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Shield
} from 'lucide-react'
import { signOut } from 'next-auth/react'

const navigation = [
  { name: 'Übersicht', href: '/admin', icon: Home },
  { name: 'Restaurants', href: '/admin/restaurants', icon: Store },
  { name: 'Rechnungen', href: '/admin/invoices', icon: FileText },
  { name: 'Statistiken', href: '/admin/stats', icon: BarChart3 },
  { name: 'Einstellungen', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-800 bg-gray-950 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <Link href="/admin" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Oriido Admin</span>
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
                            ? 'bg-gray-800 text-red-500'
                            : 'text-gray-300 hover:text-white hover:bg-gray-800',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                        )}
                      >
                        <Icon
                          className={cn(
                            pathname === item.href ? 'text-red-500' : 'text-gray-500 group-hover:text-white',
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
              <Link
                href="/dashboard"
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors mb-2"
              >
                <Home className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-white transition-colors" />
                Zum Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-medium leading-6 text-gray-300 hover:bg-gray-800 hover:text-red-500 w-full transition-colors"
              >
                <LogOut className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-red-500 transition-colors" />
                Abmelden
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}