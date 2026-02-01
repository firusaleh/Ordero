# 📹 Video-Export Anleitung für Oriido Demos

## 🎬 So erstellen Sie MP4-Videos aus den HTML-Demos

### Option 1: Screen Recording (Empfohlen für schnelle Ergebnisse)

#### Auf Mac:
1. **Öffnen Sie die Demo-Datei** im Browser:
   - `demo-bilingual.html` für DE/AR Version
   - `demo-instagram-story.html` für Story-Format
   - `demo-instagram-feed.html` für Feed-Format

2. **Starten Sie QuickTime Player**
   - Cmd + Space → "QuickTime Player"
   - Datei → Neue Bildschirmaufnahme

3. **Aufnahme-Einstellungen**:
   - Wählen Sie den Bereich des Browser-Fensters
   - Für Instagram Story: 9:16 Format (1080x1920)
   - Für Instagram Feed: 1:1 Format (1080x1080)

4. **Aufnahme starten**:
   - Klicken Sie auf Aufnahme
   - Die Demo läuft automatisch durch
   - Stoppen Sie nach einem kompletten Durchlauf

5. **Export als MP4**:
   - Datei → Exportieren als → 1080p
   - Speichern als MP4

#### Auf Windows:
1. **Windows Game Bar** (Win + G)
2. Oder verwenden Sie **OBS Studio** (kostenlos)

#### Auf iPhone/Android:
1. Öffnen Sie die Demo-URL im Browser
2. Nutzen Sie die Bildschirmaufnahme-Funktion
3. Perfekt für Instagram Stories!

---

### Option 2: Automatisierte Video-Generierung (Professionell)

#### Installation der benötigten Tools:

```bash
# 1. Installieren Sie die Pakete
npm install puppeteer puppeteer-screen-recorder

# 2. Erstellen Sie das Skript
touch scripts/generate-video.js
```

#### Video-Generierungs-Skript:

```javascript
// scripts/generate-video.js
const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');

async function generateVideo(language = 'de', format = 'story') {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport based on format
    const viewports = {
        'story': { width: 1080, height: 1920 }, // 9:16
        'feed': { width: 1080, height: 1080 },   // 1:1
        'landscape': { width: 1920, height: 1080 } // 16:9
    };
    
    await page.setViewport(viewports[format]);
    
    // Navigate to demo
    await page.goto(`file://${__dirname}/../public/demo-bilingual.html`);
    
    // Set language if bilingual demo
    if (language === 'ar') {
        await page.click('.lang-btn:nth-child(2)');
    }
    
    // Configure recorder
    const recorder = new PuppeteerScreenRecorder(page, {
        followNewTab: false,
        fps: 30,
        videoFrame: {
            width: viewports[format].width,
            height: viewports[format].height,
        },
        aspectRatio: format === 'story' ? '9:16' : format === 'feed' ? '1:1' : '16:9',
    });
    
    // Start recording
    await recorder.start(`./videos/oriido-demo-${language}-${format}.mp4`);
    
    // Wait for demo to complete (13 stories × 6 seconds)
    await page.waitForTimeout(78000);
    
    // Stop recording
    await recorder.stop();
    await browser.close();
    
    console.log(`✅ Video erstellt: oriido-demo-${language}-${format}.mp4`);
}

// Generate all versions
async function generateAllVideos() {
    await generateVideo('de', 'story');  // Deutsch Story
    await generateVideo('ar', 'story');  // Arabisch Story
    await generateVideo('de', 'feed');   // Deutsch Feed
    await generateVideo('ar', 'feed');   // Arabisch Feed
}

generateAllVideos();
```

#### Ausführen:

```bash
# Einzelnes Video generieren
node scripts/generate-video.js

# Oder als npm script
npm run generate-videos
```

---

### Option 3: Online Screen Recorder (Keine Installation)

1. **Loom** (www.loom.com)
   - Kostenlos bis 5 Minuten
   - Direkt im Browser
   - Export als MP4

2. **RecordScreen.io**
   - Komplett kostenlos
   - Keine Anmeldung
   - Direkter Download

---

## 🎯 Optimierung für Social Media

### Instagram Stories/Reels:
- **Format**: 9:16 (1080x1920)
- **Länge**: Max. 60 Sekunden für Reels
- **Datei**: `demo-instagram-story.html`

### Instagram Feed:
- **Format**: 1:1 (1080x1080)
- **Länge**: Max. 60 Sekunden
- **Datei**: `demo-instagram-feed.html`

### YouTube/Website:
- **Format**: 16:9 (1920x1080)
- **Länge**: Beliebig
- **Datei**: `demo-interactive.html`

---

## 🌍 Mehrsprachige Videos

Die `demo-bilingual.html` unterstützt:
- **Deutsch** (DE Button)
- **Arabisch** (AR Button) - mit RTL Support

### Zwei separate Videos erstellen:
1. Laden Sie die Seite
2. Wählen Sie die Sprache (DE/AR)
3. Starten Sie die Aufnahme
4. Speichern Sie als `oriido-demo-de.mp4` oder `oriido-demo-ar.mp4`

---

## 💡 Tipps für beste Ergebnisse

1. **Auflösung**: Immer in höchster Qualität aufnehmen (1080p+)

2. **Browser-Einstellungen**:
   - Vollbild-Modus (F11) für saubere Aufnahme
   - Zoom auf 100% stellen
   - Alle Benachrichtigungen ausschalten

3. **Nachbearbeitung** (optional):
   - Schneiden mit iMovie (Mac) oder Windows Video Editor
   - Musik hinzufügen
   - Logo/Watermark einfügen

4. **Komprimierung**:
   ```bash
   # Mit ffmpeg komprimieren (falls installiert)
   ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium output.mp4
   ```

---

## 📱 Direkt auf dem Smartphone

1. Öffnen Sie die Demo-URL auf Ihrem Handy:
   - `https://ihredomain.de/demo-bilingual.html`

2. Bildschirmaufnahme starten:
   - iPhone: Kontrollzentrum → Bildschirmaufnahme
   - Android: Quick Settings → Bildschirmaufnahme

3. Demo durchlaufen lassen

4. Video in Fotos/Galerie speichern

5. Direkt auf Instagram teilen!

---

## 🚀 Schnellstart

```bash
# Am schnellsten:
# 1. Demo im Browser öffnen
open public/demo-bilingual.html

# 2. QuickTime oder OBS starten
# 3. Aufnehmen
# 4. Als MP4 exportieren
# 5. Fertig! 🎉
```

---

## 📊 Video-Spezifikationen

| Platform | Format | Auflösung | Max. Länge | Dateigröße |
|----------|--------|-----------|------------|------------|
| Instagram Story | 9:16 | 1080x1920 | 60 Sek | 100 MB |
| Instagram Reel | 9:16 | 1080x1920 | 90 Sek | 100 MB |
| Instagram Feed | 1:1 | 1080x1080 | 60 Sek | 100 MB |
| YouTube | 16:9 | 1920x1080 | Unbegrenzt | 128 GB |
| LinkedIn | 16:9 | 1920x1080 | 10 Min | 5 GB |
| Twitter | 16:9 | 1280x720 | 140 Sek | 512 MB |

---

Bei Fragen oder Problemen: support@oriido.de