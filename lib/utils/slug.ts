/**
 * Slug-Generierung Utilities
 */

/**
 * Generiert einen URL-freundlichen Slug aus einem Text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Deutsche Umlaute ersetzen
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    // Sonderzeichen entfernen
    .replace(/[^\w\s-]/g, '')
    // Leerzeichen durch Bindestriche ersetzen
    .replace(/\s+/g, '-')
    // Mehrfache Bindestriche entfernen
    .replace(/-+/g, '-')
    // Bindestriche am Anfang/Ende entfernen
    .replace(/^-+|-+$/g, '')
}

/**
 * Generiert einen einzigartigen Slug durch Anhängen einer Zufallszahl
 */
export function generateUniqueSlug(baseSlug: string): string {
  const randomSuffix = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `${baseSlug}-${randomSuffix}`
}

/**
 * Validiert einen Slug (nur Kleinbuchstaben, Zahlen und Bindestriche)
 */
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
}

/**
 * Generiert Slug-Vorschläge basierend auf dem Restaurant-Namen
 */
export function generateSlugSuggestions(restaurantName: string, count: number = 3): string[] {
  const baseSlug = generateSlug(restaurantName)
  const suggestions: string[] = []
  
  // Basis-Slug
  if (baseSlug) {
    suggestions.push(baseSlug)
  }
  
  // Varianten mit Stadt/Zusätzen
  const variants = [
    `${baseSlug}-restaurant`,
    `${baseSlug}-online`,
    `${baseSlug}-bestellen`,
  ]
  
  // Füge Varianten hinzu bis count erreicht ist
  for (const variant of variants) {
    if (suggestions.length < count && variant !== baseSlug) {
      suggestions.push(variant)
    }
  }
  
  // Falls immer noch nicht genug, füge numerische Suffixe hinzu
  let suffix = 1
  while (suggestions.length < count) {
    suggestions.push(`${baseSlug}-${suffix}`)
    suffix++
  }
  
  return suggestions.slice(0, count)
}

/**
 * Bereinigt einen Slug für die Anzeige
 */
export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) // Maximal 50 Zeichen
}