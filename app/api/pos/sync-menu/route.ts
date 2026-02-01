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
    let categoriesCreated = 0
    let categoriesUpdated = 0

    // Verarbeite Kategorien
    console.log(`Processing ${syncResult.categories?.length || 0} categories from POS...`)

    // Log sample category for debugging
    if (syncResult.categories && syncResult.categories.length > 0) {
      console.log('Sample category from POS:', JSON.stringify(syncResult.categories[0], null, 2))
    }

    // Log sample item for debugging
    if (syncResult.items && syncResult.items.length > 0) {
      console.log('Sample item from POS:', JSON.stringify(syncResult.items[0], null, 2))
    }

    if (syncResult.categories) {
      for (const posCategory of syncResult.categories) {
        // Skip categories without name
        if (!posCategory.name) {
          console.warn('Skipping category without name:', posCategory)
          continue
        }

        console.log(`Processing category: ${posCategory.name} (posId: ${posCategory.id})`)

        // Build OR conditions - only include posId if it's defined
        const orConditions: any[] = [{ name: posCategory.name }]
        if (posCategory.id) {
          orConditions.push({ posId: posCategory.id })
        }

        let category = await prisma.category.findFirst({
          where: {
            restaurantId: restaurant.id,
            OR: orConditions
          }
        })

        if (!category) {
          category = await prisma.category.create({
            data: {
              restaurantId: restaurant.id,
              name: posCategory.name,
              posId: posCategory.id || null,
              sortOrder: posCategory.sortOrder || 0
            }
          })
          categoriesCreated++
          console.log(`Created new category: ${category.name} (id: ${category.id})`)
        } else {
          await prisma.category.update({
            where: { id: category.id },
            data: {
              posId: posCategory.id || category.posId,
              sortOrder: posCategory.sortOrder || category.sortOrder
            }
          })
          categoriesUpdated++
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
        // Skip items without name
        if (!posItem.name) {
          console.warn('Skipping item without name:', posItem)
          continue
        }

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

        // Build OR conditions - only include posId if it's defined
        const orConditions: any[] = [{ name: posItem.name }]
        if (posItem.id) {
          orConditions.push({ posId: posItem.id })
        }

        // Prüfe ob Item existiert
        const existingItem = await prisma.menuItem.findFirst({
          where: {
            restaurantId: restaurant.id,
            OR: orConditions
          }
        })

        if (existingItem) {
          // Aktualisiere existierenden Artikel
          await prisma.menuItem.update({
            where: { id: existingItem.id },
            data: {
              name: posItem.name,
              description: posItem.description || '',
              price: posItem.price || 0,
              categoryId: categoryId || existingItem.categoryId,
              posId: posItem.id || existingItem.posId,
              image: posItem.image || existingItem.image,
              isActive: posItem.isActive !== undefined ? posItem.isActive : true,
              isAvailable: posItem.isActive !== undefined ? posItem.isActive : true
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
              price: posItem.price || 0,
              posId: posItem.id || null,
              image: posItem.image || null,
              isActive: posItem.isActive !== undefined ? posItem.isActive : true,
              isAvailable: posItem.isActive !== undefined ? posItem.isActive : true
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
              price: posItem.price || 0,
              posId: posItem.id || null,
              image: posItem.image || null,
              isActive: posItem.isActive !== undefined ? posItem.isActive : true,
              isAvailable: posItem.isActive !== undefined ? posItem.isActive : true
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
      message: `${imported} neue Artikel importiert, ${updated} aktualisiert`,
      debug: {
        categoriesFromPOS: syncResult.categories?.length || 0,
        itemsFromPOS: syncResult.items?.length || 0,
        categoriesInDB: allCategories.length,
        categoriesCreated,
        categoriesUpdated,
        sampleCategory: syncResult.categories?.[0] || null,
        sampleItem: syncResult.items?.[0] || null,
        categoryMapSize: categoryMap.size
      }
    })
  } catch (error: any) {
    console.error('Menü-Sync Fehler:', error)
    return NextResponse.json(
      {
        error: 'Fehler beim Synchronisieren des Menüs',
        details: error?.message || String(error),
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}