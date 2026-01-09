'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const sendTestEmail = async (type: string) => {
    if (!email) {
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie eine E-Mail-Adresse ein',
        variant: 'destructive'
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type })
      })

      if (response.ok) {
        toast({
          title: 'Erfolg',
          description: `Test-E-Mail "${type}" wurde gesendet`
        })
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Senden')
      }
    } catch (error) {
      toast({
        title: 'Fehler',
        description: error instanceof Error ? error.message : 'Fehler beim Senden der Test-E-Mail',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">E-Mail Service Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test-E-Mail senden</CardTitle>
          <CardDescription>
            Senden Sie Test-E-Mails, um die E-Mail-Vorlagen und den Service zu überprüfen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">E-Mail-Adresse</Label>
              <Input
                id="email"
                type="email"
                placeholder="test@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Tabs defaultValue="welcome" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="welcome">Willkommen</TabsTrigger>
                <TabsTrigger value="new-order">Neue Bestellung</TabsTrigger>
                <TabsTrigger value="confirmation">Bestätigung</TabsTrigger>
                <TabsTrigger value="status">Status-Update</TabsTrigger>
              </TabsList>
              
              <TabsContent value="welcome" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Willkommens-E-Mail für neue Restaurant-Besitzer
                </p>
                <Button 
                  onClick={() => sendTestEmail('welcome')} 
                  disabled={loading}
                >
                  Willkommens-E-Mail senden
                </Button>
              </TabsContent>
              
              <TabsContent value="new-order" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Benachrichtigung über neue Bestellung für Restaurant
                </p>
                <Button 
                  onClick={() => sendTestEmail('new-order')} 
                  disabled={loading}
                >
                  Neue Bestellung E-Mail senden
                </Button>
              </TabsContent>
              
              <TabsContent value="confirmation" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Bestellbestätigung für Gäste
                </p>
                <Button 
                  onClick={() => sendTestEmail('order-confirmation')} 
                  disabled={loading}
                >
                  Bestätigungs-E-Mail senden
                </Button>
              </TabsContent>
              
              <TabsContent value="status" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Status-Update für Bestellungen
                </p>
                <Button 
                  onClick={() => sendTestEmail('order-status')} 
                  disabled={loading}
                >
                  Status-Update E-Mail senden
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>E-Mail-Konfiguration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">RESEND_API_KEY</span>
            <span className="text-sm font-mono">
              {process.env.RESEND_API_KEY ? '✅ Konfiguriert' : '❌ Fehlt'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">EMAIL_FROM</span>
            <span className="text-sm font-mono">
              {process.env.EMAIL_FROM || 'Oriido <noreply@oriido.de>'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}