// Import all language translations
import { guestTranslationsDe } from './guest-translations-de'
import { guestTranslationsEn } from './guest-translations-en'
import { guestTranslationsAr } from './guest-translations-ar'

// Export the language type
export type GuestLanguage = 'de' | 'en' | 'ar'

// Combine all translations into a single export
export const guestTranslations = {
  de: guestTranslationsDe,
  en: guestTranslationsEn,
  ar: guestTranslationsAr
}