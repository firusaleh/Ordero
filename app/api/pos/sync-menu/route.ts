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
    const syncResult = await adapter.syncMenu()

    if (!syncResult.success) {
      return NextResponse.json(
        { error: 'Menü-Synchronisation fehlgeschlagen', details: syncResult.errors },
        { status: 500 }
      )
    }

    let imported = 0
    let updated = 0

    // Verarbeite Kategorien
    if (syncResult.categories) {
      for (const posCategory of syncResult.categories) {
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
        } else {
          await prisma.category.update({
            where: { id: category.id },
            data: {
              posId: posCategory.id,
              sortOrder: posCategory.sortOrder
            }
          })
        }
      }
    }

    // Verarbeite Menü-Items
    if (syncResult.items) {
      for (const posItem of syncResult.items) {
        // Finde Kategorie
        const category = posItem.categoryId 
          ? await prisma.category.findFirst({
              where: {
                restaurantId: restaurant.id,
                posId: posItem.categoryId
              }
            })
          : null

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

        const itemData = {
          name: posItem.name,
          description: posItem.description || '',
          price: posItem.price,
          categoryId: category?.id,
          posId: posItem.id,
          image: posItem.image,
          isActive: posItem.isActive,
          isAvailable: posItem.isActive
        }

        if (existingItem) {
          // Aktualisiere existierenden Artikel
          await prisma.menuItem.update({
            where: { id: existingItem.id },
            data: itemData
          })
          updated++
        } else {
          // Erstelle neuen Artikel
          await prisma.menuItem.create({
            data: {
              ...itemData,
              restaurantId: restaurant.id
            }
          })
          imported++
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