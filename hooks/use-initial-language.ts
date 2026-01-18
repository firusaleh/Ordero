'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/contexts/language-context'

export function useInitialLanguage(restaurantLanguage?: string) {
  const { setLanguage } = useLanguage()
  
  useEffect(() => {
    // Priorität: 1. localStorage, 2. Restaurant-Einstellung, 3. Browser-Sprache
    const savedLang = localStorage.getItem('language')
    
    if (savedLang && ['de', 'en', 'ar'].includes(savedLang)) {
      setLanguage(savedLang as 'de' | 'en' | 'ar')
    } else if (restaurantLanguage && ['de', 'en', 'ar'].includes(restaurantLanguage)) {
      setLanguage(restaurantLanguage as 'de' | 'en' | 'ar')
      localStorage.setItem('language', restaurantLanguage)
    } else {
      // Fallback auf Browser-Sprache
      const browserLang = navigator.language.split('-')[0]
      const supportedLang = ['de', 'en', 'ar'].includes(browserLang) ? browserLang : 'de'
      setLanguage(supportedLang as 'de' | 'en' | 'ar')
      localStorage.setItem('language', supportedLang)
    }
  }, [restaurantLanguage, setLanguage])
}