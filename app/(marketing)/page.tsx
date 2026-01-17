'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import './marketing.css'

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentScreen, setCurrentScreen] = useState(0)
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoProgress, setDemoProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  const screens = [
    { name: "QR Scanner", duration: 3000 },
    { name: "Browse Menu", duration: 4000 },
    { name: "Your Cart", duration: 3000 },
    { name: "Payment", duration: 3000 },
    { name: "Success!", duration: 3000 }
  ]

  const startDemo = () => {
    if (demoRunning) return
    setDemoRunning(true)
    setCurrentScreen(0)
    setDemoProgress(0)
    
    let screenIndex = 0
    const totalDuration = screens.reduce((sum, s) => sum + s.duration, 0)
    let elapsed = 0
    
    const progressInterval = setInterval(() => {
      elapsed += 50
      setDemoProgress((elapsed / totalDuration) * 100)
    }, 50)
    
    const runScreens = () => {
      if (screenIndex >= screens.length) {
        clearInterval(progressInterval)
        setDemoRunning(false)
        setDemoProgress(100)
        setTimeout(() => {
          setDemoProgress(0)
        }, 2000)
        return
      }
      
      setCurrentScreen(screenIndex)
      setTimeout(() => {
        screenIndex++
        runScreens()
      }, screens[screenIndex].duration)
    }
    
    runScreens()
  }

  const stopDemo = () => {
    setDemoRunning(false)
    setDemoProgress(0)
    setCurrentScreen(0)
  }

  return (
    <>
      {/* Ambient Background */}
      <div className="ambient-bg"></div>
      <div className="grid-overlay"></div>
      <div className="orb orb1"></div>
      <div className="orb orb2"></div>
      <div className="orb orb3"></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
        <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
        <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>So funktioniert's</a>
        <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
        <Link href="/login">Login</Link>
        <Link href="/register" className="btn-primary">Kostenlos starten</Link>
      </div>

      {/* Navigation */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <Link href="/" className="logo">
            <Image src="/oriido-logo.png" alt="Oriido" width={120} height={40} />
          </Link>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">So funktioniert's</a>
            <a href="#faq">FAQ</a>
            <Link href="/login" className="nav-login">Login</Link>
            <Link href="/register" className="nav-cta">Kostenlos starten</Link>
          </div>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(true)}>☰</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              Jetzt verfügbar
            </div>
            <h1>Mehr Umsatz.<br/><span>Weniger Warten.</span></h1>
            <p className="hero-subtitle">
              Mit Oriido bestellen Ihre Gäste direkt per QR-Code am Tisch. 
              Keine App, kein Download – einfach scannen und bestellen.
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="btn-primary">
                Kostenlos starten →
              </Link>
              <a href="#contact" className="btn-secondary">
                Mehr erfahren
              </a>
            </div>
            <div className="hero-stats">
              <div className="hero-stat">
                <div className="hero-stat-value">+20%</div>
                <div className="hero-stat-label">Mehr Umsatz</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">2min</div>
                <div className="hero-stat-label">Ø Wartezeit</div>
              </div>
              <div className="hero-stat">
                <div className="hero-stat-value">€0</div>
                <div className="hero-stat-label">Einrichtung</div>
              </div>
            </div>
          </div>

          {/* Phone Demo */}
          <div className="phone-section">
            <div className="phone-wrapper">
              <div className="glow-ring"></div>
              <div className="phone-frame">
                <div className="phone-screen">
                  <div className="dynamic-island"></div>
                  
                  {/* Screen 1: QR */}
                  <div className={`screen screen-qr ${currentScreen === 0 ? 'active' : ''}`}>
                    <div className="qr-title">QR-Code scannen</div>
                    <div className="qr-subtitle">Um am Tisch zu bestellen</div>
                    <div className="qr-frame">
                      <div className="qr-corners">
                        <div className="qr-corner tl"></div>
                        <div className="qr-corner tr"></div>
                        <div className="qr-corner bl"></div>
                        <div className="qr-corner br"></div>
                      </div>
                      <div className="qr-code">
                        {[...Array(49)].map((_, i) => (
                          <div key={i} className={`qr-cell ${[0,1,2,4,5,6,7,9,11,13,14,16,18,19,20,21,25,27,28,30,32,33,34,35,37,39,41,42,43,45,46,47,48].includes(i) ? '' : 'white'}`}></div>
                        ))}
                      </div>
                      <div className="scan-line"></div>
                    </div>
                    <div className="qr-hint">📱 Kamera-App öffnen</div>
                  </div>

                  {/* Screen 2: Menu */}
                  <div className={`screen screen-menu ${currentScreen === 1 ? 'active' : ''}`}>
                    <div className="menu-header">
                      <div className="restaurant-name">Bella Italia</div>
                      <div className="restaurant-info">
                        <span className="table-badge">Tisch 7</span>
                        <span>⭐ 4.8 (127)</span>
                      </div>
                    </div>
                    <div className="menu-categories">
                      <div className="category-pill active">🍕 Pizza</div>
                      <div className="category-pill">🍝 Pasta</div>
                      <div className="category-pill">🥗 Salate</div>
                      <div className="category-pill">🍷 Getränke</div>
                    </div>
                    <div className="menu-items">
                      <div className="menu-item">
                        <div className="menu-item-img">🍕</div>
                        <div className="menu-item-info">
                          <div className="menu-item-name">Margherita</div>
                          <div className="menu-item-desc">Tomate, Mozzarella, Basilikum</div>
                          <div className="menu-item-bottom">
                            <div className="menu-item-price">12,90 €</div>
                            <div className="add-btn">+</div>
                          </div>
                        </div>
                      </div>
                      <div className="menu-item">
                        <div className="menu-item-img">🍕</div>
                        <div className="menu-item-info">
                          <div className="menu-item-name">Diavola</div>
                          <div className="menu-item-desc">Salami, Peperoni, Mozzarella</div>
                          <div className="menu-item-bottom">
                            <div className="menu-item-price">14,50 €</div>
                            <div className="add-btn">+</div>
                          </div>
                        </div>
                      </div>
                      <div className="menu-item">
                        <div className="menu-item-img">🥤</div>
                        <div className="menu-item-info">
                          <div className="menu-item-name">Aperol Spritz</div>
                          <div className="menu-item-desc">Aperol, Prosecco, Soda</div>
                          <div className="menu-item-bottom">
                            <div className="menu-item-price">7,90 €</div>
                            <div className="add-btn">+</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Screen 3: Cart */}
                  <div className={`screen screen-cart ${currentScreen === 2 ? 'active' : ''}`}>
                    <div className="cart-header">
                      <div className="cart-title">Ihr Warenkorb</div>
                    </div>
                    <div className="cart-items">
                      <div className="cart-item">
                        <div className="cart-item-qty">2x</div>
                        <div className="cart-item-info">
                          <div className="cart-item-name">Margherita</div>
                          <div className="cart-item-price">25,80 €</div>
                        </div>
                      </div>
                      <div className="cart-item">
                        <div className="cart-item-qty">1x</div>
                        <div className="cart-item-info">
                          <div className="cart-item-name">Diavola</div>
                          <div className="cart-item-price">14,50 €</div>
                        </div>
                      </div>
                      <div className="cart-item">
                        <div className="cart-item-qty">2x</div>
                        <div className="cart-item-info">
                          <div className="cart-item-name">Aperol Spritz</div>
                          <div className="cart-item-price">15,80 €</div>
                        </div>
                      </div>
                    </div>
                    <div className="cart-summary">
                      <div className="summary-row">
                        <span>Zwischensumme</span>
                        <span>56,10 €</span>
                      </div>
                      <div className="summary-row">
                        <span>Servicegebühr</span>
                        <span>0,00 €</span>
                      </div>
                      <div className="summary-row total">
                        <span>Gesamt</span>
                        <span>56,10 €</span>
                      </div>
                      <button className="checkout-btn">Zur Kasse →</button>
                    </div>
                  </div>

                  {/* Screen 4: Payment */}
                  <div className={`screen screen-payment ${currentScreen === 3 ? 'active' : ''}`}>
                    <div className="payment-header">
                      <div className="payment-title">Zahlung</div>
                      <div className="payment-amount">56,10 €</div>
                    </div>
                    <div className="payment-methods">
                      <div className="payment-method selected">
                        <div className="payment-icon">VISA</div>
                        <div className="payment-name">•••• 4242</div>
                        <div className="payment-check">✓</div>
                      </div>
                      <div className="payment-method">
                        <div className="payment-icon">MC</div>
                        <div className="payment-name">Mastercard</div>
                      </div>
                      <div className="payment-method">
                        <div className="payment-icon">PP</div>
                        <div className="payment-name">PayPal</div>
                      </div>
                      <div className="payment-method">
                        <div className="payment-icon">AP</div>
                        <div className="payment-name">Apple Pay</div>
                      </div>
                    </div>
                    <button className="pay-now-btn">Jetzt bezahlen →</button>
                  </div>

                  {/* Screen 5: Success */}
                  <div className={`screen screen-success ${currentScreen === 4 ? 'active' : ''}`}>
                    <div className="success-icon">
                      <div className="success-check">✓</div>
                    </div>
                    <div className="success-title">Bestellung erfolgreich!</div>
                    <div className="success-subtitle">Ihr Essen wird zubereitet</div>
                    <div className="order-number">
                      <div className="order-label">Bestellnummer</div>
                      <div className="order-id">#2847</div>
                    </div>
                  </div>

                  <div className="touch-indicator"></div>
                </div>
              </div>
              
              {/* Demo Controller */}
              <div className="demo-controller">
                <button 
                  className={`demo-button ${demoRunning ? 'stop' : ''}`} 
                  onClick={demoRunning ? stopDemo : startDemo}
                >
                  {demoRunning ? '⏹' : '▶'}
                </button>
                <div className="demo-info">
                  <div className="demo-title">🍽️ Live-Demo</div>
                  <div className="demo-status">
                    {demoRunning ? screens[currentScreen]?.name : 'Demo starten'}
                  </div>
                  <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${demoProgress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="problem" id="problem">
        <div className="section-container">
          <div className="section-label">Das Problem</div>
          <h2 className="section-title">Warum verlieren Restaurants Umsatz?</h2>
          <p className="section-subtitle">
            Jede Minute Wartezeit kostet Sie Geld. Gäste, die warten müssen, 
            bestellen weniger – oder gehen frustriert.
          </p>
          <div className="problem-grid">
            <div className="problem-card">
              <div className="problem-icon">⏰</div>
              <h3>Lange Wartezeiten</h3>
              <p>Gäste warten durchschnittlich 8 Minuten auf Bedienung. Das ist zu lang – und kostet Sie Nachbestellungen.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">👋</div>
              <h3>Verpasste Bestellungen</h3>
              <p>Wenn der Kellner nicht kommt, bestellen Gäste nicht nach. 23% weniger Umsatz pro Tisch durch verpasste Impulskäufe.</p>
            </div>
            <div className="problem-card">
              <div className="problem-icon">😤</div>
              <h3>Frustrierte Gäste</h3>
              <p>Schlechte Bewertungen wegen Service-Wartezeiten. Das schadet Ihrem Ruf – und Ihrem Umsatz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-container">
          <div className="features-header">
            <div className="section-label">Die Lösung</div>
            <h2 className="section-title">Oriido macht es besser</h2>
            <p className="section-subtitle">
              Gäste bestellen selbst, wann immer sie wollen. Ihr Personal hat mehr Zeit 
              für echten Service. Win-Win.
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card large">
              <div className="feature-number">01</div>
              <div className="feature-content">
                <h3>Sofortige Tischbestellung</h3>
                <p>Gäste scannen den QR-Code und bestellen direkt – ohne auf Bedienung zu warten. Bestellungen gehen automatisch an Ihre Küche oder Ihr Kassensystem.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-number">02</div>
              <div className="feature-content">
                <h3>Keine App nötig</h3>
                <p>Reine Web-App. Funktioniert auf jedem Smartphone direkt im Browser. Kein Download, keine Hürden.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-number">03</div>
              <div className="feature-content">
                <h3>Integrierte Zahlungen</h3>
                <p>Gäste zahlen direkt nach der Bestellung oder am Ende. Apple Pay, Google Pay, Karten – alles dabei.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-number">04</div>
              <div className="feature-content">
                <h3>POS-Integration</h3>
                <p>Nahtlose Anbindung an ready2order, orderbird und andere beliebte Kassensysteme.</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-number">05</div>
              <div className="feature-content">
                <h3>Echtzeit-Dashboard</h3>
                <p>Behalten Sie die Kontrolle: Live-Bestellungen, Umsatzstatistiken und Tischstatus auf einen Blick.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <div className="section-container">
          <div className="how-header">
            <div className="section-label">So funktioniert's</div>
            <h2 className="section-title">3 einfache Schritte</h2>
            <p className="section-subtitle">
              Es könnte nicht einfacher sein. Für Sie und Ihre Gäste.
            </p>
          </div>
          <div className="steps-container">
            <div className="step">
              <div className="step-icon">📱</div>
              <h3>Scannen</h3>
              <p>Gast scannt den QR-Code am Tisch mit der Smartphone-Kamera</p>
            </div>
            <div className="step">
              <div className="step-icon">🍽️</div>
              <h3>Bestellen</h3>
              <p>Speisekarte durchstöbern und Lieblingsgerichte auswählen</p>
            </div>
            <div className="step">
              <div className="step-icon">✨</div>
              <h3>Genießen</h3>
              <p>Bestellung geht direkt an die Küche – Essen wird serviert</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="section-container">
          <div className="faq-header">
            <div className="section-label">FAQ</div>
            <h2 className="section-title">Häufig gestellte Fragen</h2>
          </div>
          <div className="faq-grid">
            <div className={`faq-item ${openFaq === 0 ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(0)}>
                <span>Müssen meine Gäste eine App installieren?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Nein! Oriido ist eine Web-App, die direkt im Browser läuft. Ihre Gäste scannen einfach den QR-Code mit ihrer Smartphone-Kamera und können sofort bestellen. Kein Download, keine Registrierung nötig.
                </div>
              </div>
            </div>
            <div className={`faq-item ${openFaq === 1 ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(1)}>
                <span>Wie lange dauert die Einrichtung?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Die Basis-Einrichtung dauert etwa 30 Minuten. Sie laden Ihre Speisekarte hoch, passen das Design an und drucken die QR-Codes aus. Bei POS-Integrationen helfen wir Ihnen persönlich – das dauert meist nur 1-2 Stunden.
                </div>
              </div>
            </div>
            <div className={`faq-item ${openFaq === 2 ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(2)}>
                <span>Welche Kassensysteme werden unterstützt?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Wir integrieren mit ready2order, orderbird, gastrofix und vielen anderen beliebten POS-Systemen. Bestellungen werden automatisch an Ihre Kasse übertragen. Falls Ihr System nicht aufgeführt ist, kontaktieren Sie uns – wir erweitern ständig.
                </div>
              </div>
            </div>
            <div className={`faq-item ${openFaq === 3 ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(3)}>
                <span>Gibt es versteckte Kosten oder Provisionen?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Nein! Sie zahlen nur die monatliche Flatrate. Es gibt keine Einrichtungsgebühr und keine Provision auf Bestellungen. Die einzigen zusätzlichen Kosten sind die Standard-Zahlungsgebühren von Stripe (ca. 1,4% + 0,25€ pro Transaktion).
                </div>
              </div>
            </div>
            <div className={`faq-item ${openFaq === 4 ? 'open' : ''}`}>
              <div className="faq-question" onClick={() => toggleFaq(4)}>
                <span>Wie starte ich?</span>
                <span className="faq-icon">+</span>
              </div>
              <div className="faq-answer">
                <div className="faq-answer-content">
                  Einfach kostenlos registrieren, Speisekarte hochladen, Design anpassen und QR-Codes ausdrucken. Sie können noch am selben Tag starten. Unser Team steht Ihnen bei Fragen zur Einrichtung oder POS-Integration zur Verfügung.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="contact" id="contact">
        <div className="contact-container">
          <div className="contact-header">
            <div className="section-label">Kontakt</div>
            <h2 className="section-title">Mehr erfahren</h2>
            <p className="section-subtitle">
              Haben Sie Fragen? Möchten Sie eine persönliche Demo? Füllen Sie das Formular aus und wir melden uns innerhalb von 24 Stunden.
            </p>
          </div>
          <form className="contact-form" action="https://formspree.io/f/your-form-id" method="POST">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">Vorname *</label>
                <input type="text" id="firstName" name="firstName" placeholder="Max" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Nachname *</label>
                <input type="text" id="lastName" name="lastName" placeholder="Mustermann" required />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">E-Mail-Adresse *</label>
              <input type="email" id="email" name="email" placeholder="max@restaurant.de" required />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Telefonnummer</label>
              <input type="tel" id="phone" name="phone" placeholder="+49 123 456789" />
            </div>
            <div className="form-group">
              <label htmlFor="restaurant">Restaurant Name *</label>
              <input type="text" id="restaurant" name="restaurant" placeholder="Ihr Restaurant Name" required />
            </div>
            <div className="form-group">
              <label htmlFor="tables">Anzahl Tische</label>
              <select id="tables" name="tables">
                <option value="">Auswählen...</option>
                <option value="1-10">1-10 Tische</option>
                <option value="11-25">11-25 Tische</option>
                <option value="26-50">26-50 Tische</option>
                <option value="50+">50+ Tische</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="message">Ihre Nachricht</label>
              <textarea id="message" name="message" placeholder="Erzählen Sie uns von Ihrem Restaurant und was Sie suchen..."></textarea>
            </div>
            <button type="submit" className="form-submit">Nachricht senden →</button>
            <p className="form-note">Wir antworten innerhalb von 24 Stunden. Kein Spam, versprochen.</p>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="section-container">
          <h2>Bereit für <span>mehr Umsatz?</span></h2>
          <p>Starten Sie noch heute mit Oriido. Einfache Einrichtung, keine Verpflichtungen.</p>
          <div className="final-cta-buttons">
            <Link href="/register" className="btn-primary">
              Kostenlos starten →
            </Link>
            <a href="#contact" className="btn-secondary">
              Demo anfordern
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo">
                <Image src="/oriido-logo.png" alt="Oriido" width={120} height={36} />
              </Link>
              <p>Das moderne QR-Bestellsystem für Restaurants. Mehr Umsatz, weniger Warten, zufriedenere Gäste.</p>
            </div>
            <div className="footer-col">
              <h4>Produkt</h4>
              <a href="#features">Features</a>
              <a href="#how-it-works">So funktioniert's</a>
              <a href="#faq">FAQ</a>
              <a href="#contact">Kontakt</a>
            </div>
            <div className="footer-col">
              <h4>Unternehmen</h4>
              <Link href="/about">Über uns</Link>
              <Link href="/blog">Blog</Link>
              <Link href="/careers">Karriere</Link>
              <a href="#contact">Kontakt</a>
            </div>
            <div className="footer-col">
              <h4>Rechtliches</h4>
              <Link href="/privacy">Datenschutz</Link>
              <Link href="/imprint">Impressum</Link>
              <Link href="/terms">AGB</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 Oriido. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </>
  )
}