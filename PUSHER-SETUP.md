# Pusher Setup für Oriido

## Was ist Pusher?
Pusher ermöglicht **Echtzeit-Features** in Oriido:
- 🔔 **Live-Bestellungen**: Neue Bestellungen erscheinen sofort
- 📊 **Status-Updates**: Änderungen werden live übertragen  
- 🔊 **Sound-Benachrichtigungen**: Bei neuen Bestellungen

## Schritt-für-Schritt Anleitung

### 1. Pusher Account erstellen (kostenlos)

1. Gehe zu: https://dashboard.pusher.com/accounts/sign_up
2. Registriere dich mit E-Mail
3. Bestätige deine E-Mail-Adresse

### 2. Neue App erstellen

1. Nach dem Login klicke auf **"Create app"**
2. Wähle folgende Einstellungen:
   - **Name your app**: Oriido
   - **Select a cluster**: EU (Ireland) 
   - **Tech stack**: Node.js (Backend), React (Frontend)
   - **Product**: Channels (bereits ausgewählt)
3. Klicke auf **"Create app"**

### 3. API Keys kopieren

Nach dem Erstellen siehst du deine Credentials:

```
App ID: 1234567
Key: abc123def456ghi789
Secret: 123abc456def789ghi
Cluster: eu
```

### 4. In .env.local eintragen

Öffne `.env.local` und ersetze die Platzhalter:

```env
PUSHER_APP_ID="1234567"
NEXT_PUBLIC_PUSHER_KEY="abc123def456ghi789"
PUSHER_SECRET="123abc456def789ghi"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```

### 5. Server neu starten

```bash
# Stoppe den Server mit Ctrl+C
# Starte neu:
npm run dev
```

## Testen

1. Öffne das Dashboard als Restaurant-Owner
2. Gehe zu "Bestellungen"
3. Du solltest einen **grünen Punkt** sehen (= verbunden)
4. Teste mit einer Bestellung vom Gäste-Interface

## Kostenlose Limits

Der kostenlose Pusher Plan beinhaltet:
- ✅ 200k Messages pro Tag
- ✅ 100 gleichzeitige Verbindungen
- ✅ Unbegrenzte Channels

Das reicht für:
- ~1000 Bestellungen pro Tag
- ~20 gleichzeitig aktive Restaurants

## Troubleshooting

### Fehler: "Pusher Verbindung nicht möglich"
- Prüfe ob die Keys korrekt sind
- Prüfe ob der Cluster stimmt (eu)

### Fehler: "403 Forbidden"
- App ID oder Secret ist falsch

### Keine Live-Updates
- Browser-Konsole prüfen (F12)
- Pusher Dashboard prüfen (zeigt aktive Verbindungen)

## Alternative: Ohne Pusher arbeiten

Wenn du Pusher nicht nutzen möchtest:
- Live-Updates funktionieren nicht
- Bestellungen müssen manuell aktualisiert werden (F5)
- Sound-Benachrichtigungen sind deaktiviert

Die App funktioniert trotzdem, nur ohne Echtzeit-Features!