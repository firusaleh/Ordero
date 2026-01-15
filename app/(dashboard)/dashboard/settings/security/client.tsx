'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { Shield, Key, Lock, UserCheck, AlertTriangle } from 'lucide-react'

export default function SecuritySettingsClient() {
  const [twoFactor, setTwoFactor] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState('30')
  const [passwordExpiry, setPasswordExpiry] = useState('90')
  const [loginAttempts, setLoginAttempts] = useState('5')
  const [ipRestriction, setIpRestriction] = useState(false)

  const handlePasswordChange = () => {
    toast.success('Passwort-Einstellungen aktualisiert')
  }

  const handleSave = () => {
    toast.success('Sicherheitseinstellungen gespeichert')
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
              />
              <p className="text-sm text-gray-500 mt-1">
                Benutzer müssen ihr Passwort nach dieser Zeit ändern
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="strongPassword">Starke Passwörter erzwingen</Label>
              <Switch id="strongPassword" defaultChecked />
            </div>

            <Button onClick={handlePasswordChange} className="w-full">
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
                onCheckedChange={setTwoFactor}
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

            <Button disabled={!twoFactor} className="w-full">
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
              />
              <p className="text-sm text-gray-500 mt-1">
                Automatische Abmeldung nach Inaktivität
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="singleSession">Nur eine Sitzung erlauben</Label>
              <Switch id="singleSession" />
            </div>

            <Button onClick={handleSave} className="w-full">
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
              />
            </div>

            {ipRestriction && (
              <div>
                <Label htmlFor="allowedIps">Erlaubte IP-Adressen</Label>
                <textarea
                  id="allowedIps"
                  className="w-full px-3 py-2 border rounded-md"
                  rows={3}
                  placeholder="Eine IP-Adresse pro Zeile"
                />
              </div>
            )}

            <Button onClick={handleSave} className="w-full">
              Zugriffskontrolle speichern
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            Sicherheitshinweis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-700">
            Aktivieren Sie Zwei-Faktor-Authentifizierung für zusätzliche Sicherheit. 
            Regelmäßige Passwortänderungen und starke Passwortrichtlinien schützen vor unbefugtem Zugriff.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}