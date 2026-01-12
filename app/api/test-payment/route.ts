import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Simple test to check configuration
    const config = {
      stripe: {
        configured: !!process.env.STRIPE_SECRET_KEY,
        isTest: process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') || false,
        publicKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      },
      paytabs: {
        configured: !!process.env.PAYTABS_SERVER_KEY,
        isTest: process.env.PAYTABS_SERVER_KEY === 'SHJN6LRNBB-JGGLGDNLZT-BWTLZ69DRN',
        profileId: !!process.env.PAYTABS_PROFILE_ID
      }
    }
    
    return NextResponse.json({
      status: 'ok',
      config,
      env: process.env.NODE_ENV
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}