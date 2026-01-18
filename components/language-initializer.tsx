'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

interface LanguageInitializerProps {
  restaurantLanguage?: string
}

export default function LanguageInitializer({ restaurantLanguage }: LanguageInitializerProps) {
  const { setLanguage } = useLanguage()
  
  useEffect(() => {
    // Lade Sprache beim Start
    const savedLang = localStorage.getItem('language')
    
    if (savedLang && ['de', 'en', 'ar'].includes(savedLang)) {
      // Verwende gespeicherte Sprache
      setLanguage(savedLang as 'de' | 'en' | 'ar')
    } else if (restaurantLanguage && ['de', 'en', 'ar'].includes(restaurantLanguage)) {
      // Verwende Restaurant-Sprache
      setLanguage(restaurantLanguage as 'de' | 'en' | 'ar')
      localStorage.setItem('language', restaurantLanguage)
    }
    
    // Lade sprachspezifische Formatierung
    const lang = savedLang || restaurantLanguage || 'de'
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = lang
    }
  }, [restaurantLanguage, setLanguage])
  
  return null
}