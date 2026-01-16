'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield, Key, Lock, UserCheck, AlertTriangle, Loader2 } from 'lucide-react'
import { showErrorToast, showSuccessToast, parseApiResponse } from '@/lib/error-handling'

export default function SecuritySettingsClient() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [passwordExpiry, setPasswordExpiry] = useState('90')
  const [loginAttempts, setLoginAttempts] = useState('5')
  const [ipRestriction, setIpRestriction] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)

  const handlePasswordChange = async () => {
    setSaving('password')
    try {
      // Simuliere API-Call für Demo
      // In Produktion: const response = await fetch('/api/settings/security/password', {...})
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simuliere zufälligen Fehler für Demo (20% Chance)
          if (Math.random() < 0.2) {
            reject(new Error('Passwort-Richtlinien konnten nicht aktualisiert werden. Bitte versuchen Sie es erneut.'))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast('Passwort-Einstellungen aktualisiert')
    } catch (error) {
      showErrorToast(error, 'Passwort-Richtlinien konnten nicht gespeichert werden')
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async () => {
    setSaving('session')
    try {
      // Validierung
      const timeout = parseInt(sessionTimeout)
      if (isNaN(timeout) || timeout < 5 || timeout > 1440) {
        throw new Error('Sitzungs-Timeout muss zwischen 5 und 1440 Minuten liegen')
      }

      // Simuliere API-Call für Demo
      // In Produktion: const response = await fetch('/api/settings/security/session', {...})
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Simuliere zufälligen Fehler für Demo (20% Chance)
          if (Math.random() < 0.2) {
            reject(new Error('Verbindung zum Server fehlgeschlagen'))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast('Sicherheitseinstellungen gespeichert')
    } catch (error) {
      showErrorToast(error, 'Sitzungseinstellungen konnten nicht gespeichert werden')
    } finally {
      setSaving(null)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    setTwoFactor(enabled)
    
    if (enabled) {
      setSaving('2fa')
      try {
        // In Produktion: API-Call zum Aktivieren von 2FA
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            if (Math.random() < 0.2) {
              reject(new Error('2FA-Aktivierung fehlgeschlagen. Der QR-Code konnte nicht generiert werden.'))
            } else {
              resolve(true)
            }
          }, 1000)
        })
        
        showSuccessToast('Zwei-Faktor-Authentifizierung aktiviert')
      } catch (error) {
        setTwoFactor(false) // Zurücksetzen bei Fehler
        showErrorToast(error, '2FA konnte nicht aktiviert werden')
      } finally {
        setSaving(null)
      }
    } else {
      showSuccessToast('Zwei-Faktor-Authentifizierung deaktiviert')
    }
  }

  const handleAccessControl = async () => {
    setSaving('access')
    try {
      // Validierung
      const attempts = parseInt(loginAttempts)
      if (isNaN(attempts) || attempts < 1 || attempts > 10) {
        throw new Error('Anmeldeversuche müssen zwischen 1 und 10 liegen')
      }

      // Simuliere API-Call
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.2) {
            reject(new Error('Zugriffskontrolle konnte nicht aktualisiert werden'))
          } else {
            resolve(true)
          }
        }, 1000)
      })
      
      showSuccessToast('Zugriffskontrolle aktualisiert')
    } catch (error) {
      showErrorToast(error, 'Zugriffseinstellungen konnten nicht gespeichert werden')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sicherheit</h1>
        <p className="text-gray-600">Verwalten Sie Sicherheitseinstellungen und Zugriffsrechte</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Passwort-Richtlinien
            </CardTitle>
            <CardDescription>
              Konfigurieren Sie Anforderungen für sichere Passwörter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="passwordExpiry">Passwort-Gültigkeit (Tage)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={passwordExpiry}
                onChange={(e) => setPasswordExpiry(e.target.value)}
                disabled={saving === 'password'}
              />
              <p className="text-sm text-gray-500 mt-1">
                Benutzer müssen ihr Passwort nach dieser Zeit ändern
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="strongPassword">Starke Passwörter erzwingen</Label>
              <Switch id="strongPassword" defaultChecked disabled={saving === 'password'} />
            </div>

            <Button 
              onClick={handlePasswordChange} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'password' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Passwort-Richtlinien speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Zwei-Faktor-Authentifizierung
            </CardTitle>
            <CardDescription>
              Erhöhen Sie die Sicherheit mit 2FA
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="2fa">2FA aktivieren</Label>
              <Switch
                id="2fa"
                checked={twoFactor}
                onCheckedChange={handle2FAToggle}
                disabled={saving === '2fa'}
              />
            </div>

            {twoFactor && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Scannen Sie den QR-Code mit Ihrer Authenticator-App
                </p>
                <div className="mt-4 bg-white p-4 rounded flex items-center justify-center">
                  <div className="text-gray-400">QR-Code Placeholder</div>
                </div>
              </div>
            )}

            <Button disabled={!twoFactor || saving === '2fa'} className="w-full">
              {saving === '2fa' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              2FA einrichten
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Sitzungsverwaltung
            </CardTitle>
            <CardDescription>
              Kontrollieren Sie Benutzer-Sitzungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sessionTimeout">Sitzungs-Timeout (Minuten)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                disabled={saving === 'session'}
                min="5"
                max="1440"
              />
              <p className="text-sm text-gray-500 mt-1">
                Automatische Abmeldung nach Inaktivität
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="singleSession">Nur eine Sitzung erlauben</Label>
              <Switch id="singleSession" disabled={saving === 'session'} />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'session' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sitzungseinstellungen speichern
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Zugriffskontrolle
            </CardTitle>
            <CardDescription>
              Verwalten Sie Anmeldeversuche und IP-Beschränkungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="loginAttempts">Max. Anmeldeversuche</Label>
              <Input
                id="loginAttempts"
                type="number"
                value={loginAttempts}
                onChange={(e) => setLoginAttempts(e.target.value)}
                disabled={saving === 'access'}
                min="1"
                max="10"
              />
              <p className="text-sm text-gray-500 mt-1">
                Konto wird nach dieser Anzahl fehlgeschlagener Versuche gesperrt
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="ipRestriction">IP-Beschränkung aktivieren</Label>
              <Switch
                id="ipRestriction"
                checked={ipRestriction}
                onCheckedChange={setIpRestriction}
                disabled={saving === 'access'}
              />
            </div>

            {ipRestriction && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-yellow-800 font-medium">
                      IP-Beschränkung aktiv
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Zugriff nur von freigegebenen IP-Adressen möglich
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleAccessControl} 
              className="w-full"
              disabled={saving !== null}
            >
              {saving === 'access' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zugriffseinstellungen speichern
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}