'use client'

import { useEffect, useRef, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface NotificationSoundOptions {
  enabled?: boolean
  volume?: number
}

export function useNotificationSound(options: NotificationSoundOptions = {}) {
  const { enabled = true, volume = 0.5 } = options
  const audioContextRef = useRef<AudioContext | null>(null)
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const { toast } = useToast()

  useEffect(() => {
    // Erstelle AudioContext nur einmal
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass()
        }
      } catch (error) {
        console.error('Failed to create AudioContext:', error)
      }
    }

    // Cleanup
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close()
        } catch (e) {
          console.error('Error closing AudioContext:', e)
        }
        audioContextRef.current = null
      }
    }
  }, [])

  const playSound = async () => {
    if (!isEnabled || !audioContextRef.current) {
      console.log('Sound disabled or no AudioContext')
      return
    }

    try {
      const context = audioContextRef.current
      
      // Resume context if suspended (for Chrome autoplay policy)
      if (context.state === 'suspended') {
        await context.resume()
      }

      const currentTime = context.currentTime
      
      // Create oscillator for beep sound
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()
      
      // Configure the sound
      oscillator.connect(gainNode)
      gainNode.connect(context.destination)
      
      // Set frequency for a pleasant notification sound
      oscillator.frequency.setValueAtTime(800, currentTime)
      oscillator.frequency.exponentialRampToValueAtTime(600, currentTime + 0.1)
      
      // Set volume envelope
      gainNode.gain.setValueAtTime(0, currentTime)
      gainNode.gain.linearRampToValueAtTime(currentVolume * 0.3, currentTime + 0.01)
      gainNode.gain.linearRampToValueAtTime(currentVolume * 0.3, currentTime + 0.1)
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3)
      
      // Play the sound
      oscillator.start(currentTime)
      oscillator.stop(currentTime + 0.3)
      
    } catch (error) {
      console.error('Error playing notification sound:', error)
      
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
        const vol = Number(savedVolume)
        if (!isNaN(vol)) {
          setCurrentVolume(vol)
        }
      }
    }
  }, [])

  // Test-Sound abspielen
  const testSound = async () => {
    const wasEnabled = isEnabled
    setIsEnabled(true)
    
    // Ensure AudioContext is created and resumed for test
    if (!audioContextRef.current) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          audioContextRef.current = new AudioContextClass()
        }
      } catch (error) {
        console.error('Failed to create AudioContext for test:', error)
        return
      }
    }
    
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume()
      } catch (e) {
        console.error('Failed to resume AudioContext:', e)
      }
    }
    
    await playSound()
    
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