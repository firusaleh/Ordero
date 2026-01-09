"use client"

import { Bell, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-800 bg-gray-900 px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <h1 className="text-lg font-semibold text-white">Super Admin Panel</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <Button variant="ghost" size="icon" className="relative text-gray-400 hover:text-white">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
          </Button>
        </div>
      </div>
    </header>
  )
}