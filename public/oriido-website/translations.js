const translations = {
  de: {
    // Navigation
    'nav.features': 'Funktionen',
    'nav.howItWorks': 'So funktioniert\'s',
    'nav.faq': 'FAQ',
    'nav.login': 'Anmelden',
    'nav.getStarted': 'Kostenlos starten',
    
    // Hero Section
    'hero.badge': 'Jetzt verfügbar',
    'hero.title1': 'Mehr Umsatz.',
    'hero.title2': 'Weniger Wartezeit.',
    'hero.subtitle': 'Mit Oriido bestellen Ihre Gäste direkt per QR-Code am Tisch. Keine App, kein Download – einfach scannen und bestellen.',
    'hero.getStartedFree': 'Kostenlos starten →',
    'hero.learnMore': 'Mehr erfahren',
    'hero.stat1.value': '+20%',
    'hero.stat1.label': 'Mehr Umsatz',
    'hero.stat2.value': '2min',
    'hero.stat2.label': 'Durchschn. Wartezeit',
    'hero.stat3.value': '0€',
    'hero.stat3.label': 'Einrichtungsgebühr',
    
    // Phone Demo
    'demo.scanQR': 'QR-Code scannen',
    'demo.browseMenu': 'Menü durchsuchen',
    'demo.yourCart': 'Ihr Warenkorb',
    'demo.payment': 'Zahlung',
    'demo.success': 'Erfolg!',
    'demo.tableNumber': 'Tisch Nr.',
    'demo.burger': 'Burger',
    'demo.pizza': 'Pizza',
    'demo.salad': 'Salat',
    'demo.drinks': 'Getränke',
    'demo.checkout': 'Zur Kasse',
    'demo.payNow': 'Jetzt bezahlen',
    'demo.orderConfirmed': 'Bestellung bestätigt!',
    'demo.orderNumber': 'Bestellung #',
    'demo.estimatedTime': 'Geschätzte Zeit',
    'demo.minutes': 'Minuten',
    'demo.startDemo': 'Demo starten',
    'demo.next': 'Weiter →',
    
    // Features Section
    'features.title': 'Alles, was Ihr Restaurant braucht',
    'features.subtitle': 'Moderne Tools für maximale Effizienz und zufriedene Gäste',
    'features.qr.title': 'QR-Bestellungen',
    'features.qr.description': 'Gäste scannen, bestellen und bezahlen direkt am Tisch',
    'features.dashboard.title': 'Live-Dashboard',
    'features.dashboard.description': 'Behalten Sie alle Bestellungen in Echtzeit im Blick',
    'features.payment.title': 'Digitale Zahlung',
    'features.payment.description': 'Akzeptieren Sie alle gängigen Zahlungsmethoden',
    'features.menu.title': 'Digitale Speisekarte',
    'features.menu.description': 'Aktualisieren Sie Ihre Speisekarte in Sekunden',
    'features.multilang.title': 'Mehrsprachig',
    'features.multilang.description': 'Automatische Übersetzung in über 10 Sprachen',
    'features.analytics.title': 'Analysen',
    'features.analytics.description': 'Detaillierte Einblicke in Umsatz und Trends',
    
    // How It Works Section
    'how.title': 'Einfach einzurichten',
    'how.subtitle': 'In 3 Schritten startklar',
    'how.step1.number': '1',
    'how.step1.title': 'Restaurant registrieren',
    'how.step1.description': 'Erstellen Sie Ihr Konto und richten Sie Ihr Restaurant-Profil ein',
    'how.step2.number': '2',
    'how.step2.title': 'Speisekarte hochladen',
    'how.step2.description': 'Fügen Sie Ihre Gerichte mit Fotos und Preisen hinzu',
    'how.step3.number': '3',
    'how.step3.title': 'QR-Codes platzieren',
    'how.step3.description': 'Drucken Sie die QR-Codes aus und platzieren Sie sie auf den Tischen',
    
    // Pricing Section
    'pricing.title': 'Transparente Preise',
    'pricing.subtitle': 'Keine versteckten Kosten',
    'pricing.trial': '3 Monate kostenlos testen',
    'pricing.basic.name': 'Basic',
    'pricing.basic.price': '49€',
    'pricing.basic.period': '/Monat',
    'pricing.basic.feature1': 'Bis zu 100 Bestellungen/Monat',
    'pricing.basic.feature2': 'Digitale Speisekarte',
    'pricing.basic.feature3': 'QR-Code-Bestellungen',
    'pricing.basic.feature4': 'E-Mail-Support',
    'pricing.pro.name': 'Professional',
    'pricing.pro.price': '99€',
    'pricing.pro.period': '/Monat',
    'pricing.pro.feature1': 'Unbegrenzte Bestellungen',
    'pricing.pro.feature2': 'Alle Basic-Features',
    'pricing.pro.feature3': 'Live-Dashboard',
    'pricing.pro.feature4': 'Prioritäts-Support',
    'pricing.pro.feature5': 'Erweiterte Analysen',
    'pricing.enterprise.name': 'Enterprise',
    'pricing.enterprise.price': 'Individuell',
    'pricing.enterprise.period': '',
    'pricing.enterprise.feature1': 'Mehrere Standorte',
    'pricing.enterprise.feature2': 'Alle Pro-Features',
    'pricing.enterprise.feature3': 'Dedizierter Account Manager',
    'pricing.enterprise.feature4': 'Individuelle Anpassungen',
    'pricing.enterprise.feature5': 'API-Zugang',
    'pricing.popular': 'Beliebt',
    'pricing.choose': 'Auswählen',
    
    // FAQ Section
    'faq.title': 'Häufig gestellte Fragen',
    'faq.q1': 'Benötigen meine Gäste eine App?',
    'faq.a1': 'Nein! Ihre Gäste müssen keine App herunterladen. Sie scannen einfach den QR-Code und können direkt im Browser bestellen.',
    'faq.q2': 'Wie schnell kann ich starten?',
    'faq.a2': 'Die Einrichtung dauert weniger als 30 Minuten. Sie können noch heute mit der kostenlosen Testversion (100 Bestellungen) beginnen.',
    'faq.q3': 'Welche Zahlungsmethoden werden unterstützt?',
    'faq.a3': 'Wir unterstützen alle gängigen Zahlungsmethoden: Kreditkarten, PayPal, Apple Pay, Google Pay und Barzahlung.',
    'faq.q4': 'Kann ich meine Speisekarte jederzeit ändern?',
    'faq.a4': 'Ja, Sie können Ihre Speisekarte jederzeit über das Dashboard aktualisieren. Änderungen sind sofort sichtbar.',
    'faq.q5': 'Gibt es versteckte Kosten?',
    'faq.a5': 'Nein, unsere Preise sind transparent. Sie zahlen nur die monatliche Gebühr, keine Provisionen oder versteckte Kosten.',
    
    // Footer
    'footer.copyright': '© 2024 Oriido. Alle Rechte vorbehalten.',
    'footer.product': 'Produkt',
    'footer.company': 'Unternehmen',
    'footer.support': 'Support',
    'footer.legal': 'Rechtliches',
    'footer.features': 'Funktionen',
    'footer.pricing': 'Preise',
    'footer.api': 'API',
    'footer.about': 'Über uns',
    'footer.blog': 'Blog',
    'footer.careers': 'Karriere',
    'footer.help': 'Hilfe',
    'footer.contact': 'Kontakt',
    'footer.status': 'Status',
    'footer.privacy': 'Datenschutz',
    'footer.terms': 'AGB',
    'footer.imprint': 'Impressum'
  },
  
  en: {
    // Navigation
    'nav.features': 'Features',
    'nav.howItWorks': 'How It Works',
    'nav.faq': 'FAQ',
    'nav.login': 'Login',
    'nav.getStarted': 'Get Started Free',
    
    // Hero Section
    'hero.badge': 'Now Available',
    'hero.title1': 'More Revenue.',
    'hero.title2': 'Less Waiting.',
    'hero.subtitle': 'With Oriido, your guests order directly via QR code at the table. No app, no download – just scan and order.',
    'hero.getStartedFree': 'Get Started Free →',
    'hero.learnMore': 'Learn More',
    'hero.stat1.value': '+20%',
    'hero.stat1.label': 'More Revenue',
    'hero.stat2.value': '2min',
    'hero.stat2.label': 'Avg. Wait Time',
    'hero.stat3.value': '$0',
    'hero.stat3.label': 'Setup Fee',
    
    // Phone Demo
    'demo.scanQR': 'Scan QR Code',
    'demo.browseMenu': 'Browse Menu',
    'demo.yourCart': 'Your Cart',
    'demo.payment': 'Payment',
    'demo.success': 'Success!',
    'demo.tableNumber': 'Table No.',
    'demo.burger': 'Burger',
    'demo.pizza': 'Pizza',
    'demo.salad': 'Salad',
    'demo.drinks': 'Drinks',
    'demo.checkout': 'Checkout',
    'demo.payNow': 'Pay Now',
    'demo.orderConfirmed': 'Order Confirmed!',
    'demo.orderNumber': 'Order #',
    'demo.estimatedTime': 'Estimated Time',
    'demo.minutes': 'minutes',
    'demo.startDemo': 'Start Demo',
    'demo.next': 'Next →',
    
    // Features Section
    'features.title': 'Everything your restaurant needs',
    'features.subtitle': 'Modern tools for maximum efficiency and satisfied guests',
    'features.qr.title': 'QR Ordering',
    'features.qr.description': 'Guests scan, order and pay directly at the table',
    'features.dashboard.title': 'Live Dashboard',
    'features.dashboard.description': 'Keep track of all orders in real-time',
    'features.payment.title': 'Digital Payment',
    'features.payment.description': 'Accept all common payment methods',
    'features.menu.title': 'Digital Menu',
    'features.menu.description': 'Update your menu in seconds',
    'features.multilang.title': 'Multilingual',
    'features.multilang.description': 'Automatic translation in over 10 languages',
    'features.analytics.title': 'Analytics',
    'features.analytics.description': 'Detailed insights into revenue and trends',
    
    // How It Works Section
    'how.title': 'Easy to set up',
    'how.subtitle': 'Ready in 3 steps',
    'how.step1.number': '1',
    'how.step1.title': 'Register Restaurant',
    'how.step1.description': 'Create your account and set up your restaurant profile',
    'how.step2.number': '2',
    'how.step2.title': 'Upload Menu',
    'how.step2.description': 'Add your dishes with photos and prices',
    'how.step3.number': '3',
    'how.step3.title': 'Place QR Codes',
    'how.step3.description': 'Print the QR codes and place them on the tables',
    
    // Pricing Section
    'pricing.title': 'Transparent Pricing',
    'pricing.subtitle': 'No hidden fees',
    'pricing.trial': '3 months free trial',
    'pricing.basic.name': 'Basic',
    'pricing.basic.price': '$49',
    'pricing.basic.period': '/month',
    'pricing.basic.feature1': 'Up to 100 orders/month',
    'pricing.basic.feature2': 'Digital menu',
    'pricing.basic.feature3': 'QR code orders',
    'pricing.basic.feature4': 'Email support',
    'pricing.pro.name': 'Professional',
    'pricing.pro.price': '$99',
    'pricing.pro.period': '/month',
    'pricing.pro.feature1': 'Unlimited orders',
    'pricing.pro.feature2': 'All Basic features',
    'pricing.pro.feature3': 'Live dashboard',
    'pricing.pro.feature4': 'Priority support',
    'pricing.pro.feature5': 'Advanced analytics',
    'pricing.enterprise.name': 'Enterprise',
    'pricing.enterprise.price': 'Custom',
    'pricing.enterprise.period': '',
    'pricing.enterprise.feature1': 'Multiple locations',
    'pricing.enterprise.feature2': 'All Pro features',
    'pricing.enterprise.feature3': 'Dedicated account manager',
    'pricing.enterprise.feature4': 'Custom modifications',
    'pricing.enterprise.feature5': 'API access',
    'pricing.popular': 'Popular',
    'pricing.choose': 'Choose',
    
    // FAQ Section
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'Do my guests need an app?',
    'faq.a1': 'No! Your guests don\'t need to download any app. They simply scan the QR code and can order directly in the browser.',
    'faq.q2': 'How quickly can I get started?',
    'faq.a2': 'Setup takes less than 30 minutes. You can start with the free trial today.',
    'faq.q3': 'Which payment methods are supported?',
    'faq.a3': 'We support all common payment methods: credit cards, PayPal, Apple Pay, Google Pay and cash payment.',
    'faq.q4': 'Can I change my menu anytime?',
    'faq.a4': 'Yes, you can update your menu anytime via the dashboard. Changes are visible immediately.',
    'faq.q5': 'Are there any hidden costs?',
    'faq.a5': 'No, our prices are transparent. You only pay the monthly fee, no commissions or hidden costs.',
    
    // Footer
    'footer.copyright': '© 2024 Oriido. All rights reserved.',
    'footer.product': 'Product',
    'footer.company': 'Company',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    'footer.features': 'Features',
    'footer.pricing': 'Pricing',
    'footer.api': 'API',
    'footer.about': 'About',
    'footer.blog': 'Blog',
    'footer.careers': 'Careers',
    'footer.help': 'Help',
    'footer.contact': 'Contact',
    'footer.status': 'Status',
    'footer.privacy': 'Privacy',
    'footer.terms': 'Terms',
    'footer.imprint': 'Imprint'
  },
  
  ar: {
    // Navigation
    'nav.features': 'المميزات',
    'nav.howItWorks': 'كيف يعمل',
    'nav.faq': 'الأسئلة الشائعة',
    'nav.login': 'تسجيل الدخول',
    'nav.getStarted': 'ابدأ مجاناً',
    
    // Hero Section
    'hero.badge': 'متاح الآن',
    'hero.title1': 'مبيعات أكثر.',
    'hero.title2': 'انتظار أقل.',
    'hero.subtitle': 'مع أوريدو، يطلب ضيوفك مباشرة عبر رمز QR على الطاولة. بدون تطبيق، بدون تحميل - فقط امسح واطلب.',
    'hero.getStartedFree': 'ابدأ مجاناً ←',
    'hero.learnMore': 'اعرف المزيد',
    'hero.stat1.value': '+٢٠٪',
    'hero.stat1.label': 'مبيعات أكثر',
    'hero.stat2.value': '٢ دقيقة',
    'hero.stat2.label': 'متوسط وقت الانتظار',
    'hero.stat3.value': '٠ ريال',
    'hero.stat3.label': 'رسوم التثبيت',
    
    // Phone Demo
    'demo.scanQR': 'امسح رمز QR',
    'demo.browseMenu': 'تصفح القائمة',
    'demo.yourCart': 'سلتك',
    'demo.payment': 'الدفع',
    'demo.success': 'نجح!',
    'demo.tableNumber': 'طاولة رقم',
    'demo.burger': 'برجر',
    'demo.pizza': 'بيتزا',
    'demo.salad': 'سلطة',
    'demo.drinks': 'مشروبات',
    'demo.checkout': 'الدفع',
    'demo.payNow': 'ادفع الآن',
    'demo.orderConfirmed': 'تم تأكيد الطلب!',
    'demo.orderNumber': 'طلب #',
    'demo.estimatedTime': 'الوقت المقدر',
    'demo.minutes': 'دقيقة',
    'demo.startDemo': 'ابدأ العرض',
    'demo.next': 'التالي ←',
    
    // Features Section
    'features.title': 'كل ما يحتاجه مطعمك',
    'features.subtitle': 'أدوات حديثة لأقصى كفاءة وضيوف راضون',
    'features.qr.title': 'الطلب بـ QR',
    'features.qr.description': 'يمسح الضيوف ويطلبون ويدفعون مباشرة على الطاولة',
    'features.dashboard.title': 'لوحة التحكم المباشرة',
    'features.dashboard.description': 'تتبع جميع الطلبات في الوقت الفعلي',
    'features.payment.title': 'الدفع الرقمي',
    'features.payment.description': 'اقبل جميع طرق الدفع الشائعة',
    'features.menu.title': 'القائمة الرقمية',
    'features.menu.description': 'حدث قائمتك في ثوانٍ',
    'features.multilang.title': 'متعدد اللغات',
    'features.multilang.description': 'ترجمة تلقائية لأكثر من 10 لغات',
    'features.analytics.title': 'التحليلات',
    'features.analytics.description': 'رؤى تفصيلية للإيرادات والاتجاهات',
    
    // How It Works Section
    'how.title': 'سهل الإعداد',
    'how.subtitle': 'جاهز في 3 خطوات',
    'how.step1.number': '١',
    'how.step1.title': 'سجل المطعم',
    'how.step1.description': 'أنشئ حسابك وأعد ملف المطعم',
    'how.step2.number': '٢',
    'how.step2.title': 'ارفع القائمة',
    'how.step2.description': 'أضف أطباقك مع الصور والأسعار',
    'how.step3.number': '٣',
    'how.step3.title': 'ضع رموز QR',
    'how.step3.description': 'اطبع رموز QR وضعها على الطاولات',
    
    // Pricing Section
    'pricing.title': 'أسعار شفافة',
    'pricing.subtitle': 'لا توجد رسوم خفية',
    'pricing.trial': 'جرب مجاناً لمدة 3 أشهر',
    'pricing.basic.name': 'الأساسي',
    'pricing.basic.price': '٤٩ ريال',
    'pricing.basic.period': '/شهر',
    'pricing.basic.feature1': 'حتى 100 طلب/شهر',
    'pricing.basic.feature2': 'القائمة الرقمية',
    'pricing.basic.feature3': 'طلبات رمز QR',
    'pricing.basic.feature4': 'دعم البريد الإلكتروني',
    'pricing.pro.name': 'الاحترافي',
    'pricing.pro.price': '٩٩ ريال',
    'pricing.pro.period': '/شهر',
    'pricing.pro.feature1': 'طلبات غير محدودة',
    'pricing.pro.feature2': 'جميع مميزات الأساسي',
    'pricing.pro.feature3': 'لوحة التحكم المباشرة',
    'pricing.pro.feature4': 'دعم ذو أولوية',
    'pricing.pro.feature5': 'تحليلات متقدمة',
    'pricing.enterprise.name': 'المؤسسي',
    'pricing.enterprise.price': 'مخصص',
    'pricing.enterprise.period': '',
    'pricing.enterprise.feature1': 'مواقع متعددة',
    'pricing.enterprise.feature2': 'جميع مميزات الاحترافي',
    'pricing.enterprise.feature3': 'مدير حساب مخصص',
    'pricing.enterprise.feature4': 'تعديلات مخصصة',
    'pricing.enterprise.feature5': 'الوصول إلى API',
    'pricing.popular': 'الأكثر شعبية',
    'pricing.choose': 'اختر',
    
    // FAQ Section
    'faq.title': 'الأسئلة الشائعة',
    'faq.q1': 'هل يحتاج ضيوفي إلى تطبيق؟',
    'faq.a1': 'لا! لا يحتاج ضيوفك لتحميل أي تطبيق. يمسحون رمز QR ويمكنهم الطلب مباشرة من المتصفح.',
    'faq.q2': 'كم بسرعة يمكنني البدء؟',
    'faq.a2': 'الإعداد يستغرق أقل من 30 دقيقة. يمكنك البدء بالتجربة المجانية اليوم.',
    'faq.q3': 'ما طرق الدفع المدعومة؟',
    'faq.a3': 'ندعم جميع طرق الدفع الشائعة: البطاقات الائتمانية، PayPal، Apple Pay، Google Pay والدفع النقدي.',
    'faq.q4': 'هل يمكنني تغيير قائمتي في أي وقت؟',
    'faq.a4': 'نعم، يمكنك تحديث قائمتك في أي وقت عبر لوحة التحكم. التغييرات تظهر فوراً.',
    'faq.q5': 'هل هناك أي تكاليف خفية؟',
    'faq.a5': 'لا، أسعارنا شفافة. تدفع فقط الرسوم الشهرية، لا عمولات أو تكاليف خفية.',
    
    // Footer
    'footer.copyright': '© ٢٠٢٤ أوريدو. جميع الحقوق محفوظة.',
    'footer.product': 'المنتج',
    'footer.company': 'الشركة',
    'footer.support': 'الدعم',
    'footer.legal': 'القانوني',
    'footer.features': 'المميزات',
    'footer.pricing': 'الأسعار',
    'footer.api': 'API',
    'footer.about': 'عنا',
    'footer.blog': 'المدونة',
    'footer.careers': 'الوظائف',
    'footer.help': 'المساعدة',
    'footer.contact': 'اتصل',
    'footer.status': 'الحالة',
    'footer.privacy': 'الخصوصية',
    'footer.terms': 'الشروط',
    'footer.imprint': 'بصمة'
  }
};

// Language detection and initialization
let currentLanguage = 'de';

function detectLanguage() {
  const savedLang = localStorage.getItem('oriido_language');
  if (savedLang && translations[savedLang]) {
    return savedLang;
  }
  
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('ar')) {
    return 'ar';
  } else if (browserLang.startsWith('en')) {
    return 'en';
  }
  return 'de';
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem('oriido_language', lang);
  
  // Set RTL for Arabic
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  
  // Update all translatable elements
  updateTranslations();
  
  // Update language selector
  const langSelector = document.getElementById('languageSelector');
  if (langSelector) {
    langSelector.value = lang;
  }
}

function updateTranslations() {
  const elements = document.querySelectorAll('[data-translate]');
  elements.forEach(element => {
    const key = element.getAttribute('data-translate');
    const translation = translations[currentLanguage][key];
    if (translation) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
  currentLanguage = detectLanguage();
  setLanguage(currentLanguage);
});