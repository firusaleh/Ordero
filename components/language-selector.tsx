'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface LanguageSelectorProps {
  onLanguageChange: (lang: 'de' | 'en' | 'ar') => void
  currentLang?: 'de' | 'en' | 'ar'
}

export default function LanguageSelector({ onLanguageChange, currentLang = 'de' }: LanguageSelectorProps) {
  const [language, setLanguage] = useState<'de' | 'en' | 'ar'>(currentLang)

  useEffect(() => {
    // Check localStorage for saved language preference
    const savedLang = localStorage.getItem('preferredLanguage') as 'de' | 'en' | 'ar'
    if (savedLang && ['de', 'en', 'ar'].includes(savedLang)) {
      setLanguage(savedLang)
      onLanguageChange(savedLang)
    }
  }, [])

  const handleLanguageChange = (value: string) => {
    const lang = value as 'de' | 'en' | 'ar'
    setLanguage(lang)
    localStorage.setItem('preferredLanguage', lang)
    onLanguageChange(lang)
    
    // Update document direction for Arabic
    if (lang === 'ar') {
      document.documentElement.dir = 'rtl'
      document.documentElement.lang = 'ar'
    } else {
      document.documentElement.dir = 'ltr'
      document.documentElement.lang = lang
    }
  }

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <Globe className="w-4 h-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="de">
          <span className="flex items-center">
            <span className="mr-2">🇩🇪</span>
            Deutsch
          </span>
        </SelectItem>
        <SelectItem value="en">
          <span className="flex items-center">
            <span className="mr-2">🇬🇧</span>
            English
          </span>
        </SelectItem>
        <SelectItem value="ar">
          <span className="flex items-center">
            <span className="mr-2">🇸🇦</span>
            العربية
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}