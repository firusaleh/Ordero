export function getLocalizedTableName(tableNumber: number, language: 'de' | 'en' | 'ar' = 'de'): string {
  const prefixes = {
    de: 'Tisch',
    en: 'Table',
    ar: 'طاولة'
  }
  
  return `${prefixes[language]} ${tableNumber}`
}

export function getLocalizedTablePrefix(language: 'de' | 'en' | 'ar' = 'de'): string {
  const prefixes = {
    de: 'Tisch',
    en: 'Table',
    ar: 'طاولة'
  }
  
  return prefixes[language]
}