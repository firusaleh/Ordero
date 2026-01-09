import * as React from "react"
import { toast as sonnerToast } from "sonner"

interface ToastProps {
  title?: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

export function useToast() {
  const toast = React.useCallback(
    ({ title, description, variant = "default", duration = 5000 }: ToastProps) => {
      if (variant === "destructive") {
        sonnerToast.error(title || "Fehler", {
          description,
          duration,
        })
      } else {
        sonnerToast.success(title || "Erfolg", {
          description,
          duration,
        })
      }
    },
    []
  )

  return { toast }
}