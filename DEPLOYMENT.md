# Ordero Deployment Guide

## 1. GitHub Repository erstellen

1. Gehe zu https://github.com/new
2. Repository Name: `Ordero`
3. Visibility: Private (empfohlen für Production)
4. Erstelle das Repository OHNE README, .gitignore oder License

## 2. Code zu GitHub pushen

```bash
# Remote hinzufügen (bereits erledigt)
git remote add origin https://github.com/firashattab/Ordero.git

# Branch umbenennen (bereits erledigt)
git branch -M main

# Code pushen
git push -u origin main
```

## 3. Vercel Deployment

### Vercel Account einrichten
1. Gehe zu https://vercel.com
2. Melde dich mit deinem GitHub Account an
3. Klicke auf "Import Project"
4. Wähle das Ordero Repository

### Environment Variables in Vercel
Füge folgende Umgebungsvariablen in Vercel hinzu (Settings → Environment Variables):

```env
# App Configuration
NEXT_PUBLIC_APP_URL=https://deine-domain.vercel.app
NEXT_PUBLIC_APP_NAME=Oriido

# MongoDB Atlas (Production)
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/ordero?retryWrites=true&w=majority

# Authentication
NEXTAUTH_SECRET=[generiere mit: openssl rand -base64 32]
NEXTAUTH_URL=https://deine-domain.vercel.app

# Stripe (Production Keys)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STANDARD_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=Oriido <noreply@oriido.de>

# Pusher (Realtime)
PUSHER_APP_ID=...
NEXT_PUBLIC_PUSHER_KEY=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### Build Settings in Vercel
- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

## 4. MongoDB Atlas Setup

1. Erstelle einen kostenlosen Cluster auf https://cloud.mongodb.com
2. Konfiguriere Network Access (0.0.0.0/0 für Vercel)
3. Erstelle einen Database User
4. Kopiere die Connection String

## 5. Stripe Setup

### Stripe Dashboard
1. Erstelle Produkte und Preise für STANDARD und PREMIUM Pläne
2. Konfiguriere Webhook Endpoint: `https://deine-domain.vercel.app/api/stripe/webhook`
3. Wähle Events: `checkout.session.completed`, `customer.subscription.*`

### Stripe Connect (Noch zu implementieren)
- Wird nach dem initialen Deployment implementiert
- Ermöglicht direkte Zahlungen an Restaurants

## 6. Custom Domain (Optional)

1. In Vercel: Settings → Domains
2. Füge deine Domain hinzu (z.B. oriido.de)
3. Konfiguriere DNS Records bei deinem Domain Provider

## 7. Nach dem Deployment

### Datenbank initialisieren
```bash
# Seed Demo-Daten (optional)
DATABASE_URL=mongodb+srv://... npx tsx scripts/create-demo-restaurant.js
```

### Monitoring
- Vercel Dashboard für Deployment Logs
- MongoDB Atlas für Datenbank Monitoring
- Stripe Dashboard für Payment Monitoring

## Wichtige Hinweise

- **Sicherheit**: Stelle sicher, dass alle API Keys und Secrets sicher in Vercel Environment Variables gespeichert sind
- **Testing**: Teste zuerst mit Stripe Test Keys bevor du auf Live Keys umstellst
- **Backup**: Erstelle regelmäßige Backups deiner MongoDB Datenbank
- **SSL**: Vercel stellt automatisch SSL Zertifikate bereit

## Support

Bei Problemen:
1. Überprüfe Vercel Build Logs
2. Stelle sicher, dass alle Environment Variables korrekt gesetzt sind
3. Überprüfe MongoDB Atlas Verbindung
4. Teste Stripe Webhooks mit Stripe CLI