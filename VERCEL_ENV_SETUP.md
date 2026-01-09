# Vercel Environment Variables Setup

## Schnell-Import über Vercel UI

1. Gehe zu deinem Vercel Dashboard
2. Wähle dein Projekt (Ordero)
3. Gehe zu "Settings" → "Environment Variables"
4. Klicke auf "Import .env file"
5. Kopiere den Inhalt von `env.production.example` und füge ihn ein

## WICHTIG: Folgende Werte MUSST du anpassen:

### 1. DATABASE_URL
Ersetze mit deinem MongoDB Atlas Connection String:
1. Gehe zu [MongoDB Atlas](https://cloud.mongodb.com)
2. Erstelle einen kostenlosen Cluster
3. Erstelle einen Database User
4. Hole dir den Connection String
5. Ersetze `username`, `password` und `cluster` im Connection String

### 2. NEXTAUTH_SECRET
Generiere einen neuen Secret:
```bash
openssl rand -base64 32
```
Oder nutze: https://generate-secret.vercel.app

### 3. NEXTAUTH_URL & NEXT_PUBLIC_APP_URL
Ersetze mit deiner Vercel URL:
- Wenn dein Projekt heißt: `ordero.vercel.app`
- Setze beide auf: `https://ordero.vercel.app`

### 4. Pusher (Optional für Echtzeit-Features)
1. Registriere dich kostenlos bei [Pusher](https://dashboard.pusher.com/accounts/sign_up)
2. Erstelle eine neue App
3. Kopiere die Keys

## Minimale Konfiguration für ersten Test

Für einen ersten Test brauchst du nur:
```env
DATABASE_URL=mongodb+srv://...
NEXTAUTH_SECRET=<generierter-secret>
NEXTAUTH_URL=https://<deine-app>.vercel.app
NEXT_PUBLIC_APP_URL=https://<deine-app>.vercel.app
```

Die Stripe und andere Keys können später hinzugefügt werden.

## Nach dem Import

1. Klicke auf "Save"
2. Trigger einen neuen Deploy:
   - Entweder: Push einen neuen Commit
   - Oder: Klicke auf "Redeploy" im Deployments Tab