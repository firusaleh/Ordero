const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');
const fs = require('fs');

async function generateVideo() {
    console.log('🎬 Starte Video-Generierung für Oriido Demo...\n');
    
    // Erstelle Videos-Ordner falls nicht vorhanden
    const videosDir = path.join(__dirname, 'videos');
    if (!fs.existsSync(videosDir)) {
        fs.mkdirSync(videosDir);
    }
    
    const browser = await puppeteer.launch({
        headless: false, // Zeige Browser für Debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    });
    
    try {
        const page = await browser.newPage();
        
        // Setze Viewport für Instagram Story Format (9:16)
        await page.setViewport({ 
            width: 1080, 
            height: 1920 
        });
        
        console.log('📱 Viewport gesetzt: 1080x1920 (Instagram Story Format)');
        
        // Lade die Demo-Seite
        const demoPath = `file://${path.join(__dirname, 'public', 'demo-bilingual.html')}`;
        console.log(`📄 Lade Demo von: ${demoPath}`);
        
        await page.goto(demoPath, {
            waitUntil: 'networkidle0'
        });
        
        // Warte bis die Seite geladen ist
        await page.waitForTimeout(2000);
        
        // Konfiguriere den Recorder
        const recorder = new PuppeteerScreenRecorder(page, {
            followNewTab: false,
            fps: 30,
            videoFrame: {
                width: 1080,
                height: 1920,
            },
            aspectRatio: '9:16',
        });
        
        const timestamp = new Date().getTime();
        const outputPath = path.join(videosDir, `oriido-demo-${timestamp}.mp4`);
        
        console.log('🔴 Starte Aufnahme...');
        console.log(`📽️ Output: ${outputPath}\n`);
        
        // Starte die Aufnahme
        await recorder.start(outputPath);
        
        // Warte für die Demo-Dauer (13 Slides × 6 Sekunden = 78 Sekunden)
        const demoDuration = 78;
        console.log(`⏱️ Aufnahme läuft für ${demoDuration} Sekunden...`);
        
        // Zeige Fortschritt
        for (let i = 1; i <= demoDuration; i++) {
            await page.waitForTimeout(1000);
            if (i % 10 === 0) {
                console.log(`   ${i}/${demoDuration} Sekunden...`);
            }
        }
        
        // Stoppe die Aufnahme
        await recorder.stop();
        
        console.log('\n✅ Video erfolgreich erstellt!');
        console.log(`📁 Gespeichert unter: ${outputPath}`);
        console.log(`📏 Größe: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
        
        // Generiere auch eine deutsche Version
        console.log('\n🇩🇪 Generiere deutsche Version...');
        
        // Zweite Aufnahme für deutsche Version
        await page.reload();
        await page.waitForTimeout(2000);
        
        // Optional: Generiere auch arabische Version
        const generateArabic = false; // Setze auf true für arabische Version
        
        if (generateArabic) {
            console.log('\n🇸🇦 Generiere arabische Version...');
            
            // Klicke auf AR Button
            await page.click('.lang-btn:nth-child(2)');
            await page.waitForTimeout(1000);
            
            const arabicOutputPath = path.join(videosDir, `oriido-demo-ar-${timestamp}.mp4`);
            
            const recorderAr = new PuppeteerScreenRecorder(page, {
                followNewTab: false,
                fps: 30,
                videoFrame: {
                    width: 1080,
                    height: 1920,
                },
                aspectRatio: '9:16',
            });
            
            await recorderAr.start(arabicOutputPath);
            
            console.log('🔴 Aufnahme läuft (Arabisch)...');
            await page.waitForTimeout(demoDuration * 1000);
            
            await recorderAr.stop();
            console.log(`✅ Arabische Version gespeichert: ${arabicOutputPath}`);
        }
        
    } catch (error) {
        console.error('❌ Fehler bei der Video-Generierung:', error);
    } finally {
        await browser.close();
        console.log('\n🎉 Fertig! Videos befinden sich im "videos" Ordner.');
        console.log('💡 Tipp: Öffnen Sie die Videos mit QuickTime Player oder VLC.');
    }
}

// Hauptfunktion ausführen
generateVideo().catch(console.error);