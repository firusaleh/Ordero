import { toast } from 'sonner'

/**
 * Zeigt eine konsistente Fehlermeldung an
 * @param error - Der Fehler (Error, string, oder unknown)
 * @param defaultMessage - Fallback-Nachricht falls kein spezifischer Fehler
 */
export function showErrorToast(error: unknown, defaultMessage = 'Ein Fehler ist aufgetreten') {
  let message = defaultMessage
  
  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === 'string') {
    message = error
  } else if (error && typeof error === 'object' && 'message' in error) {
    message = String(error.message)
  }
  
  // Zeige Fehlermeldung mit rotem Icon
  toast.error('Fehler beim Speichern', {
    description: message,
    duration: 5000, // 5 Sekunden sichtbar
  })
}

/**
 * Zeigt eine Erfolgsmeldung an
 * @param message - Die Erfolgsnachricht
 * @param description - Optionale Beschreibung
 */
export function showSuccessToast(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 3000,
  })
}

/**
 * Wrapper für API-Calls mit automatischer Fehlerbehandlung
 * @param apiCall - Die async Funktion die aufgerufen werden soll
 * @param successMessage - Nachricht bei Erfolg
 * @param errorMessage - Fallback-Nachricht bei Fehler
 */
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  successMessage: string,
  errorMessage = 'Die Aktion konnte nicht ausgeführt werden'
): Promise<T | null> {
  try {
    const result = await apiCall()
    showSuccessToast(successMessage)
    return result
  } catch (error) {
    showErrorToast(error, errorMessage)
    return null
  }
}

/**
 * Parse API Response und zeige Fehler falls vorhanden
 * @param response - Die Response vom Server
 */
export async function parseApiResponse(response: Response) {
  if (!response.ok) {
    let errorMessage = 'Ein unerwarteter Fehler ist aufgetreten'
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorData.message || errorMessage
    } catch {
      // Falls Response kein JSON ist
      errorMessage = `Serverfehler: ${response.status} ${response.statusText}`
    }
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}