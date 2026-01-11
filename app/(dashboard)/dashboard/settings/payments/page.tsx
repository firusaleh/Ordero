'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StripeConnectSettings } from '@/components/dashboard/stripe-connect-settings';
import { StripeBankSettings } from '@/components/dashboard/stripe-bank-settings';
import { PayTabsSettings } from '@/components/dashboard/paytabs-settings';
import { PayTabsVendorSettings } from '@/components/dashboard/paytabs-vendor-settings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, CreditCard, Globe, Building2, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Check if user is Super Admin or Admin (NOT restaurant owner)
  // Default to false to ensure restaurants don't see admin features
  const isSuperAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMIN';
  
  // Debug logging
  useEffect(() => {
    if (session?.user) {
      console.log('Current user role:', session.user.role);
      console.log('Is Super Admin?', isSuperAdmin);
      console.log('Full session:', session);
    }
  }, [session, isSuperAdmin]);

  useEffect(() => {
    fetchRestaurantId();
  }, [session]);

  useEffect(() => {
    // Check for Stripe Connect callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stripeConnect = urlParams.get('stripe_connect');
    
    if (stripeConnect === 'success') {
      toast.success('Stripe-Konto erfolgreich verbunden!');
      // Clean URL
      router.replace('/dashboard/settings/payments');
    } else if (stripeConnect === 'refresh') {
      toast.info('Bitte vervollständigen Sie die Einrichtung Ihres Stripe-Kontos');
    }
  }, [router]);

  const fetchRestaurantId = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/settings');
      if (response.ok) {
        const data = await response.json();
        if (data.restaurant?.id) {
          setRestaurantId(data.restaurant.id);
          setRestaurantName(data.restaurant.name || '');
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Fehler beim Laden der Restaurant-Daten');
    } finally {
      setLoading(false);
    }
  };

  // Wait for both session and restaurant data to load
  if (loading || !session) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Kein Restaurant gefunden. Bitte erstellen Sie zuerst ein Restaurant.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/settings')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">
          {isSuperAdmin ? 'Zahlungseinstellungen' : 'Auszahlungseinstellungen'}
        </h1>
        <p className="text-gray-600">
          {isSuperAdmin 
            ? 'Verwalten Sie Ihre Zahlungsmethoden und Payment-Integrationen'
            : 'Verwalten Sie Ihre Bankdaten für automatische Auszahlungen'}
        </p>
      </div>

      {isSuperAdmin ? (
        // Super Admin sieht alle Tabs
        <Tabs defaultValue="stripe" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-[600px]">
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe (Europa)
            </TabsTrigger>
            <TabsTrigger value="paytabs" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              PayTabs (Naher Osten)
            </TabsTrigger>
            <TabsTrigger value="vendor" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Auszahlungen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="space-y-6">
            <StripeConnectSettings restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="paytabs" className="space-y-6">
            <PayTabsSettings restaurantId={restaurantId} />
          </TabsContent>

          <TabsContent value="vendor" className="space-y-6">
            <PayTabsVendorSettings 
              restaurantId={restaurantId} 
              restaurantName={restaurantName}
            />
          </TabsContent>
        </Tabs>
      ) : (
        // Restaurant-Besitzer sieht Auszahlungseinstellungen für beide Systeme
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Auszahlungseinstellungen
              </CardTitle>
              <CardDescription>
                Hinterlegen Sie Ihre Bankdaten für automatische Auszahlungen.
                Je nach Region Ihrer Kunden werden Zahlungen über verschiedene Anbieter abgewickelt.
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Stripe Bankdaten für Europa */}
          <StripeBankSettings 
            restaurantId={restaurantId} 
            restaurantName={restaurantName}
          />
          
          {/* PayTabs Bankdaten für Naher Osten */}
          <PayTabsVendorSettings 
            restaurantId={restaurantId} 
            restaurantName={restaurantName}
          />
          
          {/* Info-Box über das Zahlungssystem */}
          <Card>
            <CardHeader>
              <CardTitle>So funktionieren Zahlungen bei Oriido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-green-100 p-2 mt-1">
                  <CreditCard className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Automatische Zahlungsabwicklung</p>
                  <p className="text-sm text-muted-foreground">
                    Ihre Kunden zahlen direkt über unsere Plattform - Sie müssen sich um nichts kümmern.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-blue-100 p-2 mt-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">97.5% Auszahlung</p>
                  <p className="text-sm text-muted-foreground">
                    Sie erhalten 97.5% jeder Zahlung. Nur 2.5% Servicegebühr - deutlich günstiger als die Konkurrenz!
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-purple-100 p-2 mt-1">
                  <Building2 className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">Direkt auf Ihr Konto</p>
                  <p className="text-sm text-muted-foreground">
                    Auszahlungen erfolgen automatisch nach Ihrem gewählten Plan (täglich, wöchentlich oder monatlich).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Weitere Zahlungsmethoden</CardTitle>
          <CardDescription>
            Standard-Zahlungsoptionen für Ihre Kunden
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">Barzahlung</p>
              <p className="text-sm text-muted-foreground">
                Kunden können bar im Restaurant bezahlen
              </p>
            </div>
            <Button variant="outline" size="sm">
              Aktiviert
            </Button>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">PayPal</p>
              <p className="text-sm text-muted-foreground">
                Online-Zahlung via PayPal (Kommt bald)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Bald verfügbar
            </Button>
          </div>
          
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Kryptowährungen</p>
              <p className="text-sm text-muted-foreground">
                Bitcoin, Ethereum und andere (Geplant)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Geplant
            </Button>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}