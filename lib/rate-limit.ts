import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Erstelle Redis Client
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Rate Limiter für API Endpoints
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
      analytics: true,
      prefix: '@upstash/ratelimit',
    })
  : null

// Rate Limiter für Auth Endpoints (strenger)
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 requests per 15 minutes
      analytics: true,
      prefix: '@upstash/ratelimit/auth',
    })
  : null

// Rate Limiter für Order Endpoints
export const orderRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 orders per minute
      analytics: true,
      prefix: '@upstash/ratelimit/order',
    })
  : null

// Rate Limiter für Stripe Webhooks
export const webhookRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 webhook calls per minute
      analytics: true,
      prefix: '@upstash/ratelimit/webhook',
    })
  : null

// Helper function für Rate Limiting
export async function checkRateLimit(
  rateLimiter: Ratelimit | null,
  identifier: string
) {
  if (!rateLimiter) {
    // Falls kein Redis konfiguriert ist, erlaube alle Requests (für Development)
    return { success: true, limit: 0, reset: 0, remaining: 0 }
  }

  const { success, limit, reset, remaining } = await rateLimiter.limit(identifier)
  
  return {
    success,
    limit,
    reset,
    remaining,
  }
}

// IP-Adresse extrahieren
export function getIpAddress(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp.trim()
  }
  
  return 'unknown'
}