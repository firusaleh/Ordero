import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test Datenbankverbindung
    const user = await prisma.user.findUnique({
      where: { email: 'demo@ordero.de' }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    // Test Passwort-Vergleich
    const isValid = await bcrypt.compare('demo123', user.password!)
    
    return NextResponse.json({
      userExists: true,
      passwordHash: user.password?.substring(0, 20) + '...',
      passwordValid: isValid,
      userId: user.id,
      role: user.role
    })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Database error',
      message: error.message,
      code: error.code
    }, { status: 500 })
  }
}