'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useGuestLanguage } from '@/contexts/guest-language-context'
import { GuestLanguage } from '@/lib/i18n/guest-translations'

const languages = [
  { code: 'de' as GuestLanguage, name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en' as GuestLanguage, name: 'English', flag: '🇬🇧' },
  { code: 'ar' as GuestLanguage, name: 'العربية', flag: '🇸🇦' },
]

export default function LanguageSelector() {
  const { language, setLanguage } = useGuestLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentLang = languages.find(l => l.code === language)

  // Zeige nur Button während SSR/Hydration
  if (!mounted) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        disabled
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.name}</span>
        <span className="sm:hidden">{currentLang?.flag}</span>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLang?.flag} {currentLang?.name}</span>
          <span className="sm:hidden">{currentLang?.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={language === lang.code ? 'bg-gray-100' : ''}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}