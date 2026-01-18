export const translations = {
  ar: {
    // Navigation
    nav: {
      dashboard: 'لوحة التحكم',
      orders: 'الطلبات',
      menu: 'قائمة الطعام',
      tables: 'الطاولات و QR',
      statistics: 'الإحصائيات',
      staff: 'الموظفون',
      billing: 'الفوترة',
      settings: 'الإعدادات',
      setup: 'الإعداد'
    },
    // Setup Page
    setup: {
      title: 'إعداد المطعم',
      subtitle: 'أكمل هذه الخطوات لتفعيل مطعمك بالكامل',
      goLive: 'انطلق الآن!',
      completeSetup: 'أكمل الإعداد',
      required: 'مطلوب',
      optional: 'اختياري',
      edit: 'تعديل',
      setup: 'إعداد',
      manage: 'إدارة',
      create: 'إنشاء',
      configure: 'تكوين',
      customize: 'تخصيص',
      progress: {
        title: 'التقدم الإجمالي',
        description: '{{completed}} من {{total}} خطوات مطلوبة مكتملة',
        ready: 'جاهز',
        inProgress: 'قيد التنفيذ'
      },
      congratulations: 'تهانينا! مطعمك جاهز لاستقبال الطلبات.',
      basic: {
        title: 'المعلومات الأساسية',
        basicInfo: {
          title: 'البيانات الأساسية',
          description: 'اسم المطعم والوصف وبيانات الاتصال'
        },
        address: {
          title: 'العنوان',
          description: 'العنوان الكامل للعملاء'
        },
        contact: {
          title: 'الاتصال',
          description: 'الهاتف والبريد الإلكتروني والموقع الإلكتروني'
        }
      },
      menu: {
        title: 'قائمة الطعام',
        categories: {
          title: 'الفئات',
          description: 'إنشاء فئات قائمة الطعام'
        },
        items: {
          title: 'الأطباق والمشروبات',
          description: 'إضافة 5 عناصر على الأقل'
        }
      },
      operation: {
        title: 'التشغيل',
        tables: {
          title: 'الطاولات ورموز QR',
          description: 'إعداد الطاولات وإنشاء رموز QR'
        },
        hours: {
          title: 'ساعات العمل',
          description: 'تحديد أوقات العمل'
        },
        payment: {
          title: 'طرق الدفع',
          description: 'تكوين خيارات الدفع المقبولة'
        }
      },
      advanced: {
        title: 'الإعدادات المتقدمة',
        design: {
          title: 'التصميم والمظهر',
          description: 'الشعار والألوان والصور'
        },
        staff: {
          title: 'الموظفون',
          description: 'إضافة أعضاء الفريق'
        },
        notifications: {
          title: 'الإشعارات',
          description: 'البريد الإلكتروني والإشعارات الصوتية'
        }
      },
      stats: {
        categoriesCreated: 'فئات تم إنشاؤها',
        itemsCreated: 'عناصر تم إنشاؤها',
        tablesCreated: 'طاولات تم إنشاؤها'
      },
      tips: {
        title: 'نصائح للبداية',
        tip1: 'ابدأ بالبيانات الأساسية واعمل بالترتيب',
        tip2: 'ارفع صورًا عالية الجودة لأطباقك - هذا يزيد الطلبات',
        tip3: 'اختبر عملية الطلب عبر رمز QR بنفسك قبل البدء',
        tip4: 'درّب فريقك على استخدام النظام'
      },
      errors: {
        incompleteSteps: 'يرجى إكمال جميع الخطوات المطلوبة',
        activationFailed: 'خطأ في التفعيل'
      },
      success: {
        goLive: 'المطعم الآن مباشر! 🎉'
      }
    },
    // Dashboard
    dashboard: {
      title: 'لوحة التحكم',
      welcome: 'مرحباً بعودتك',
      setupIncomplete: 'إعداد المطعم غير مكتمل',
      completed: 'مكتمل',
      setupDescription: 'أكمل الإعداد حتى يتمكن العملاء من الطلب منك.',
      missingBasicInfo: 'البيانات الأساسية والوصف مفقودة',
      missingAddress: 'العنوان غير مكتمل',
      missingCategories: 'لم يتم إنشاء فئات قائمة الطعام',
      missingMenuItems: 'أقل من 5 عناصر في قائمة الطعام',
      missingTables: 'لم يتم إنشاء طاولات/رموز QR',
      missingPaymentMethods: 'لم يتم تكوين طرق الدفع',
      continueSetup: 'متابعة الإعداد',
      trialVersion: 'النسخة التجريبية',
      daysRemaining: 'أيام متبقية',
      trialDescription: 'تنتهي النسخة التجريبية في {{days}} يوم. قم بالترقية الآن للاستمرار في استخدام جميع الميزات.',
      upgradeNow: 'قم بالترقية الآن',
      todayRevenue: 'إيرادات اليوم',
      fromYesterday: 'من الأمس',
      ordersToday: 'طلبات اليوم',
      pending: 'معلّق',
      averageOrderValue: 'متوسط قيمة الطلب',
      today: 'اليوم',
      activeTables: 'الطاولات النشطة',
      qrCodesGenerated: 'رموز QR تم إنشاؤها',
      manage: 'إدارة',
      items: 'عناصر',
      qrCodes: 'رموز QR',
      tables: 'طاولات',
      view: 'عرض',
      recentOrders: 'الطلبات الأخيرة',
      viewAll: 'عرض الكل',
      order: 'الطلب',
      table: 'الطاولة',
      takeaway: 'للاصطحاب',
      noOrdersToday: 'لا توجد طلبات اليوم بعد',
      orderStatus: {
        pending: 'معلّق',
        confirmed: 'مؤكد',
        preparing: 'قيد التحضير',
        ready: 'جاهز',
        completed: 'مكتمل',
        cancelled: 'ملغى'
      }
    },
    // Orders
    orders: {
      title: 'الطلبات',
      subtitle: 'عرض مباشر لجميع الطلبات الواردة',
      liveOrders: 'الطلبات المباشرة',
      realtime: 'عرض فوري لجميع الطلبات الواردة',
      offline: 'غير متصل',
      noRealtime: 'التحديثات الفورية غير متاحة - قم بتحديث الصفحة يدوياً',
      newOrder: 'طلب جديد',
      newOrderDesc: 'طلب جديد من الطاولة {{table}}',
      soundEnabled: 'الصوت مفعل',
      soundDisabled: 'الصوت معطل',
      filter: {
        all: 'الكل',
        pending: 'معلّق',
        confirmed: 'مؤكد',
        preparing: 'قيد التحضير',
        ready: 'جاهز',
        delivered: 'تم التوصيل',
        cancelled: 'ملغى'
      },
      status: {
        pending: 'معلّق',
        confirmed: 'مؤكد',
        preparing: 'قيد التحضير',
        ready: 'جاهز',
        delivered: 'تم التوصيل',
        cancelled: 'ملغى'
      },
      actions: {
        confirm: 'تأكيد',
        startPreparing: 'بدء التحضير',
        markReady: 'جاهز',
        markDelivered: 'تم التوصيل',
        cancel: 'إلغاء',
        cancelConfirm: 'هل تريد حقاً إلغاء الطلب؟',
        cancelledByStaff: 'ألغي بواسطة الموظف'
      },
      table: 'الطاولة',
      takeaway: 'للاصطحاب',
      orderNumber: 'رقم الطلب',
      total: 'المجموع',
      items: 'العناصر',
      time: 'الوقت',
      noOrders: 'لا توجد طلبات',
      noOrdersDesc: 'لا توجد طلبات بعد. سيتم عرض الطلبات الجديدة هنا تلقائياً.'
    },
    // Settings
    settings: {
      title: 'الإعدادات',
      subtitle: 'إدارة إعدادات المطعم',
      general: {
        title: 'الإعدادات العامة',
        description: 'معلومات المطعم والإعدادات الأساسية'
      },
      features: {
        title: 'المميزات المتقدمة',
        description: 'ساعات العمل والصور والإشعارات'
      },
      pos: {
        title: 'تكامل نظام نقاط البيع',
        description: 'ربط نظام الكاشير مع Oriido'
      },
      design: {
        title: 'التصميم والمظهر',
        description: 'تخصيص الألوان والشعار والعلامة التجارية'
      },
      language: {
        title: 'اللغة والمنطقة',
        description: 'اللغة والعملة والمنطقة الزمنية'
      },
      security: {
        title: 'الأمان',
        description: 'كلمات المرور وصلاحيات الوصول'
      },
      data: {
        title: 'البيانات والتصدير',
        description: 'النسخ الاحتياطي وخيارات التصدير'
      }
    },
    // Common
    common: {
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      edit: 'تعديل',
      add: 'إضافة',
      search: 'بحث',
      filter: 'تصفية',
      loading: 'جاري التحميل...',
      noData: 'لا توجد بيانات',
      logout: 'تسجيل الخروج',
      profile: 'الملف الشخصي',
      help: 'مساعدة',
      documentation: 'الوثائق',
      support: 'اتصل بالدعم'
    },
    // Profile
    profile: {
      title: 'ملفي الشخصي',
      subtitle: 'إدارة معلوماتك الشخصية',
      personalInfo: 'المعلومات الشخصية',
      updateInfo: 'تحديث بياناتك الشخصية',
      changePassword: 'تغيير كلمة المرور',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmPassword: 'تأكيد كلمة المرور',
      memberSince: 'عضو منذ',
      role: 'الدور',
      email: 'البريد الإلكتروني',
      name: 'الاسم',
      phone: 'الهاتف'
    }
  },
  de: {
    // Navigation
    nav: {
      dashboard: 'Übersicht',
      orders: 'Bestellungen',
      menu: 'Speisekarte',
      tables: 'Tische & QR',
      statistics: 'Statistiken',
      staff: 'Mitarbeiter',
      billing: 'Abrechnung',
      settings: 'Einstellungen',
      setup: 'Einrichtung'
    },
    // Setup Page
    setup: {
      title: 'Restaurant einrichten',
      subtitle: 'Vervollständigen Sie die Einrichtung, um online zu gehen',
      goLive: 'Jetzt Live gehen!',
      completeSetup: 'Einrichtung abschließen',
      required: 'Erforderlich',
      optional: 'Optional',
      edit: 'Bearbeiten',
      setup: 'Einrichten',
      manage: 'Verwalten',
      create: 'Anlegen',
      configure: 'Konfigurieren',
      customize: 'Anpassen',
      progress: {
        title: 'Gesamt-Fortschritt',
        description: '{{completed}} von {{total}} erforderlichen Schritten abgeschlossen',
        ready: 'Bereit',
        inProgress: 'In Bearbeitung'
      },
      congratulations: 'Glückwunsch! Ihr Restaurant ist bereit für Bestellungen.',
      basic: {
        title: 'Basis-Informationen',
        basicInfo: {
          title: 'Grunddaten',
          description: 'Restaurant-Name, Beschreibung und Kontaktdaten'
        },
        address: {
          title: 'Adresse',
          description: 'Vollständige Adresse für Kunden'
        },
        contact: {
          title: 'Kontakt',
          description: 'Telefon, E-Mail und Website'
        }
      },
      menu: {
        title: 'Speisekarte',
        categories: {
          title: 'Kategorien',
          description: 'Speisekarten-Kategorien anlegen'
        },
        items: {
          title: 'Speisen & Getränke',
          description: 'Mindestens 5 Artikel anlegen'
        }
      },
      operation: {
        title: 'Betrieb',
        tables: {
          title: 'Tische & QR-Codes',
          description: 'Tische anlegen und QR-Codes generieren'
        },
        hours: {
          title: 'Öffnungszeiten',
          description: 'Geschäftszeiten festlegen'
        },
        payment: {
          title: 'Zahlungsmethoden',
          description: 'Akzeptierte Zahlungsarten konfigurieren'
        }
      },
      advanced: {
        title: 'Erweiterte Einstellungen',
        design: {
          title: 'Design & Aussehen',
          description: 'Logo, Farben und Bilder'
        },
        staff: {
          title: 'Mitarbeiter',
          description: 'Team-Mitglieder hinzufügen'
        },
        notifications: {
          title: 'Benachrichtigungen',
          description: 'E-Mail und Sound-Benachrichtigungen'
        }
      },
      stats: {
        categoriesCreated: 'Kategorien angelegt',
        itemsCreated: 'Artikel angelegt',
        tablesCreated: 'Tische angelegt'
      },
      tips: {
        title: 'Tipps für den Start',
        tip1: 'Beginnen Sie mit den Grunddaten und arbeiten Sie sich nach unten vor',
        tip2: 'Laden Sie hochwertige Bilder Ihrer Speisen hoch - das erhöht die Bestellungen',
        tip3: 'Testen Sie den QR-Code Bestellvorgang selbst, bevor Sie live gehen',
        tip4: 'Schulen Sie Ihr Personal im Umgang mit dem System'
      },
      errors: {
        incompleteSteps: 'Bitte schließen Sie alle erforderlichen Schritte ab',
        activationFailed: 'Fehler beim Aktivieren'
      },
      success: {
        goLive: 'Restaurant ist jetzt live! 🎉'
      }
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Willkommen zurück',
      setupIncomplete: 'Restaurant-Einrichtung unvollständig',
      completed: 'abgeschlossen',
      setupDescription: 'Vervollständigen Sie die Einrichtung, damit Kunden bei Ihnen bestellen können.',
      missingBasicInfo: 'Grunddaten und Beschreibung fehlen',
      missingAddress: 'Adresse unvollständig',
      missingCategories: 'Keine Speisekarten-Kategorien angelegt',
      missingMenuItems: 'Weniger als 5 Artikel in der Speisekarte',
      missingTables: 'Keine Tische/QR-Codes angelegt',
      missingPaymentMethods: 'Zahlungsmethoden nicht konfiguriert',
      continueSetup: 'Einrichtung fortsetzen',
      trialVersion: 'Testversion',
      daysRemaining: 'Tage verbleibend',
      trialDescription: 'Ihre kostenlose Testversion endet in {{days}} Tagen. Upgraden Sie jetzt, um alle Features weiter zu nutzen.',
      upgradeNow: 'Jetzt upgraden',
      todayRevenue: 'Heutiger Umsatz',
      fromYesterday: 'zum Vortag',
      ordersToday: 'Bestellungen heute',
      pending: 'ausstehend',
      averageOrderValue: 'Durchschn. Bestellwert',
      today: 'Heute',
      activeTables: 'Aktive Tische',
      qrCodesGenerated: 'QR-Codes generiert',
      manage: 'Verwalten',
      items: 'Artikel',
      qrCodes: 'QR-Codes',
      tables: 'Tische',
      view: 'Ansehen',
      recentOrders: 'Letzte Bestellungen',
      viewAll: 'Alle anzeigen',
      order: 'Bestellung',
      table: 'Tisch',
      takeaway: 'Zum Mitnehmen',
      noOrdersToday: 'Noch keine Bestellungen heute',
      orderStatus: {
        pending: 'Ausstehend',
        confirmed: 'Bestätigt',
        preparing: 'In Zubereitung',
        ready: 'Fertig',
        completed: 'Abgeschlossen',
        cancelled: 'Storniert'
      }
    },
    // Orders
    orders: {
      title: 'Bestellungen',
      subtitle: 'Live-Übersicht aller eingehenden Bestellungen',
      liveOrders: 'Live Bestellungen',
      realtime: 'Echtzeit-Übersicht aller eingehenden Bestellungen',
      offline: 'Offline',
      noRealtime: 'Echtzeit-Updates nicht verfügbar - Seite manuell aktualisieren',
      newOrder: 'Neue Bestellung',
      newOrderDesc: 'Neue Bestellung von Tisch {{table}}',
      soundEnabled: 'Ton aktiviert',
      soundDisabled: 'Ton deaktiviert',
      filter: {
        all: 'Alle',
        pending: 'Ausstehend',
        confirmed: 'Bestätigt',
        preparing: 'In Zubereitung',
        ready: 'Fertig',
        delivered: 'Geliefert',
        cancelled: 'Storniert'
      },
      status: {
        pending: 'Ausstehend',
        confirmed: 'Bestätigt',
        preparing: 'In Zubereitung',
        ready: 'Fertig',
        delivered: 'Geliefert',
        cancelled: 'Storniert'
      },
      actions: {
        confirm: 'Bestätigen',
        startPreparing: 'Zubereitung starten',
        markReady: 'Fertig',
        markDelivered: 'Ausgeliefert',
        cancel: 'Stornieren',
        cancelConfirm: 'Bestellung wirklich stornieren?',
        cancelledByStaff: 'Vom Personal storniert'
      },
      table: 'Tisch',
      takeaway: 'Zum Mitnehmen',
      orderNumber: 'Bestellnummer',
      total: 'Gesamt',
      items: 'Artikel',
      time: 'Zeit',
      noOrders: 'Keine Bestellungen',
      noOrdersDesc: 'Noch keine Bestellungen. Neue Bestellungen werden hier automatisch angezeigt.'
    },
    // Settings
    settings: {
      title: 'Einstellungen',
      subtitle: 'Verwalten Sie Ihre Restaurant-Einstellungen',
      general: {
        title: 'Allgemeine Einstellungen',
        description: 'Restaurant-Informationen und Grundeinstellungen'
      },
      features: {
        title: 'Erweiterte Funktionen',
        description: 'Öffnungszeiten, Bilder und Benachrichtigungen'
      },
      pos: {
        title: 'POS-System Integration',
        description: 'Verbinden Sie Ihr Kassensystem mit Oriido'
      },
      design: {
        title: 'Design & Aussehen',
        description: 'Farben, Logo und Branding anpassen'
      },
      language: {
        title: 'Sprache & Region',
        description: 'Sprache, Währung und Zeitzone'
      },
      security: {
        title: 'Sicherheit',
        description: 'Passwörter und Zugriffsberechtigungen'
      },
      data: {
        title: 'Daten & Export',
        description: 'Datensicherung und Export-Optionen'
      }
    },
    // Common
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      delete: 'Löschen',
      edit: 'Bearbeiten',
      add: 'Hinzufügen',
      search: 'Suchen',
      filter: 'Filtern',
      loading: 'Laden...',
      noData: 'Keine Daten vorhanden',
      logout: 'Abmelden',
      profile: 'Profil',
      help: 'Hilfe',
      documentation: 'Dokumentation',
      support: 'Support kontaktieren'
    },
    // Profile
    profile: {
      title: 'Mein Profil',
      subtitle: 'Verwalten Sie Ihre persönlichen Informationen',
      personalInfo: 'Persönliche Informationen',
      updateInfo: 'Aktualisieren Sie Ihre persönlichen Daten',
      changePassword: 'Passwort ändern',
      currentPassword: 'Aktuelles Passwort',
      newPassword: 'Neues Passwort',
      confirmPassword: 'Passwort bestätigen',
      memberSince: 'Mitglied seit',
      role: 'Rolle',
      email: 'E-Mail',
      name: 'Name',
      phone: 'Telefon'
    }
  },
  en: {
    // Navigation
    nav: {
      dashboard: 'Overview',
      orders: 'Orders',
      menu: 'Menu',
      tables: 'Tables & QR',
      statistics: 'Statistics',
      staff: 'Staff',
      billing: 'Billing',
      settings: 'Settings',
      setup: 'Setup'
    },
    // Setup Page
    setup: {
      title: 'Setup Restaurant',
      subtitle: 'Complete setup to go online',
      goLive: 'Go Live Now!',
      completeSetup: 'Complete Setup',
      required: 'Required',
      optional: 'Optional',
      edit: 'Edit',
      setup: 'Setup',
      manage: 'Manage',
      create: 'Create',
      configure: 'Configure',
      customize: 'Customize',
      progress: {
        title: 'Overall Progress',
        description: '{{completed}} of {{total}} required steps completed',
        ready: 'Ready',
        inProgress: 'In Progress'
      },
      congratulations: 'Congratulations! Your restaurant is ready for orders.',
      basic: {
        title: 'Basic Information',
        basicInfo: {
          title: 'Basic Data',
          description: 'Restaurant name, description and contact details'
        },
        address: {
          title: 'Address',
          description: 'Complete address for customers'
        },
        contact: {
          title: 'Contact',
          description: 'Phone, email and website'
        }
      },
      menu: {
        title: 'Menu',
        categories: {
          title: 'Categories',
          description: 'Create menu categories'
        },
        items: {
          title: 'Food & Drinks',
          description: 'Add at least 5 items'
        }
      },
      operation: {
        title: 'Operations',
        tables: {
          title: 'Tables & QR Codes',
          description: 'Setup tables and generate QR codes'
        },
        hours: {
          title: 'Opening Hours',
          description: 'Set business hours'
        },
        payment: {
          title: 'Payment Methods',
          description: 'Configure accepted payment types'
        }
      },
      advanced: {
        title: 'Advanced Settings',
        design: {
          title: 'Design & Appearance',
          description: 'Logo, colors and images'
        },
        staff: {
          title: 'Staff',
          description: 'Add team members'
        },
        notifications: {
          title: 'Notifications',
          description: 'Email and sound notifications'
        }
      },
      stats: {
        categoriesCreated: 'categories created',
        itemsCreated: 'items created',
        tablesCreated: 'tables created'
      },
      tips: {
        title: 'Getting Started Tips',
        tip1: 'Start with basic data and work your way down',
        tip2: 'Upload high-quality images of your dishes - it increases orders',
        tip3: 'Test the QR code ordering process yourself before going live',
        tip4: 'Train your staff on using the system'
      },
      errors: {
        incompleteSteps: 'Please complete all required steps',
        activationFailed: 'Activation failed'
      },
      success: {
        goLive: 'Restaurant is now live! 🎉'
      }
    },
    // Dashboard
    dashboard: {
      title: 'Dashboard',
      welcome: 'Welcome back',
      setupIncomplete: 'Restaurant Setup Incomplete',
      completed: 'completed',
      setupDescription: 'Complete setup so customers can order from you.',
      missingBasicInfo: 'Basic data and description missing',
      missingAddress: 'Address incomplete',
      missingCategories: 'No menu categories created',
      missingMenuItems: 'Less than 5 items in menu',
      missingTables: 'No tables/QR codes created',
      missingPaymentMethods: 'Payment methods not configured',
      continueSetup: 'Continue Setup',
      trialVersion: 'Trial Version',
      daysRemaining: 'days remaining',
      trialDescription: 'Your free trial ends in {{days}} days. Upgrade now to continue using all features.',
      upgradeNow: 'Upgrade Now',
      todayRevenue: "Today's Revenue",
      fromYesterday: 'from yesterday',
      ordersToday: 'Orders Today',
      pending: 'pending',
      averageOrderValue: 'Average Order Value',
      today: 'Today',
      activeTables: 'Active Tables',
      qrCodesGenerated: 'QR codes generated',
      manage: 'Manage',
      items: 'items',
      qrCodes: 'QR Codes',
      tables: 'tables',
      view: 'View',
      recentOrders: 'Recent Orders',
      viewAll: 'View All',
      order: 'Order',
      table: 'Table',
      takeaway: 'Takeaway',
      noOrdersToday: 'No orders today yet',
      orderStatus: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
    },
    // Orders
    orders: {
      title: 'Orders',
      subtitle: 'Live overview of all incoming orders',
      liveOrders: 'Live Orders',
      realtime: 'Real-time overview of all incoming orders',
      offline: 'Offline',
      noRealtime: 'Real-time updates unavailable - refresh page manually',
      newOrder: 'New Order',
      newOrderDesc: 'New order from table {{table}}',
      soundEnabled: 'Sound enabled',
      soundDisabled: 'Sound disabled',
      filter: {
        all: 'All',
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      },
      status: {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      },
      actions: {
        confirm: 'Confirm',
        startPreparing: 'Start Preparing',
        markReady: 'Ready',
        markDelivered: 'Delivered',
        cancel: 'Cancel',
        cancelConfirm: 'Really cancel order?',
        cancelledByStaff: 'Cancelled by staff'
      },
      table: 'Table',
      takeaway: 'Takeaway',
      orderNumber: 'Order Number',
      total: 'Total',
      items: 'Items',
      time: 'Time',
      noOrders: 'No Orders',
      noOrdersDesc: 'No orders yet. New orders will appear here automatically.'
    },
    // Settings
    settings: {
      title: 'Settings',
      subtitle: 'Manage your restaurant settings',
      general: {
        title: 'General Settings',
        description: 'Restaurant information and basic settings'
      },
      features: {
        title: 'Advanced Features',
        description: 'Opening hours, images and notifications'
      },
      pos: {
        title: 'POS System Integration',
        description: 'Connect your POS system with Oriido'
      },
      design: {
        title: 'Design & Appearance',
        description: 'Customize colors, logo and branding'
      },
      language: {
        title: 'Language & Region',
        description: 'Language, currency and timezone'
      },
      security: {
        title: 'Security',
        description: 'Passwords and access permissions'
      },
      data: {
        title: 'Data & Export',
        description: 'Data backup and export options'
      }
    },
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      search: 'Search',
      filter: 'Filter',
      loading: 'Loading...',
      noData: 'No data available',
      logout: 'Logout',
      profile: 'Profile',
      help: 'Help',
      documentation: 'Documentation',
      support: 'Contact Support'
    },
    // Profile
    profile: {
      title: 'My Profile',
      subtitle: 'Manage your personal information',
      personalInfo: 'Personal Information',
      updateInfo: 'Update your personal data',
      changePassword: 'Change Password',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      memberSince: 'Member since',
      role: 'Role',
      email: 'Email',
      name: 'Name',
      phone: 'Phone'
    }
  },
  tr: {
    // Navigation
    nav: {
      dashboard: 'Genel Bakış',
      orders: 'Siparişler',
      menu: 'Menü',
      tables: 'Masalar & QR',
      statistics: 'İstatistikler',
      staff: 'Personel',
      billing: 'Faturalama',
      settings: 'Ayarlar'
    },
    // Dashboard
    dashboard: {
      title: 'Kontrol Paneli',
      welcome: 'Tekrar hoş geldiniz',
      todayOrders: 'Bugünkü Siparişler',
      revenue: 'Gelir',
      activeOrders: 'Aktif Siparişler',
      newOrders: 'Yeni Siparişler',
      preparingOrders: 'Hazırlanıyor',
      readyOrders: 'Hazır'
    },
    // Settings
    settings: {
      title: 'Ayarlar',
      subtitle: 'Restoran ayarlarınızı yönetin',
      general: {
        title: 'Genel Ayarlar',
        description: 'Restoran bilgileri ve temel ayarlar'
      },
      features: {
        title: 'Gelişmiş Özellikler',
        description: 'Açılış saatleri, görseller ve bildirimler'
      },
      pos: {
        title: 'POS Sistemi Entegrasyonu',
        description: 'POS sisteminizi Oriido ile bağlayın'
      },
      design: {
        title: 'Tasarım & Görünüm',
        description: 'Renkleri, logoyu ve markayı özelleştirin'
      },
      language: {
        title: 'Dil & Bölge',
        description: 'Dil, para birimi ve saat dilimi'
      },
      security: {
        title: 'Güvenlik',
        description: 'Şifreler ve erişim izinleri'
      },
      data: {
        title: 'Veri & Dışa Aktarma',
        description: 'Veri yedekleme ve dışa aktarma seçenekleri'
      }
    },
    // Common
    common: {
      save: 'Kaydet',
      cancel: 'İptal',
      delete: 'Sil',
      edit: 'Düzenle',
      add: 'Ekle',
      search: 'Ara',
      filter: 'Filtrele',
      loading: 'Yükleniyor...',
      noData: 'Veri yok',
      logout: 'Çıkış Yap',
      profile: 'Profil',
      help: 'Yardım',
      documentation: 'Dokümantasyon',
      support: 'Destek ile İletişim'
    },
    // Profile
    profile: {
      title: 'Profilim',
      subtitle: 'Kişisel bilgilerinizi yönetin',
      personalInfo: 'Kişisel Bilgiler',
      updateInfo: 'Kişisel verilerinizi güncelleyin',
      changePassword: 'Şifre Değiştir',
      currentPassword: 'Mevcut Şifre',
      newPassword: 'Yeni Şifre',
      confirmPassword: 'Şifreyi Onayla',
      memberSince: 'Üyelik tarihi',
      role: 'Rol',
      email: 'E-posta',
      name: 'İsim',
      phone: 'Telefon'
    }
  }
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.de