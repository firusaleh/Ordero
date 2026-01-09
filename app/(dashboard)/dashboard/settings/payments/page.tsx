'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StripeConnectSettings } from '@/components/dashboard/stripe-connect-settings';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentsSettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Fehler beim Laden der Restaurant-Daten');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <h1 className="text-2xl font-bold">Zahlungseinstellungen</h1>
        <p className="text-gray-600">Verwalten Sie Ihre Zahlungsmethoden und Stripe-Integration</p>
      </div>

      <StripeConnectSettings restaurantId={restaurantId} />

      <Card>
        <CardHeader>
          <CardTitle>Andere Zahlungsmethoden</CardTitle>
          <CardDescription>
            Aktivieren Sie weitere Zahlungsoptionen für Ihre Kunden
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
    </div>
  );
}