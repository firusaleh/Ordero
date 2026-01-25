# 🚨 WICHTIG: Stripe auf Vercel einrichten

## Problem
Die Stripe-Integration funktioniert nicht auf www.oriido.com, weil die Umgebungsvariablen fehlen.

## Lösung - Schritt für Schritt:

### 1. Gehe zu Vercel Dashboard
1. Öffne https://vercel.com/dashboard
2. Wähle dein Projekt "Ordero" oder "oriido"

### 2. Navigiere zu den Umgebungsvariablen
1. Klicke auf **Settings** (oben im Menü)
2. Klicke auf **Environment Variables** (linke Seitenleiste)

### 3. Füge diese Variablen hinzu:

#### STRIPE_SECRET_KEY (WICHTIGSTE!)
- **Key:** `STRIPE_SECRET_KEY`
- **Value:** `sk_test_51SnM1lFKsQG9Heb2eSepCsK4b4NIEp6KmqolVcySX2kNB0qHVPqZFnoUNsuWu6ufGM5gQ9jV6RItqMJJumSrqrX700Q5hLx86m`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- **Key:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value:** `pk_test_51SnM1lFKsQG9Heb2oYjWEHDY9FFPJHK3FyaDfWuEUBrWzybNtBrdULPjK7EkgojWfNK3TJ2ZHEP8NdzvSIyr5Ul300K51gwZqn`
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### STRIPE_WEBHOOK_SECRET (Optional, für später)
- **Key:** `STRIPE_WEBHOOK_SECRET`
- **Value:** `whsec_test_secret` (Temporär, später durch echten Webhook Secret ersetzen)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### STRIPE_CONNECT_PLATFORM_FEE_FIXED
- **Key:** `STRIPE_CONNECT_PLATFORM_FEE_FIXED`
- **Value:** `45` (in Cents, entspricht 0.45 EUR)
- **Environment:** ✅ Production, ✅ Preview, ✅ Development
- **Hinweis:** Dies ist eine Fixgebühr pro Bestellung, keine prozentuale Gebühr

### 4. Speichern und Neu deployen
1. Klicke auf **Save** für jede Variable
2. **WICHTIG:** Nach dem Hinzufügen aller Variablen:
   - Gehe zu **Deployments**
   - Klicke auf die drei Punkte (...) beim letzten Deployment
   - Wähle **Redeploy**
   - Warte 1-2 Minuten bis das Deployment fertig ist

### 5. Testen
1. Gehe zu https://www.oriido.com/dashboard/settings/payments
2. Klicke auf "Stripe-Konto verbinden"
3. Es sollte jetzt funktionieren!

## Alternative: Schnell-Fix über Vercel CLI

Falls du die Vercel CLI installiert hast:
```bash
vercel env add STRIPE_SECRET_KEY production
# Füge den Key ein: sk_test_51SnM1lFKsQG9Heb2eSepCsK4b4NIEp6KmqolVcySX2kNB0qHVPqZFnoUNsuWu6ufGM5gQ9jV6RItqMJJumSrqrX700Q5hLx86m

vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production  
# Füge den Key ein: pk_test_51SnM1lFKsQG9Heb2oYjWEHDY9FFPJHK3FyaDfWuEUBrWzybNtBrdULPjK7EkgojWfNK3TJ2ZHEP8NdzvSIyr5Ul300K51gwZqn

# Dann neu deployen
vercel --prod
```

## Wichtige Hinweise:
- Dies sind TEST-Keys von Stripe (erkennbar an `sk_test_` und `pk_test_`)
- Für Produktion später durch LIVE-Keys ersetzen (beginnen mit `sk_live_` und `pk_live_`)
- Die Keys sind sicher für Testzwecke

## Probleme?
Falls es immer noch nicht funktioniert:
1. Prüfe ob das Deployment erfolgreich war
2. Schaue in die Vercel Function Logs: **Functions** → **api/stripe-connect/onboarding** → **Logs**
3. Dort siehst du die genaue Fehlermeldung

## Gebührenstruktur

- **Plattformgebühr**: 0.45 EUR pro Bestellung (Fixbetrag)
- **Restaurant erhält**: Bestellbetrag minus 0.45 EUR
- **Automatische Verteilung**: Nur mit Stripe Connect möglich

### Was passiert wenn Stripe Connect nicht eingerichtet ist?

1. **Fallback Modus**: Das System wechselt automatisch in den "DIRECT_FALLBACK" Modus
2. **Zahlungsfluss**: Alle Zahlungen gehen direkt an das Oriido Hauptkonto
3. **Keine automatische Verteilung**: Die automatische Abzügung der 0.45 EUR Plattformgebühr funktioniert nicht
4. **Manuelle Überweisung**: Oriido muss das Geld manuell an die Restaurants überweisen (abzüglich 0.45 EUR Gebühr)