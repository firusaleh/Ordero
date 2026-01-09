"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Settings, 
  Bell, 
  Mail, 
  Shield,
  CreditCard,
  Globe,
  Database,
  Save,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminSettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  const handleSave = () => {
    toast.success('Einstellungen gespeichert!')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Einstellungen</h1>
        <p className="text-gray-400 mt-1">Plattform-Konfiguration und Verwaltung</p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="general">Allgemein</TabsTrigger>
          <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          <TabsTrigger value="payment">Zahlungen</TabsTrigger>
          <TabsTrigger value="security">Sicherheit</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Allgemeine Einstellungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Grundlegende Plattform-Konfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Plattform Name</Label>
                <Input 
                  defaultValue="Oriido" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Support Email</Label>
                <Input 
                  type="email"
                  defaultValue="support@oriido.de" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Standard Währung</Label>
                <Input 
                  defaultValue="EUR" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Wartungsmodus</Label>
                  <p className="text-sm text-gray-500">Plattform für Wartungsarbeiten sperren</p>
                </div>
                <Switch 
                  checked={maintenanceMode}
                  onCheckedChange={setMaintenanceMode}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Benachrichtigungseinstellungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Konfiguration von System-Benachrichtigungen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Email-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">Wichtige Updates per Email senden</p>
                </div>
                <Switch 
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">Push-Benachrichtigungen</Label>
                  <p className="text-sm text-gray-500">Browser-Benachrichtigungen aktivieren</p>
                </div>
                <Switch 
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Admin-Benachrichtigungen bei</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded bg-gray-700 border-gray-600" />
                    <span className="text-sm">Neue Restaurant-Registrierung</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded bg-gray-700 border-gray-600" />
                    <span className="text-sm">Zahlungsfehler</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded bg-gray-700 border-gray-600" />
                    <span className="text-sm">System-Fehler</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Zahlungseinstellungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Stripe und Zahlungsmethoden konfigurieren
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Stripe Public Key</Label>
                <Input 
                  type="password"
                  defaultValue="pk_test_••••••••••••••••" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Stripe Secret Key</Label>
                <Input 
                  type="password"
                  defaultValue="sk_test_••••••••••••••••" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Webhook Endpoint Secret</Label>
                <Input 
                  type="password"
                  defaultValue="whsec_••••••••••••••••" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Standard MwSt-Satz (%)</Label>
                <Input 
                  type="number"
                  defaultValue="19" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sicherheitseinstellungen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Zugriff und Sicherheitskonfiguration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">2-Faktor-Authentifizierung</Label>
                  <p className="text-sm text-gray-500">Für Admin-Accounts erzwingen</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-gray-300">IP-Whitelisting</Label>
                  <p className="text-sm text-gray-500">Admin-Zugriff auf bestimmte IPs beschränken</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Session-Timeout (Minuten)</Label>
                <Input 
                  type="number"
                  defaultValue="60" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Max. Login-Versuche</Label>
                <Input 
                  type="number"
                  defaultValue="5" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                System-Informationen
              </CardTitle>
              <CardDescription className="text-gray-400">
                Technische Details und Wartung
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Version</p>
                  <p className="text-white font-medium">1.0.0</p>
                </div>
                <div>
                  <p className="text-gray-500">Node.js Version</p>
                  <p className="text-white font-medium">18.17.0</p>
                </div>
                <div>
                  <p className="text-gray-500">Datenbank</p>
                  <p className="text-white font-medium">MongoDB</p>
                </div>
                <div>
                  <p className="text-gray-500">Cache</p>
                  <p className="text-white font-medium">Redis</p>
                </div>
                <div>
                  <p className="text-gray-500">Speichernutzung</p>
                  <p className="text-white font-medium">23.4 GB / 100 GB</p>
                </div>
                <div>
                  <p className="text-gray-500">Bandbreite</p>
                  <p className="text-white font-medium">456 GB / 1 TB</p>
                </div>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button variant="outline" className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                  <Database className="h-4 w-4 mr-2" />
                  Datenbank-Backup erstellen
                </Button>
                <Button variant="outline" className="w-full bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Cache leeren
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-red-600 hover:bg-red-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Einstellungen speichern
        </Button>
      </div>
    </div>
  )
}