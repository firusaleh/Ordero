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
  const [audioReady, setAudioReady] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Erstelle Audio-Element
    if (typeof window !== 'undefined') {
      const audio = new Audio()
      
      // Set up event listeners
      audio.addEventListener('canplaythrough', () => {
        setAudioReady(true)
      })
      
      audio.addEventListener('error', (e) => {
        console.error('Audio loading error:', e)
        setAudioReady(false)
        
        // Fallback zu Web Audio API Ton
        if (!audioRef.current) {
          createFallbackSound()
        }
      })
      
      // Setze Audio-Eigenschaften
      audio.volume = currentVolume
      audio.preload = 'auto'
      
      // Versuche verschiedene Formate
      audio.src = soundUrl
      
      audioRef.current = audio
      
      // Versuche Audio zu laden
      audio.load()
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeEventListener('canplaythrough', () => {})
        audioRef.current.removeEventListener('error', () => {})
        audioRef.current = null
      }
    }
  }, [soundUrl, currentVolume])
  
  // Fallback mit Web Audio API
  const createFallbackSound = () => {
    if (typeof window === 'undefined') return
    
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      const context = new AudioContext()
      
      // Erstelle einen einfachen Beep-Ton als Fallback
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      oscillator.frequency.value = 800 // Hz
      oscillator.type = 'sine'
      
      gainNode.gain.setValueAtTime(currentVolume, context.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5)
      
      // Speichere als Fallback-Funktion
      const playBeep = () => {
        const osc = context.createOscillator()
        const gain = context.createGain()
        
        osc.connect(gain)
        gain.connect(context.destination)
        
        osc.frequency.value = 800
        osc.type = 'sine'
        
        gain.gain.setValueAtTime(currentVolume * 0.3, context.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3)
        
        osc.start(context.currentTime)
        osc.stop(context.currentTime + 0.3)
      }
      
      // Erstelle ein Pseudo-Audio-Element für den Fallback
      audioRef.current = {
        play: () => {
          playBeep()
          return Promise.resolve()
        },
        pause: () => {},
        load: () => {},
        volume: currentVolume,
        currentTime: 0
      } as HTMLAudioElement
      
      setAudioReady(true)
    } catch (error) {
      console.error('Fallback sound creation failed:', error)
    }
  }

  const playSound = async () => {
    if (!isEnabled || !audioRef.current) return

    try {
      // Reset audio to beginning
      audioRef.current.currentTime = 0
      
      // Play sound
      await audioRef.current.play()
    } catch (error) {
      console.error('Error playing notification sound:', error)
      
      // Versuche Fallback-Sound bei Fehler
      if (error instanceof Error) {
        if (error.name === 'NotSupportedError' || error.name === 'NotAllowedError') {
          // Versuche Fallback-Ton zu erstellen und abzuspielen
          createFallbackSound()
          
          if (audioRef.current) {
            try {
              await audioRef.current.play()
            } catch (fallbackError) {
              console.error('Fallback sound also failed:', fallbackError)
              
              if (error.name === 'NotAllowedError') {
                toast({
                  title: 'Sound-Berechtigung erforderlich',
                  description: 'Bitte klicken Sie irgendwo auf die Seite, um Sound-Benachrichtigungen zu aktivieren',
                  variant: 'default'
                })
              }
            }
          }
        }
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
  const testSound = async () => {
    const wasEnabled = isEnabled
    setIsEnabled(true)
    
    try {
      // Wenn Audio nicht bereit ist, versuche Fallback
      if (!audioReady && !audioRef.current) {
        createFallbackSound()
      }
      
      await playSound()
    } catch (error) {
      console.error('Test sound failed:', error)
      // Versuche Fallback
      createFallbackSound()
      if (audioRef.current) {
        try {
          await audioRef.current.play()
        } catch (e) {
          console.error('Fallback test sound also failed:', e)
        }
      }
    }
    
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