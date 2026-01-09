'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface NotificationSoundOptions {
  enabled?: boolean
  volume?: number
  soundUrl?: string
}

const DEFAULT_SOUND_URL = '/sounds/notification.mp3'

export function useNotificationSound(options: NotificationSoundOptions = {}) {
  const { enabled = true, volume = 0.5, soundUrl = DEFAULT_SOUND_URL } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const { toast } = useToast()

  useEffect(() => {
    // Erstelle Audio-Element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio(soundUrl)
      audioRef.current.volume = currentVolume
      
      // Preload audio
      audioRef.current.load()
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [soundUrl, currentVolume])

  const playSound = async () => {
    if (!isEnabled || !audioRef.current) return

    try {
      // Reset audio to beginning
      audioRef.current.currentTime = 0
      
      // Play sound
      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing notification sound:', error)
      
      // Browser blockiert möglicherweise Autoplay
      // Zeige Hinweis an Benutzer
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast({
          title: 'Sound-Berechtigung erforderlich',
          description: 'Bitte klicken Sie irgendwo auf die Seite, um Sound-Benachrichtigungen zu aktivieren',
          variant: 'default'
        })
      }
    }
  }

  const toggleSound = () => {
    setIsEnabled(prev => !prev)
    
    // Speichere Einstellung im LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-sound-enabled', String(!isEnabled))
    }
  }

  const setVolume = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setCurrentVolume(clampedVolume)
    
    if (audioRef.current) {
      audioRef.current.volume = clampedVolume
    }
    
    // Speichere Einstellung im LocalStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-sound-volume', String(clampedVolume))
    }
  }

  // Lade gespeicherte Einstellungen
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedEnabled = localStorage.getItem('notification-sound-enabled')
      const savedVolume = localStorage.getItem('notification-sound-volume')
      
      if (savedEnabled !== null) {
        setIsEnabled(savedEnabled === 'true')
      }
      
      if (savedVolume !== null) {
        setCurrentVolume(Number(savedVolume))
      }
    }
  }, [])

  // Test-Sound abspielen
  const testSound = () => {
    const wasEnabled = isEnabled
    setIsEnabled(true)
    playSound()
    
    // Restore previous state after a short delay
    setTimeout(() => {
      setIsEnabled(wasEnabled)
    }, 100)
  }

  return {
    playSound,
    toggleSound,
    setVolume,
    testSound,
    isEnabled,
    volume: currentVolume
  }
}