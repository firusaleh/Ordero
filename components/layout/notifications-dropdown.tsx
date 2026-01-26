'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, X, ShoppingCart, AlertCircle, CheckCircle, Clock, Package, Calendar, PhoneCall } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLanguage } from '@/contexts/language-context'

interface Notification {
  id: string
  type: 'order' | 'payment' | 'alert' | 'info' | 'reservation' | 'preorder'
  title: string
  message: string
  timestamp: string
  read: boolean
  icon?: any
  restaurantName?: string
}

export default function NotificationsDropdown() {
  const { t, language } = useLanguage()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [mounted, setMounted] = useState(false)

  // Set mounted state
  useEffect(() => {
    setMounted(true)
  }, [])

  // Lade Benachrichtigungen aus der Datenbank
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        if (response.ok) {
          const data = await response.json()
          const formattedNotifications = data.notifications.map((n: any) => ({
            ...n,
            timestamp: new Date(n.timestamp),
            icon: getIconForType(n.type)
          }))
          setNotifications(formattedNotifications)
        }
      } catch (error) {
        console.error('Fehler beim Laden der Benachrichtigungen:', error)
      }
    }

    fetchNotifications()
    // Aktualisiere alle 30 Sekunden
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [language])

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getIconForType = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart
      case 'payment': return CheckCircle
      case 'alert': return AlertCircle
      case 'info': return Clock
      case 'reservation': return Calendar
      case 'preorder': return PhoneCall
      default: return Bell
    }
  }

  const getTimeAgo = (date: Date | string) => {
    const timestamp = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (language === 'de') {
      if (days > 0) return `vor ${days} Tag${days > 1 ? 'en' : ''}`
      if (hours > 0) return `vor ${hours} Stunde${hours > 1 ? 'n' : ''}`
      if (minutes > 0) return `vor ${minutes} Minute${minutes > 1 ? 'n' : ''}`
      return 'Gerade eben'
    } else if (language === 'en') {
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
      if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
      return 'Just now'
    } else {
      if (days > 0) return `منذ ${days} ${days > 1 ? 'أيام' : 'يوم'}`
      if (hours > 0) return `منذ ${hours} ${hours > 1 ? 'ساعات' : 'ساعة'}`
      if (minutes > 0) return `منذ ${minutes} ${minutes > 1 ? 'دقائق' : 'دقيقة'}`
      return 'الآن'
    }
  }

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'order': return 'text-blue-600 bg-blue-100'
      case 'payment': return 'text-green-600 bg-green-100'
      case 'alert': return 'text-orange-600 bg-orange-100'
      case 'info': return 'text-gray-600 bg-gray-100'
      case 'reservation': return 'text-purple-600 bg-purple-100'
      case 'preorder': return 'text-indigo-600 bg-indigo-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Bell className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          <span>
            {language === 'de' ? 'Benachrichtigungen' : 
             language === 'en' ? 'Notifications' : 
             'الإشعارات'}
          </span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} {language === 'de' ? 'neu' : language === 'en' ? 'new' : 'جديد'}
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {language === 'de' ? 'Keine Benachrichtigungen' : 
                 language === 'en' ? 'No notifications' : 
                 'لا توجد إشعارات'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {notifications.map((notification) => {
                const Icon = notification.icon || Bell
                return (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 -mr-2"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        {notification.restaurantName && (
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.restaurantName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {getTimeAgo(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={markAllAsRead}
                >
                  <Check className="h-3 w-3 mr-1" />
                  {language === 'de' ? 'Alle gelesen' : 
                   language === 'en' ? 'Mark all read' : 
                   'تحديد الكل كمقروء'}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={clearAll}
              >
                {language === 'de' ? 'Alle löschen' : 
                 language === 'en' ? 'Clear all' : 
                 'مسح الكل'}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}