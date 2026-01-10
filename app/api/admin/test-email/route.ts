import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email-sendgrid'

export async function POST(request: NextRequest) {
  try {
    // Überprüfe Admin-Berechtigung
    const session = await auth()
    
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Nicht autorisiert' },
        { status: 403 }
      )
    }

    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail-Adresse fehlt' },
        { status: 400 }
      )
    }

    console.log('🔧 Testing email system...')
    console.log('SendGrid API Key exists:', !!process.env.SENDGRID_API_KEY)
    console.log('Sending test email to:', email)
    
    // Sende Test-E-Mail
    const result = await sendWelcomeEmail({
      email,
      name: 'Test User',
      restaurantName: 'Test Restaurant',
      password: 'TestPass123',
      loginUrl: 'https://www.oriido.com/login'
    })
    
    console.log('Email send result:', result)
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test-E-Mail wurde gesendet',
        details: {
          to: email,
          apiKeyExists: !!process.env.SENDGRID_API_KEY,
          fromEmail: process.env.EMAIL_FROM || 'info@oriido.com',
          result
        }
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'E-Mail konnte nicht gesendet werden',
        error: result.error,
        details: result.details,
        apiKeyExists: !!process.env.SENDGRID_API_KEY
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Ein Fehler ist aufgetreten',
        apiKeyExists: !!process.env.SENDGRID_API_KEY,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}