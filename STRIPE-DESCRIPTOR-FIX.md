# Stripe Statement Descriptor Fix

## Problem
Bank statements show "Oriido Setup F" or "ORIIDO SANDBOX" instead of the restaurant name.

## Root Cause
The Stripe platform account has a default statement descriptor set to "ORIIDO SANDBOX" or similar. This appears on all payments unless explicitly overridden.

## Solution

### Option 1: Fix in Stripe Dashboard (Recommended)

1. **Login to Stripe Dashboard** with your platform account (not connected account)
2. Go to **Settings** → **Business settings** → **Public business information**
3. Find the **Statement descriptor** field
4. Change it from "ORIIDO SANDBOX" or "ORIIDO SETUP F" to just **"ORIIDO"**
5. Save the changes

**Note**: The statement descriptor:
- Must be 5-22 characters
- Can only contain letters, numbers, spaces, and periods
- No special characters allowed
- Will appear in ALL CAPS on bank statements

### Option 2: Code Override (Already Implemented)

We've updated the code to explicitly set the statement descriptor on every payment:

```typescript
statement_descriptor: 'ORIIDO',
statement_descriptor_suffix: cleanRestaurantName
```

This will show as: **"ORIIDO* RESTAURANTNAME"** on bank statements.

### How It Works

1. **Platform Payments (Direct)**: Shows as "ORIIDO* [Restaurant Name]"
2. **Connected Account Payments**: Shows as "ORIIDO* [Restaurant Name]"
3. **Table Number**: Added to the suffix when available (e.g., "ORIIDO* DEMO T1")

### Testing

Run this command to verify current settings:
```bash
node scripts/test-stripe-descriptor.js
```

This will show:
- Current platform account descriptor
- Test payment intents with different descriptors
- Recommendations for fixes

### Important Notes

1. **Descriptor changes may take 1-2 days** to appear on actual bank statements
2. **Test mode payments** may show different descriptors than live payments
3. **Connected accounts** inherit the platform descriptor unless overridden
4. **Maximum suffix length** is 10 characters (automatically truncated)

### Verification Steps

After making changes:
1. Create a test payment
2. Check the Stripe Dashboard payment details
3. Look for "Statement descriptor" in the payment details
4. Should show "ORIIDO* [Restaurant Name]"

### For Production

Before going live:
1. Set the platform account descriptor to "ORIIDO" (no suffix)
2. Test with a real card (small amount)
3. Wait 1-2 days for bank statement
4. Verify correct descriptor appears