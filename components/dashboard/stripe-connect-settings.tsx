'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, ExternalLink, CreditCard, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface StripeConnectSettingsProps {
  restaurantId: string;
}

export function StripeConnectSettings({ restaurantId }: StripeConnectSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [accountStatus, setAccountStatus] = useState<{
    connected: boolean;
    onboardingCompleted: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    accountId?: string;
  }>({
    connected: false,
    onboardingCompleted: false
  });

  useEffect(() => {
    checkAccountStatus();
  }, [restaurantId]);

  const checkAccountStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await fetch(`/api/stripe-connect/onboarding?restaurantId=${restaurantId}`);
      const data = await response.json();
      setAccountStatus(data);
    } catch (error) {
      console.error('Error checking account status:', error);
      toast.error('Fehler beim Abrufen des Account-Status');
    } finally {
      setCheckingStatus(false);
    }
  };

  const startOnboarding = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe-connect/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Starten des Onboardings');
      }

      const data = await response.json();
      
      // Weiterleitung zu Stripe
      window.location.href = data.url;
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Fehler beim Starten des Stripe-Onboardings');
    } finally {
      setLoading(false);
    }
  };

  const openStripeDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stripe-connect/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId })
      });

      if (!response.ok) {
        throw new Error('Fehler beim Öffnen des Dashboards');
      }

      const data = await response.json();
      
      // Öffne Stripe Dashboard in neuem Tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Fehler beim Öffnen des Stripe-Dashboards');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Connect
          </CardTitle>
          <CardDescription>
            Verbinden Sie Ihr Stripe-Konto, um Zahlungen direkt zu empfangen
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!accountStatus.connected ? (
            <>
              <Alert>
                <AlertDescription>
                  <strong>So funktioniert Stripe Connect:</strong>
                  <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
                    <li>Sie erhalten Zahlungen direkt auf Ihr eigenes Stripe-Konto</li>
                    <li>Oriido erhält automatisch eine kleine Plattformgebühr (2.5%)</li>
                    <li>Tägliche automatische Auszahlungen auf Ihr Bankkonto</li>
                    <li>Vollständige Transparenz über alle Transaktionen</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={startOnboarding} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Stripe-Konto verbinden
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Verbindungsstatus</span>
                  <Badge variant={accountStatus.onboardingCompleted ? "default" : "secondary"}>
                    {accountStatus.onboardingCompleted ? "Verbunden" : "Einrichtung erforderlich"}
                  </Badge>
                </div>

                {accountStatus.accountId && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Account ID</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {accountStatus.accountId}
                    </code>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                    {accountStatus.chargesEnabled ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mb-1" />
                    )}
                    <span className="text-xs text-center">Zahlungen</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                    {accountStatus.payoutsEnabled ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mb-1" />
                    )}
                    <span className="text-xs text-center">Auszahlungen</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-muted rounded-lg">
                    {accountStatus.detailsSubmitted ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mb-1" />
                    ) : (
                      <XCircle className="h-5 w-5 text-gray-400 mb-1" />
                    )}
                    <span className="text-xs text-center">Verifiziert</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {!accountStatus.onboardingCompleted && (
                  <Button 
                    onClick={startOnboarding} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Einrichtung fortsetzen
                  </Button>
                )}
                
                {accountStatus.onboardingCompleted && (
                  <Button 
                    onClick={openStripeDashboard} 
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Stripe Dashboard
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {accountStatus.onboardingCompleted && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Gebührenstruktur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Stripe Transaktionsgebühr</span>
                <span className="text-sm font-medium">1.5% + 0.25€</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm">Oriido Plattformgebühr</span>
                <span className="text-sm font-medium">2.5%</span>
              </div>
              <div className="flex justify-between items-center py-2 font-medium">
                <span>Gesamtgebühren</span>
                <span>4% + 0.25€</span>
              </div>
              <Alert>
                <AlertDescription className="text-xs">
                  Bei einer Bestellung von 50€ erhalten Sie 47.75€ (nach Abzug aller Gebühren)
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}