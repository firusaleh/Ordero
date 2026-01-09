#!/usr/bin/env node
/**
 * Environment Variables Validation Script
 * Überprüft ob alle erforderlichen Umgebungsvariablen gesetzt sind
 */

import { z } from 'zod'
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'

// Lade Environment Variables
const envPath = process.env.NODE_ENV === 'production' 
  ? '.env.production' 
  : '.env.local'

const envFile = path.join(process.cwd(), envPath)

if (!existsSync(envFile)) {
  console.error(`❌ ${envPath} Datei nicht gefunden!`)
  console.log(`📝 Bitte kopieren Sie .env.${process.env.NODE_ENV === 'production' ? 'production' : 'local'}.example zu ${envPath}`)
  process.exit(1)
}

dotenv.config({ path: envFile })

// Definiere Schema für Environment Variables
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL ist erforderlich'),
  
  // NextAuth
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET muss mindestens 32 Zeichen lang sein'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL muss eine gültige URL sein'),
  
  // Email
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY ist erforderlich'),
  RESEND_FROM_EMAIL: z.string().email('RESEND_FROM_EMAIL muss eine gültige E-Mail sein'),
  
  // Stripe (nur in Production erforderlich)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Optional: Rate Limiting
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  
  // Optional: Pusher
  NEXT_PUBLIC_PUSHER_KEY: z.string().optional(),
  PUSHER_APP_ID: z.string().optional(),
  PUSHER_SECRET: z.string().optional(),
  
  // Application
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

// Production-spezifische Requirements
const productionSchema = envSchema.extend({
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY ist in Production erforderlich'),
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY ist in Production erforderlich'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET ist in Production erforderlich'),
  UPSTASH_REDIS_REST_URL: z.string().url('UPSTASH_REDIS_REST_URL ist in Production erforderlich'),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1, 'UPSTASH_REDIS_REST_TOKEN ist in Production erforderlich'),
})

// Validiere Environment Variables
try {
  const schema = process.env.NODE_ENV === 'production' ? productionSchema : envSchema
  const env = schema.parse(process.env)
  
  console.log('✅ Environment Variables Validierung erfolgreich!')
  console.log('\n📋 Geladene Konfiguration:')
  console.log(`   - Umgebung: ${env.NODE_ENV}`)
  console.log(`   - Datenbank: ${env.DATABASE_URL.substring(0, 20)}...`)
  console.log(`   - NextAuth URL: ${env.NEXTAUTH_URL}`)
  console.log(`   - E-Mail Service: ${env.RESEND_FROM_EMAIL}`)
  
  if (env.STRIPE_SECRET_KEY) {
    console.log(`   - Stripe: ✅ Konfiguriert`)
  } else {
    console.log(`   - Stripe: ⏭️  Übersprungen (Development)`)
  }
  
  if (env.UPSTASH_REDIS_REST_URL) {
    console.log(`   - Rate Limiting: ✅ Aktiviert`)
  } else {
    console.log(`   - Rate Limiting: ⚠️  Deaktiviert`)
  }
  
  if (env.NEXT_PUBLIC_PUSHER_KEY) {
    console.log(`   - Real-time Updates: ✅ Aktiviert`)
  } else {
    console.log(`   - Real-time Updates: ⚠️  Deaktiviert`)
  }
  
  // Warnungen für fehlende optionale Services
  const warnings = []
  
  if (!env.UPSTASH_REDIS_REST_URL && process.env.NODE_ENV === 'production') {
    warnings.push('⚠️  Rate Limiting ist in Production dringend empfohlen!')
  }
  
  if (!env.NEXT_PUBLIC_PUSHER_KEY) {
    warnings.push('ℹ️  Real-time Updates sind deaktiviert')
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnungen:')
    warnings.forEach(w => console.log(`   ${w}`))
  }
  
  console.log('\n✅ Alle erforderlichen Environment Variables sind korrekt gesetzt!')
  
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('\n❌ Environment Variables Validierung fehlgeschlagen!\n')
    console.error('Folgende Probleme wurden gefunden:')
    
    error.errors.forEach((err, index) => {
      console.error(`\n${index + 1}. ${err.path.join('.')}:`)
      console.error(`   ❌ ${err.message}`)
    })
    
    console.error('\n📝 Bitte überprüfen Sie Ihre .env Datei und stellen Sie sicher, dass alle erforderlichen Variablen gesetzt sind.')
    process.exit(1)
  }
  
  throw error
}

// Zusätzliche Sicherheitsprüfungen
function performSecurityChecks() {
  const issues = []
  
  // Prüfe NEXTAUTH_SECRET Stärke
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    issues.push('NEXTAUTH_SECRET sollte mindestens 32 Zeichen lang sein')
  }
  
  // Prüfe Production URLs
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXTAUTH_URL?.includes('localhost')) {
      issues.push('NEXTAUTH_URL sollte in Production keine localhost URL sein')
    }
    
    if (process.env.NEXT_PUBLIC_APP_URL?.includes('localhost')) {
      issues.push('NEXT_PUBLIC_APP_URL sollte in Production keine localhost URL sein')
    }
    
    // Prüfe Stripe Keys
    if (process.env.STRIPE_SECRET_KEY?.startsWith('sk_test')) {
      issues.push('⚠️  Verwenden Sie Test Stripe Keys in Production!')
    }
  }
  
  if (issues.length > 0) {
    console.log('\n🔒 Sicherheitsprüfung:')
    issues.forEach(issue => console.log(`   ⚠️  ${issue}`))
  }
}

performSecurityChecks()

export {}