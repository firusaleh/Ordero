import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getPOSAdapter } from '@/lib/pos-integrations'

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
      select: { 
        posSystem: true, 
        posApiKey: true, 
        posRestaurantId: true,
        posSyncEnabled: true 
      }
    })

    if (!settings?.posSystem || !settings?.posApiKey) {
      return NextResponse.json(
        { error: 'Kein POS-System konfiguriert' },
        { status: 400 }
      )
    }

    // Verwende den POS Adapter
    const adapter = getPOSAdapter(
      settings.posSystem,
      settings.posApiKey,
      settings.posRestaurantId || undefined
    )

    if (!adapter) {
      return NextResponse.json(
        { error: `POS-System '${settings.posSystem}' wird nicht unterstützt` },
        { status: 400 }
      )
    }

    // Führe Menü-Sync durch
    console.log('Starting menu sync from POS system...')
    const syncResult = await adapter.syncMenu()

    console.log('Sync result:', {
      success: syncResult.success,
      categoriesCount: syncResult.categories?.length || 0,
      itemsCount: syncResult.items?.length || 0,
      errors: syncResult.errors
    })

    if (!syncResult.success) {
      return NextResponse.json(
        { error: 'Menü-Synchronisation fehlgeschlagen', details: syncResult.errors },
        { status: 500 }
      )
    }

    let imported = 0
    let updated = 0

    // Verarbeite Kategorien
    console.log(`Processing ${syncResult.categories?.length || 0} categories from POS...`)

    if (syncResult.categories) {
      for (const posCategory of syncResult.categories) {
        console.log(`Processing category: ${posCategory.name} (posId: ${posCategory.id})`)

        let category = await prisma.category.findFirst({
          where: {
            restaurantId: restaurant.id,
            OR: [
              { posId: posCategory.id },
              { name: posCategory.name }
            ]
          }
        })

        if (!category) {
          category = await prisma.category.create({
            data: {
              restaurantId: restaurant.id,
              name: posCategory.name,
              posId: posCategory.id,
              sortOrder: posCategory.sortOrder
            }
          })
          console.log(`Created new category: ${category.name} (id: ${category.id})`)
        } else {
          await prisma.category.update({
            where: { id: category.id },
            data: {
              posId: posCategory.id,
              sortOrder: posCategory.sortOrder
            }
          })
          console.log(`Updated existing category: ${category.name} (id: ${category.id})`)
        }
      }
    }

    // Build a map of categories for quick lookup (by posId and name)
    const categoryMap = new Map<string, string>() // posId/name -> categoryId
    const allCategories = await prisma.category.findMany({
      where: { restaurantId: restaurant.id },
      select: { id: true, name: true, posId: true }
    })

    for (const cat of allCategories) {
      if (cat.posId) categoryMap.set(cat.posId, cat.id)
      categoryMap.set(cat.name.toLowerCase(), cat.id)
    }

    console.log(`Category map built with ${categoryMap.size} entries`)

    // Verarbeite Menü-Items
    if (syncResult.items) {
      for (const posItem of syncResult.items) {
        // Find category by posId first, then by name from the POS category data
        let categoryId: string | null = null

        if (posItem.categoryId) {
          categoryId = categoryMap.get(posItem.categoryId) || null
        }

        // If not found by posId, try to find by matching category name
        if (!categoryId && syncResult.categories) {
          const posCategory = syncResult.categories.find(c => c.id === posItem.categoryId)
          if (posCategory?.name) {
            categoryId = categoryMap.get(posCategory.name.toLowerCase()) || null
          }
        }

        // Prüfe ob Item existiert
        const existingItem = await prisma.menuItem.findFirst({
          where: {
            restaurantId: restaurant.id,
            OR: [
              { posId: posItem.id },
              { name: posItem.name }
            ]
          }
        })

        if (existingItem) {
          // Aktualisiere existierenden Artikel
          await prisma.menuItem.update({
            where: { id: existingItem.id },
            data: {
              name: posItem.name,
              description: posItem.description || '',
              price: posItem.price,
              categoryId: categoryId || existingItem.categoryId,
              posId: posItem.id,
              image: posItem.image,
              isActive: posItem.isActive,
              isAvailable: posItem.isActive
            }
          })
          updated++
        } else if (categoryId) {
          // Erstelle neuen Artikel mit gefundener Kategorie
          await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id,
              categoryId: categoryId,
              name: posItem.name,
              description: posItem.description || '',
              price: posItem.price,
              posId: posItem.id,
              image: posItem.image || undefined,
              isActive: posItem.isActive,
              isAvailable: posItem.isActive
            }
          })
          imported++
        } else {
          // Erstelle "Sonstiges" Kategorie falls nötig und füge Item dort ein
          let defaultCategory = await prisma.category.findFirst({
            where: {
              restaurantId: restaurant.id,
              name: 'Sonstiges'
            }
          })

          if (!defaultCategory) {
            defaultCategory = await prisma.category.create({
              data: {
                restaurantId: restaurant.id,
                name: 'Sonstiges',
                sortOrder: 999
              }
            })
            console.log('Created default category "Sonstiges"')
          }

          await prisma.menuItem.create({
            data: {
              restaurantId: restaurant.id,
              categoryId: defaultCategory.id,
              name: posItem.name,
              description: posItem.description || '',
              price: posItem.price,
              posId: posItem.id,
              image: posItem.image || undefined,
              isActive: posItem.isActive,
              isAvailable: posItem.isActive
            }
          })
          imported++
          console.log(`Artikel ${posItem.name} in "Sonstiges" erstellt (keine Kategorie im POS)`)
        }

        // TODO: Verarbeite Varianten und Extras
        // Dies würde in einer vollständigen Implementierung
        // die Varianten und Extras in separate Tabellen speichern
      }
    }

    // Speichere Sync-Zeitpunkt
    await prisma.restaurantSettings.update({
      where: { restaurantId: restaurant.id },
      data: { 
        posLastSync: new Date(),
        posSyncEnabled: true
      }
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