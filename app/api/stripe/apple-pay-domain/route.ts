import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia' as any,
});

// GET - Check domain status
export async function GET(req: NextRequest) {
  try {
    // List all Apple Pay domains
    const domains = await stripe.applePayDomains.list({ limit: 10 });

    return NextResponse.json({
      domains: domains.data.map(d => ({
        id: d.id,
        domain: d.domain_name,
        livemode: d.livemode,
        created: new Date(d.created * 1000).toISOString()
      }))
    });
  } catch (error: any) {
    console.error('Error fetching Apple Pay domains:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Register a new domain
export async function POST(req: NextRequest) {
  try {
    const { domain } = await req.json();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const applePayDomain = await stripe.applePayDomains.create({
      domain_name: domain,
    });

    return NextResponse.json({
      success: true,
      id: applePayDomain.id,
      domain: applePayDomain.domain_name,
      livemode: applePayDomain.livemode
    });
  } catch (error: any) {
    console.error('Error registering Apple Pay domain:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
