'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { ArrowLeft, Shield, Key, Lock, UserCheck, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SecuritySettingsPage() {
  const router = useRouter()
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
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Sicherheit</h1>
          <p className="text-gray-600">Verwalten Sie Sicherheitseinstellungen und Zugriffsrechte</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Key className="inline-block h-5 w-5 mr-2" />
              Passwort-Richtlinien
            </CardTitle>
            <CardDescription>
              Definieren Sie Anforderungen für sichere Passwörter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-sm">Mindestlänge</span>
                <Input
                  type="number"
                  min="6"
                  max="32"
                  defaultValue="8"
                  className="w-20"
                />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Großbuchstaben erforderlich</span>
                <Switch defaultChecked />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Kleinbuchstaben erforderlich</span>
                <Switch defaultChecked />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Zahlen erforderlich</span>
                <Switch defaultChecked />
              </label>
              
              <label className="flex items-center justify-between">
                <span className="text-sm">Sonderzeichen erforderlich</span>
                <Switch />
              </label>
            </div>

            <div className="pt-2 space-y-2">
              <Label>Passwort-Ablauf</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={passwordExpiry}
                  onChange={(e) => setPasswordExpiry(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">Tage</span>
              </div>
              <p className="text-xs text-gray-500">
                Benutzer müssen ihr Passwort nach dieser Zeit ändern
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Shield className="inline-block h-5 w-5 mr-2" />
              Zwei-Faktor-Authentifizierung
            </CardTitle>
            <CardDescription>
              Zusätzliche Sicherheit für Benutzerkonten
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">2FA aktivieren</p>
                <p className="text-sm text-gray-600">
                  Erfordert einen zusätzlichen Code beim Login
                </p>
              </div>
              <Switch
                checked={twoFactor}
                onCheckedChange={setTwoFactor}
              />
            </div>

            {twoFactor && (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Benutzer können 2FA in ihren Profileinstellungen aktivieren
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>2FA-Methoden</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="text-sm">Authenticator App (TOTP)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">SMS</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">E-Mail</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Lock className="inline-block h-5 w-5 mr-2" />
              Sitzungseinstellungen
            </CardTitle>
            <CardDescription>
              Kontrollieren Sie Benutzer-Sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Sitzungs-Timeout</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">Minuten</span>
              </div>
              <p className="text-xs text-gray-500">
                Automatische Abmeldung nach Inaktivität
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximale Login-Versuche</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={loginAttempts}
                  onChange={(e) => setLoginAttempts(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-gray-600">Versuche</span>
              </div>
              <p className="text-xs text-gray-500">
                Konto wird nach zu vielen fehlgeschlagenen Versuchen gesperrt
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <p className="text-sm font-medium">Einzelanmeldung erzwingen</p>
                <p className="text-xs text-gray-600">
                  Nur eine aktive Sitzung pro Benutzer
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <UserCheck className="inline-block h-5 w-5 mr-2" />
              Zugriffskontrolle
            </CardTitle>
            <CardDescription>
              Verwalten Sie Zugriffsberechtigungen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP-Beschränkung</p>
                <p className="text-sm text-gray-600">
                  Zugriff nur von bestimmten IP-Adressen
                </p>
              </div>
              <Switch
                checked={ipRestriction}
                onCheckedChange={setIpRestriction}
              />
            </div>

            {ipRestriction && (
              <div className="space-y-2">
                <Label>Erlaubte IP-Adressen</Label>
                <textarea
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                  placeholder="192.168.1.1&#10;10.0.0.0/24"
                />
                <p className="text-xs text-gray-500">
                  Eine IP-Adresse oder Bereich pro Zeile
                </p>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <p className="text-sm font-medium">Benutzerrollen</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Super Admin</span>
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                    Vollzugriff
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Restaurant Owner</span>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Restaurant-Verwaltung
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">Mitarbeiter</span>
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    Eingeschränkt
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-900">
              <AlertTriangle className="inline-block h-5 w-5 mr-2" />
              Sicherheitsprotokoll
            </CardTitle>
            <CardDescription className="text-orange-700">
              Letzte sicherheitsrelevante Ereignisse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <div className="text-sm">
                  <p className="font-medium">Erfolgreiche Anmeldung</p>
                  <p className="text-xs text-gray-600">admin@oriido.com • 192.168.1.100</p>
                </div>
                <span className="text-xs text-gray-500">vor 2 Minuten</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-white rounded">
                <div className="text-sm">
                  <p className="font-medium">Passwort geändert</p>
                  <p className="text-xs text-gray-600">user@restaurant.com</p>
                </div>
                <span className="text-xs text-gray-500">vor 1 Stunde</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                <div className="text-sm">
                  <p className="font-medium text-red-900">Fehlgeschlagene Anmeldung</p>
                  <p className="text-xs text-red-700">unknown@email.com • 45.67.89.12</p>
                </div>
                <span className="text-xs text-gray-500">vor 3 Stunden</span>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4">
              Vollständiges Protokoll anzeigen
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Abbrechen
        </Button>
        <Button onClick={handleSave}>
          Sicherheitseinstellungen speichern
        </Button>
      </div>
    </div>
  )
}