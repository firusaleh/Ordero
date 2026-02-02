import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPOSAdapter } from '@/lib/pos-integrations'

// Vercel Cron Job configuration
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max

// This endpoint is called by Vercel Cron to sync POS menus
// Configure in vercel.json: "crons": [{ "path": "/api/cron/pos-sync", "schedule": "0 */6 * * *" }]
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // In production, require authorization
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log('[CRON] Starting POS menu sync...')

    // Find all restaurants with POS sync enabled
    const restaurantsWithPOS = await prisma.restaurant.findMany({
      where: {
        status: 'ACTIVE',
        settings: {
          posSyncEnabled: true,
          posSystem: { not: null },
          posApiKey: { not: null }
        }
      },
      include: {
        settings: true
      }
    })

    console.log(`[CRON] Found ${restaurantsWithPOS.length} restaurants with POS sync enabled`)

    const results = {
      total: restaurantsWithPOS.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    }

    for (const restaurant of restaurantsWithPOS) {
      const settings = restaurant.settings
      if (!settings?.posSystem || !settings?.posApiKey) {
        results.skipped++
        continue
      }

      try {
        console.log(`[CRON] Syncing menu for ${restaurant.name}...`)

        const adapter = getPOSAdapter(
          settings.posSystem,
          settings.posApiKey,
          settings.posRestaurantId || undefined
        )

        if (!adapter) {
          console.error(`[CRON] No adapter for POS system: ${settings.posSystem}`)
          results.failed++
          results.details.push({
            restaurant: restaurant.name,
            error: `Unsupported POS system: ${settings.posSystem}`
          })
          continue
        }

        // Sync menu
        const syncResult = await adapter.syncMenu()

        if (!syncResult.success) {
          console.error(`[CRON] Sync failed for ${restaurant.name}:`, syncResult.errors)
          results.failed++
          results.details.push({
            restaurant: restaurant.name,
            error: syncResult.errors.join(', ')
          })
          continue
        }

        // Process categories
        let categoriesCreated = 0
        let categoriesUpdated = 0

        if (syncResult.categories) {
          for (const posCategory of syncResult.categories) {
            if (!posCategory.name) continue

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
            } else {
              await prisma.category.update({
                where: { id: category.id },
                data: {
                  posId: posCategory.id || category.posId,
                  sortOrder: posCategory.sortOrder || category.sortOrder
                }
              })
              categoriesUpdated++
            }
          }
        }

        // Build category map
        const categoryMap = new Map<string, string>()
        const allCategories = await prisma.category.findMany({
          where: { restaurantId: restaurant.id },
          select: { id: true, name: true, posId: true }
        })

        for (const cat of allCategories) {
          if (cat.posId) categoryMap.set(cat.posId, cat.id)
          categoryMap.set(cat.name.toLowerCase(), cat.id)
        }

        // Process menu items
        let imported = 0
        let updated = 0

        if (syncResult.items) {
          for (const posItem of syncResult.items) {
            if (!posItem.name) continue

            // Find category
            let categoryId: string | null = null

            if (posItem.categoryId) {
              categoryId = categoryMap.get(posItem.categoryId) || null
            }

            if (!categoryId && posItem.categoryName) {
              categoryId = categoryMap.get(posItem.categoryName.toLowerCase()) || null
            }

            if (!categoryId && syncResult.categories && posItem.categoryId) {
              const posCategory = syncResult.categories.find(c => c.id === posItem.categoryId)
              if (posCategory?.name) {
                categoryId = categoryMap.get(posCategory.name.toLowerCase()) || null
              }
            }

            // Find or create item
            const orConditions: any[] = [{ name: posItem.name }]
            if (posItem.id) {
              orConditions.push({ posId: posItem.id })
            }

            const existingItem = await prisma.menuItem.findFirst({
              where: {
                restaurantId: restaurant.id,
                OR: orConditions
              }
            })

            if (existingItem) {
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
              // Create in "Sonstiges" category
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
            }
          }
        }

        // Update last sync timestamp
        await prisma.restaurantSettings.update({
          where: { restaurantId: restaurant.id },
          data: { posLastSync: new Date() }
        })

        results.success++
        results.details.push({
          restaurant: restaurant.name,
          imported,
          updated,
          categoriesCreated,
          categoriesUpdated
        })

        console.log(`[CRON] Sync complete for ${restaurant.name}: ${imported} imported, ${updated} updated`)

      } catch (error: any) {
        console.error(`[CRON] Error syncing ${restaurant.name}:`, error)
        results.failed++
        results.details.push({
          restaurant: restaurant.name,
          error: error.message || 'Unknown error'
        })
      }
    }

    console.log(`[CRON] POS sync complete. Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results
    })

  } catch (error: any) {
    console.error('[CRON] POS sync error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error.message },
      { status: 500 }
    )
  }
}
