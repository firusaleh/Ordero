#!/bin/bash

# Oriido Demo Video Recorder Script
# Nutzt macOS Screen Recording

echo "🎬 Oriido Demo Video Recorder"
echo "=============================="
echo ""
echo "Dieses Skript öffnet die Demo und hilft Ihnen bei der Aufnahme."
echo ""

# Erstelle Videos-Ordner
mkdir -p videos

# Öffne die Demo im Browser
echo "📱 Öffne Demo im Browser..."
open public/demo-bilingual.html

echo ""
echo "📹 AUFNAHME-ANLEITUNG:"
echo "----------------------"
echo "1. Drücken Sie CMD + SHIFT + 5"
echo "2. Wählen Sie 'Ausgewählten Bereich aufnehmen'"
echo "3. Ziehen Sie ein Rechteck um das Browser-Fenster"
echo "4. Klicken Sie 'Aufnehmen'"
echo "5. Die Demo läuft 78 Sekunden automatisch"
echo "6. Stoppen Sie mit dem Stop-Button in der Menüleiste"
echo ""
echo "💾 Das Video wird auf Ihrem Desktop gespeichert als:"
echo "   'Bildschirmaufnahme [Datum].mov'"
echo ""
echo "🔄 Um zu MP4 zu konvertieren:"
echo "   - Öffnen Sie das Video mit QuickTime Player"
echo "   - Datei → Exportieren als → 1080p"
echo "   - Speichern als .mp4"
echo ""
echo "Drücken Sie ENTER um fortzufahren..."
read

echo ""
echo "Alternative: Automatische Aufnahme mit QuickTime"
echo "-------------------------------------------------"
echo "Möchten Sie QuickTime Player für die Aufnahme öffnen? (j/n)"
read answer

if [ "$answer" = "j" ]; then
    osascript <<EOF
    tell application "QuickTime Player"
        activate
        new screen recording
    end tell
EOF
    echo "✅ QuickTime Player geöffnet!"
    echo ""
    echo "QUICKTIME ANLEITUNG:"
    echo "1. Klicken Sie auf den roten Aufnahme-Button"
    echo "2. Wählen Sie den Browser-Bereich aus"
    echo "3. Die Aufnahme startet"
    echo "4. Stoppen Sie nach 78 Sekunden"
    echo "5. Speichern mit CMD+S als 'oriido-demo.mov'"
    echo "6. Exportieren als MP4: Datei → Exportieren als → 1080p"
fi

echo ""
echo "📁 Finale Videos sollten im 'videos' Ordner gespeichert werden."
echo ""
echo "Viel Erfolg! 🎉"