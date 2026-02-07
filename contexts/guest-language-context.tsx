'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { guestTranslations, GuestLanguage } from '@/lib/i18n/guest-translations'

interface GuestLanguageContextType {
  language: GuestLanguage
  setLanguage: (lang: GuestLanguage) => void
  t: (path: string) => string
}

const GuestLanguageContext = createContext<GuestLanguageContextType | undefined>(undefined)

interface GuestLanguageProviderProps {
  children: ReactNode
  initialLanguage?: GuestLanguage
}

export function GuestLanguageProvider({ children, initialLanguage }: GuestLanguageProviderProps) {
  const [language, setLanguageState] = useState<GuestLanguage>(initialLanguage || 'de')

  useEffect(() => {
    // If initial language is provided (e.g., for country-specific restaurants), use it
    if (initialLanguage) {
      setLanguageState(initialLanguage)
      
      // Save to localStorage with restaurant-specific key to avoid conflicts
      const currentPath = window.location.pathname
      const restaurantSlug = currentPath.split('/')[1] // Get restaurant slug from URL
      if (restaurantSlug) {
        localStorage.setItem(`guestLanguage_${restaurantSlug}`, initialLanguage)
      }
      
      if (initialLanguage === 'ar') {
        document.documentElement.dir = 'rtl'
        document.documentElement.lang = 'ar'
      } else {
        document.documentElement.dir = 'ltr'
        document.documentElement.lang = initialLanguage
      }
    } else {
      // Load saved language from localStorage
      const currentPath = window.location.pathname
      const restaurantSlug = currentPath.split('/')[1]
      const savedLang = localStorage.getItem(`guestLanguage_${restaurantSlug}`) as GuestLanguage || 
                       localStorage.getItem('guestLanguage') as GuestLanguage
      
      if (savedLang && guestTranslations[savedLang]) {
        setLanguageState(savedLang)
        
        // Set RTL direction for Arabic
        if (savedLang === 'ar') {
          document.documentElement.dir = 'rtl'
          document.documentElement.lang = 'ar'
        } else {
          document.documentElement.dir = 'ltr'
          document.documentElement.lang = savedLang
        }
      } else {
        // Check browser language as fallback
        const browserLang = navigator.language.toLowerCase()
        if (browserLang.startsWith('en')) {
          setLanguageState('en')
        } else if (browserLang.startsWith('ar')) {
          setLanguageState('ar')
          document.documentElement.dir = 'rtl'
          document.documentElement.lang = 'ar'
        }
      }
    }
  }, [initialLanguage])

  const setLanguage = (lang: GuestLanguage) => {
    setLanguageState(lang)
    
    // Save with restaurant-specific key
    const currentPath = window.location.pathname
    const restaurantSlug = currentPath.split('/')[1]
    if (restaurantSlug) {
      localStorage.setItem(`guestLanguage_${restaurantSlug}`, lang)
    }
    localStorage.setItem('guestLanguage', lang) // Also save globally as fallback
    
    // Set RTL direction for Arabic
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = lang
    }
  }

  const t = (path: string): string => {
    const keys = path.split('.')
    let value: any = guestTranslations[language]
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        // Fallback to German if translation not found
        value = guestTranslations.de
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k]
          } else {
            return path // Return the path if translation not found
          }
        }
        break
      }
    }
    
    return typeof value === 'string' ? value : path
  }

  return (
    <GuestLanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </GuestLanguageContext.Provider>
  )
}

export function useGuestLanguage() {
  const context = useContext(GuestLanguageContext)
  if (!context) {
    throw new Error('useGuestLanguage must be used within a GuestLanguageProvider')
  }
  return context
}