# Pusher Configuration

## Environment Variables

Add these environment variables to your Vercel project:

```
PUSHER_APP_ID=2105537
NEXT_PUBLIC_PUSHER_KEY=c069ee153f381e8d8809
PUSHER_SECRET=a96971740fa0a4c82464
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

## Setup in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable above
4. Redeploy the application

## Features Enabled

- Real-time order updates
- Live dashboard notifications
- Order status changes
- New order alerts
- Table-specific updates

## Testing

After deployment, test the real-time features by:
1. Opening the dashboard in one browser
2. Placing an order from a guest page
3. Verify the order appears immediately in the dashboard