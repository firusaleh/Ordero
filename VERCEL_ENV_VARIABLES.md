# Vercel Umgebungsvariablen für Oriido

## WICHTIG: Diese Variablen müssen in Vercel konfiguriert werden

### 1. PayTabs Konfiguration (für Naher Osten)

Diese Werte müssen durch ECHTE PayTabs-Credentials ersetzt werden:

```
PAYTABS_PROFILE_ID=dein-paytabs-profile-id
PAYTABS_SERVER_KEY=dein-paytabs-server-key  
PAYTABS_CLIENT_KEY=dein-paytabs-client-key
PAYTABS_BASE_URL=https://secure.paytabs.com
```

**Wo bekommst du diese Werte?**
1. Gehe zu [PayTabs](https://www.paytabs.com) und erstelle ein Merchant-Konto
2. Logge dich ins PayTabs Dashboard ein
3. Navigiere zu **Developers** → **API Keys**
4. Kopiere:
   - Profile ID
   - Server Key (für Backend-API-Calls)
   - Client Key (optional für Frontend-Validierung)

**Wichtig:** 
- Verwende für Produktion die LIVE-Keys, nicht die Test-Keys
- Die aktuellen Werte in `.env.local` sind nur Platzhalter und funktionieren NICHT

### 2. Stripe Konfiguration (für Europa) - BEREITS KONFIGURIERT

Diese sind bereits konfiguriert und funktionieren:

```
STRIPE_SECRET_KEY=sk_test_51SnM1lFKsQG9Heb2eSepCsK4b4NIEp6KmqolVcySX2kNB0qHVPqZFnoUNsuWu6ufGM5gQ9jV6RItqMJJumSrqrX700Q5hLx86m
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51SnM1lFKsQG9Heb2oYjWEHDY9FFPJHK3FyaDfWuEUBrWzybNtBrdULPjK7EkgojWfNK3TJ2ZHEP8NdzvSIyr5Ul300K51gwZqn
STRIPE_WEBHOOK_SECRET=whsec_...  # Muss für Webhooks konfiguriert werden
```

### 3. Andere wichtige Variablen

```
# App URL
NEXT_PUBLIC_APP_URL=https://www.oriido.com
NEXT_PUBLIC_APP_NAME=Oriido

# Database (MongoDB Atlas)
DATABASE_URL=mongodb+srv://info_db_user:ZTEM1jMEwLw1Ovgt@oriido.bpmadyc.mongodb.net/ordero?retryWrites=true&w=majority&appName=oriido

# NextAuth
NEXTAUTH_SECRET=dev-secret-only-for-local-development-do-not-use-in-production
NEXTAUTH_URL=https://www.oriido.com

# Email (Resend)
RESEND_API_KEY=re_test_123456789  # Muss durch echten Key ersetzt werden
EMAIL_FROM=Oriido <noreply@oriido.de>

# Pusher (für Realtime-Features)
PUSHER_APP_ID=your-app-id
NEXT_PUBLIC_PUSHER_KEY=your-pusher-key
PUSHER_SECRET=your-pusher-secret
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

## So konfigurierst du die Variablen in Vercel:

1. Gehe zu deinem Vercel Dashboard
2. Wähle das Oriido Projekt
3. Gehe zu **Settings** → **Environment Variables**
4. Füge jede Variable einzeln hinzu:
   - Name: z.B. `PAYTABS_PROFILE_ID`
   - Value: Der echte Wert
   - Environment: Production (und Preview wenn gewünscht)
5. Klicke auf **Save**
6. **WICHTIG:** Nach dem Hinzufügen aller Variablen musst du einen neuen Deploy triggern!

## Testen der Integration:

### PayTabs testen:
1. Stelle sicher, dass die PayTabs-Variablen korrekt sind
2. Setze ein Restaurant auf Land = "JO" (Jordanien)
3. Mache eine Testbestellung
4. Das System sollte automatisch PayTabs verwenden

### Stripe testen:
1. Setze ein Restaurant auf Land = "DE" (Deutschland)
2. Mache eine Testbestellung
3. Das System sollte automatisch Stripe verwenden

## Fallback-Verhalten:

Wenn PayTabs nicht konfiguriert ist:
- System fällt automatisch auf Stripe zurück
- Nutzer sieht eine Info-Nachricht
- Zahlung funktioniert trotzdem über Stripe

## Support-Kontakte:

- **PayTabs Support:** support@paytabs.com
- **PayTabs Docs:** https://www.paytabs.com/en/developers/
- **Stripe Support:** https://support.stripe.com