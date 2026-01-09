import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Mock-Daten für Demo-Zwecke
const DEMO_MENU_ITEMS = [
  {
    category: 'Vorspeisen',
    items: [
      { name: 'Bruschetta', price: 7.50, description: 'Geröstetes Brot mit Tomaten und Basilikum' },
      { name: 'Caprese', price: 8.90, description: 'Mozzarella mit Tomaten und Basilikum' },
      { name: 'Antipasti Misti', price: 12.50, description: 'Gemischte italienische Vorspeisen' }
    ]
  },
  {
    category: 'Hauptgerichte',
    items: [
      { name: 'Pizza Margherita', price: 11.50, description: 'Mit Tomatensauce und Mozzarella' },
      { name: 'Pizza Salami', price: 13.50, description: 'Mit Tomatensauce, Mozzarella und Salami' },
      { name: 'Spaghetti Carbonara', price: 12.90, description: 'Mit Speck, Ei und Parmesan' },
      { name: 'Risotto ai Funghi', price: 14.50, description: 'Risotto mit frischen Pilzen' }
    ]
  },
  {
    category: 'Desserts',
    items: [
      { name: 'Tiramisu', price: 6.50, description: 'Hausgemachtes Tiramisu' },
      { name: 'Panna Cotta', price: 5.50, description: 'Mit Beerensauce' }
    ]
  }
]

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Finde Restaurant des Users
    const restaurant = await prisma.restaurant.findFirst({
      where: {
        OR: [
          { ownerId: session.user.id },
          { staff: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!restaurant) {
      return NextResponse.json({ error: 'Kein Restaurant zugeordnet' }, { status: 403 })
    }

    // Prüfe ob POS-System konfiguriert ist
    const settings = await prisma.restaurantSettings.findUnique({
      where: { restaurantId: restaurant.id },
      select: { posSystem: true, posApiKey: true }
    })

    if (!settings?.posSystem || !settings?.posApiKey) {
      return NextResponse.json(
        { error: 'Kein POS-System konfiguriert' },
        { status: 400 }
      )
    }

    let imported = 0
    let updated = 0

    // In einer echten Implementierung würde hier die POS-API aufgerufen
    // Für Demo-Zwecke importieren wir Mock-Daten
    
    for (const categoryData of DEMO_MENU_ITEMS) {
      // Erstelle oder finde Kategorie
      let category = await prisma.category.findFirst({
        where: {
          restaurantId: restaurant.id,
          name: categoryData.category
        }
      })

      if (!category) {
        category = await prisma.category.create({
          data: {
            restaurantId: restaurant.id,
            name: categoryData.category,
            sortOrder: DEMO_MENU_ITEMS.indexOf(categoryData)
          }
        })
      }

      // Importiere Artikel
      for (const itemData of categoryData.items) {
        const existingItem = await prisma.menuItem.findFirst({
          where: {
            restaurantId: restaurant.id,
            name: itemData.name
          }
        })

        if (existingItem) {
          // Aktualisiere existierenden Artikel
          await prisma.menuItem.update({
            where: { id: existingItem.id },
            data: {
              price: itemData.price,
              description: itemData.description,
              categoryId: category.id,
              posId: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          })
          updated++
        } else {
          // Erstelle neuen Artikel
          await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id,
              categoryId: category.id,
              name: itemData.name,
              description: itemData.description,
              price: itemData.price,
              isActive: true,
              isAvailable: true,
              posId: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          })
          imported++
        }
      }
    }

    // Speichere Sync-Zeitpunkt (würde normalerweise in separater Tabelle gespeichert)
    await prisma.restaurantSettings.update({
      where: { restaurantId: restaurant.id },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      imported,
      updated,
      total: imported + updated,
      message: `${imported} neue Artikel importiert, ${updated} aktualisiert`
    })
  } catch (error) {
    console.error('Menü-Sync Fehler:', error)
    return NextResponse.json(
      { error: 'Fehler beim Synchronisieren des Menüs' },
      { status: 500 }
    )
  }
}