# PayTabs Configuration Guide

## Overview
Oriido supports multi-region payment processing with automatic provider selection:
- **Europe (DE, AT, CH, etc.)**: Stripe
- **Middle East (JO, SA, AE, KW, BH, QA, OM, EG)**: PayTabs
- **Fallback**: If PayTabs is not configured, Stripe will be used for all regions

## Current Status
PayTabs integration is ready but requires real API credentials to activate.

## How to Enable PayTabs

### 1. Create a PayTabs Account
1. Go to [PayTabs](https://www.paytabs.com)
2. Sign up for a merchant account
3. Choose the appropriate region (Saudi Arabia, UAE, Jordan, etc.)

### 2. Get Your API Credentials
1. Log into your PayTabs dashboard
2. Navigate to **Developers** → **API Keys**
3. Copy the following:
   - Profile ID
   - Server Key
   - Client Key

### 3. Update Environment Variables
Edit `.env.local` and replace the placeholder values:

```env
# PayTabs (für Naher Osten)
PAYTABS_PROFILE_ID="your-actual-profile-id"
PAYTABS_SERVER_KEY="your-actual-server-key"
PAYTABS_CLIENT_KEY="your-actual-client-key"
PAYTABS_BASE_URL="https://secure.paytabs.com"
```

### 4. Test the Integration
1. Restart the development server: `npm run dev`
2. Create or edit a restaurant to a Middle East country (e.g., Jordan)
3. Place a test order and proceed to checkout
4. The system should now use PayTabs for payment processing

## Supported Countries
PayTabs will automatically be used for restaurants in:
- 🇯🇴 Jordan (JO)
- 🇸🇦 Saudi Arabia (SA)
- 🇦🇪 United Arab Emirates (AE)
- 🇰🇼 Kuwait (KW)
- 🇧🇭 Bahrain (BH)
- 🇶🇦 Qatar (QA)
- 🇴🇲 Oman (OM)
- 🇪🇬 Egypt (EG)

## Troubleshooting

### "PayTabs ist noch nicht konfiguriert. Verwende Stripe als Alternative."
This message appears when:
- PayTabs credentials are missing or invalid
- The placeholder test credentials are still in use

Solution: Add real PayTabs API credentials to `.env.local`

### Payment stuck at "Preparing payment..."
Check the browser console and server logs for errors. Common issues:
- Invalid API credentials
- PayTabs account not activated
- Wrong region selected in PayTabs account

## Testing Without PayTabs
The system will automatically fall back to Stripe if PayTabs is not configured. This allows you to test the application without PayTabs credentials, but Middle East restaurants will use Stripe instead of the preferred regional provider.

## Production Deployment
For production:
1. Use production PayTabs credentials (not test keys)
2. Set up PayTabs webhooks for payment confirmations
3. Configure proper return URLs in PayTabs dashboard
4. Enable appropriate payment methods (cards, Apple Pay, local wallets)

## Support
- PayTabs Documentation: https://www.paytabs.com/en/developers/
- PayTabs Support: support@paytabs.com