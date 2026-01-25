# Apple Pay Domain Verification

To enable Apple Pay, you need to:

1. Go to Stripe Dashboard: https://dashboard.stripe.com/settings/payment_methods
2. Find "Apple Pay" and click "Add new domain"
3. Enter your domain (e.g., oriido.de)
4. Download the verification file from Stripe
5. Replace this README with that file, naming it:
   `apple-developer-merchantid-domain-association`

The file should be accessible at:
https://your-domain.com/.well-known/apple-developer-merchantid-domain-association

Note: The verification file has no file extension - it's just the name above.
