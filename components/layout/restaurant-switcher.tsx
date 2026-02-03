'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Store } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { getUserRestaurants, switchRestaurant } from '@/app/actions/restaurants'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useLanguage } from '@/contexts/language-context'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo?: string | null
  country?: string | null
  language?: string | null
}

interface RestaurantSwitcherProps {
  currentRestaurantId?: string
}

export default function RestaurantSwitcher({ currentRestaurantId }: RestaurantSwitcherProps) {
  const [open, setOpen] = useState(false)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { setLanguage } = useLanguage()

  useEffect(() => {
    loadRestaurants()
  }, [])

  async function loadRestaurants() {
    try {
      const data = await getUserRestaurants()
      setRestaurants(data)
      
      // Setze das aktuelle Restaurant
      if (currentRestaurantId) {
        const current = data.find(r => r.id === currentRestaurantId)
        if (current) {
          setSelectedRestaurant(current)
          
          // Setze initiale Sprache basierend auf Restaurant
          if (current.country === 'JO' || current.language === 'ar') {
            setLanguage('ar')
          } else if (current.country === 'DE' || current.language === 'de') {
            setLanguage('de')
          } else if (current.language === 'en') {
            setLanguage('en')
          }
        }
      } else if (data.length > 0) {
        setSelectedRestaurant(data[0])
        
        // Setze initiale Sprache basierend auf erstem Restaurant
        if (data[0].country === 'JO' || data[0].language === 'ar') {
          setLanguage('ar')
        } else if (data[0].country === 'DE' || data[0].language === 'de') {
          setLanguage('de')
        } else if (data[0].language === 'en') {
          setLanguage('en')
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Restaurants:', error)
    }
  }

  async function handleSwitch(restaurant: Restaurant) {
    if (restaurant.id === selectedRestaurant?.id) {
      setOpen(false)
      return
    }

    setLoading(true)
    try {
      const result = await switchRestaurant(restaurant.id)
      setSelectedRestaurant(restaurant)
      
      // Automatisch Sprache basierend auf Land ändern
      if (result.country === 'JO' || result.language === 'ar') {
        setLanguage('ar')
      } else if (result.country === 'DE' || result.language === 'de') {
        setLanguage('de')
      } else if (result.language === 'en') {
        setLanguage('en')
      }
      
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Fehler beim Wechseln des Restaurants:', error)
    } finally {
      setLoading(false)
    }
  }

  if (restaurants.length <= 1) {
    // Zeige keinen Switcher wenn nur ein Restaurant
    return null
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[250px] justify-between"
          disabled={loading}
        >
          <div className="flex items-center">
            {selectedRestaurant?.logo ? (
              <Avatar className="h-6 w-6 mr-2">
                <AvatarImage src={selectedRestaurant.logo} />
                <AvatarFallback>
                  <Store className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Store className="h-4 w-4 mr-2" />
            )}
            <span className="truncate">
              {selectedRestaurant?.name || 'Restaurant wählen...'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Restaurant suchen..." />
          <CommandList>
            <CommandEmpty>Kein Restaurant gefunden.</CommandEmpty>
            <CommandGroup>
              {restaurants.map((restaurant) => (
                <CommandItem
                  key={restaurant.id}
                  onSelect={() => handleSwitch(restaurant)}
                >
                  <div className="flex items-center w-full">
                    {restaurant.logo ? (
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={restaurant.logo} />
                        <AvatarFallback>
                          <Store className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Store className="h-4 w-4 mr-2" />
                    )}
                    <span className="truncate">{restaurant.name}</span>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        selectedRestaurant?.id === restaurant.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}