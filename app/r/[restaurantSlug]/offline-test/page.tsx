import { GuestLanguageProvider } from '@/contexts/guest-language-context'
import RestaurantOffline from '@/components/guest/restaurant-offline'

export default function OfflineTestPage() {
  const testRestaurant = {
    name: 'Test Restaurant',
    description: 'Dies ist ein Test',
    phone: '+49 123 456789',
    street: 'Teststraße 1',
    city: 'Berlin',
    postalCode: '12345',
    settings: {
      openingHours: JSON.stringify({
        monday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
        tuesday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
        wednesday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
        thursday: { isOpen: true, timeSlots: [{ open: '11:00', close: '22:00' }] },
        friday: { isOpen: true, timeSlots: [{ open: '11:00', close: '23:00' }] },
        saturday: { isOpen: true, timeSlots: [{ open: '11:00', close: '23:00' }] },
        sunday: { isOpen: false, timeSlots: [] }
      })
    }
  }

  return (
    <GuestLanguageProvider>
      <RestaurantOffline restaurant={testRestaurant} />
    </GuestLanguageProvider>
  )
}