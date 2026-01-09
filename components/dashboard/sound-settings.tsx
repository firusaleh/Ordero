'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX, Bell, BellOff, TestTube } from 'lucide-react'
import { useNotificationSound } from '@/lib/hooks/use-notification-sound'

export function SoundSettings() {
  const { isEnabled, volume, toggleSound, setVolume, testSound } = useNotificationSound()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Sound-Benachrichtigungen
        </CardTitle>
        <CardDescription>
          Erhalten Sie akustische Benachrichtigungen bei neuen Bestellungen
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sound aktivieren/deaktivieren */}
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="flex items-center gap-2">
            Sound-Benachrichtigungen
            {isEnabled ? (
              <Volume2 className="h-4 w-4 text-green-600" />
            ) : (
              <VolumeX className="h-4 w-4 text-gray-400" />
            )}
          </Label>
          <Switch
            id="sound-enabled"
            checked={isEnabled}
            onCheckedChange={toggleSound}
          />
        </div>

        {/* Lautstärke-Regler */}
        {isEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="volume" className="flex items-center justify-between">
                <span>Lautstärke</span>
                <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
              </Label>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <Slider
                  id="volume"
                  min={0}
                  max={100}
                  step={5}
                  value={[volume * 100]}
                  onValueChange={([value]) => setVolume(value / 100)}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Test-Button */}
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={testSound}
                className="w-full"
              >
                <TestTube className="h-4 w-4 mr-2" />
                Sound testen
              </Button>
            </div>

            {/* Hinweise */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Hinweise:
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Browser müssen Sound-Wiedergabe erlauben</li>
                <li>• Stelle sicher, dass dein Gerät nicht stummgeschaltet ist</li>
                <li>• Der erste Sound erfordert möglicherweise eine Benutzerinteraktion</li>
              </ul>
            </div>
          </>
        )}

        {/* Weitere Sound-Optionen */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium mb-3">Benachrichtigungstypen</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="new-order" className="text-sm font-normal">
                Neue Bestellungen
              </Label>
              <Switch id="new-order" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="order-cancel" className="text-sm font-normal">
                Stornierte Bestellungen
              </Label>
              <Switch id="order-cancel" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="low-stock" className="text-sm font-normal">
                Niedrige Lagerbestände
              </Label>
              <Switch id="low-stock" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}