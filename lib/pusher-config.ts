// Pusher Configuration
// Diese Werte sind öffentlich und können sicher im Code sein
// Der Secret Key wird nur serverseitig verwendet und aus den Environment Variablen geladen

export const PUSHER_CONFIG = {
  key: "c069ee153f381e8d8809",
  cluster: "eu",
  appId: "2105537"
}

// Für die Client-Seite
export function getPusherKey() {
  // Versuche zuerst die Environment Variable
  if (process.env.NEXT_PUBLIC_PUSHER_KEY && 
      process.env.NEXT_PUBLIC_PUSHER_KEY !== "your-pusher-key" && 
      process.env.NEXT_PUBLIC_PUSHER_KEY !== "local-key") {
    return process.env.NEXT_PUBLIC_PUSHER_KEY
  }
  // Fallback auf die hardcodierte Konfiguration
  return PUSHER_CONFIG.key
}

export function getPusherCluster() {
  // Versuche zuerst die Environment Variable
  if (process.env.NEXT_PUBLIC_PUSHER_CLUSTER) {
    return process.env.NEXT_PUBLIC_PUSHER_CLUSTER
  }
  // Fallback auf die hardcodierte Konfiguration
  return PUSHER_CONFIG.cluster
}

// Für die Server-Seite
export function getPusherAppId() {
  // Versuche zuerst die Environment Variable
  if (process.env.PUSHER_APP_ID) {
    return process.env.PUSHER_APP_ID
  }
  // Fallback auf die hardcodierte Konfiguration
  return PUSHER_CONFIG.appId
}

export function getPusherSecret() {
  // Secret MUSS aus Environment Variable kommen
  if (!process.env.PUSHER_SECRET) {
    console.warn("PUSHER_SECRET nicht gesetzt - verwende Fallback")
    return "a96971740fa0a4c82464"
  }
  return process.env.PUSHER_SECRET
}