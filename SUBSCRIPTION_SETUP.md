# Subscription Setup Guide

This guide explains how to set up tiered subscriptions with Whop payments for your MemberMail application.

## Overview

The upgrade system allows users to purchase subscriptions through Whop's secure payment processing. The implementation includes:

- **Server Actions**: Secure checkout session creation in `lib/actions/create-checkout-session.ts`
- **Pricing Card Component**: Reusable card component in `components/upgrade/PricingCard.tsx`
- **Upgrade Page**: Main subscription page at `/upgrade`
- **Navigation**: Upgrade link in the sidebar with crown icon

## Step-by-Step Setup

### 1. Create Access Passes on Whop Dashboard

1. Go to [Whop Developer Dashboard](https://whop.com/dashboard/developer)
2. Navigate to the **Access Passes** tab
3. Create an access pass for each tier:
   - Click **"Create Access Pass"**
   - Name it (e.g., "Basic", "Pro", "Enterprise")
   - Configure the access settings
   - Click **"Save"**
4. Repeat for all tiers you want to offer

### 2. Create Pricing Plans

For each access pass you created:

1. Click on the access pass row in the table
2. Click **"Add Pricing"** button
3. Choose pricing type:
   - **Recurring**: For monthly/yearly subscriptions
   - **One-time**: For lifetime access
   - **Free**: For free tier
4. Set the price and billing cycle (e.g., $29/month)
5. Click **"Save"**

### 3. Copy Plan IDs and Access Pass IDs

For each access pass:

1. Click the **3 dots (⋮)** menu on the access pass row
2. Click **"Copy Access Pass ID"** (format: `prod_xxx`)
3. Click on the pricing plan card
4. Click the **3 dots (⋮)** menu on the pricing plan
5. Click **"Copy Plan ID"** (format: `plan_xxx`)

### 4. Configure Environment Variables

Create or update your `.env.local` file with the following variables:

```bash
# Whop API Configuration (Required)
NEXT_PUBLIC_WHOP_APP_ID="your_app_id_here"
WHOP_API_KEY="your_api_key_here"
NEXT_PUBLIC_WHOP_AGENT_USER_ID="your_agent_user_id_here"
NEXT_PUBLIC_WHOP_COMPANY_ID="your_company_id_here"

# Basic Tier (Example: $9/month)
NEXT_PUBLIC_BASIC_PLAN_ID="plan_xxx"
NEXT_PUBLIC_BASIC_ACCESS_PASS_ID="prod_xxx"

# Pro Tier (Example: $29/month)
NEXT_PUBLIC_PRO_PLAN_ID="plan_xxx"
NEXT_PUBLIC_PRO_ACCESS_PASS_ID="prod_xxx"

# Enterprise Tier (Example: $99/month)
NEXT_PUBLIC_ENTERPRISE_PLAN_ID="plan_xxx"
NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID="prod_xxx"
```

**Note:** Replace all `xxx` values with your actual IDs from the Whop dashboard.

### 5. Update Pricing Tiers in the Code

Edit `app/upgrade/page.tsx` to customize your pricing tiers:

```typescript
const pricingTiers = [
  {
    name: "Basic",
    price: "$9",
    period: "month",
    description: "Perfect for individuals getting started",
    features: [
      "Up to 500 email sends per month",
      "Basic email templates",
      // Add more features...
    ],
    planId: process.env.NEXT_PUBLIC_BASIC_PLAN_ID || "plan_basic_monthly",
    accessPassId: process.env.NEXT_PUBLIC_BASIC_ACCESS_PASS_ID || "prod_basic",
    buttonText: "Start with Basic",
  },
  // Add more tiers...
];
```

### 6. Test the Integration

1. Start your development server:
   ```powershell
   npm run dev
   ```

2. Navigate to `/upgrade` in your browser

3. Click on a **"Get Started"** button

4. The Whop payment modal should open

5. Complete a test purchase (use Whop's test mode if available)

## How It Works

### Payment Flow

1. **User clicks "Get Started"** on a pricing card
2. **Client calls server action** `createCheckoutSession(planId)`
3. **Server creates checkout session** with Whop SDK
4. **Client opens payment modal** using `iframeSdk.inAppPurchase()`
5. **User completes payment** in Whop's secure modal
6. **Success callback** redirects to dashboard or shows confirmation

### Architecture

```
┌─────────────────┐
│  Upgrade Page   │
│  (/upgrade)     │
└────────┬────────┘
         │
         ├─► PricingCard Component (Client)
         │   └─► Handles purchase button click
         │
         ├─► createCheckoutSession (Server Action)
         │   └─► Creates session with Whop SDK
         │
         └─► useIframeSdk (Whop React)
             └─► Opens payment modal
```

## Checking User Access

To check if a user has access to a specific tier:

```typescript
import { checkUserAccess } from "@/lib/actions/create-checkout-session";

// In your component or server action
const result = await checkUserAccess(process.env.NEXT_PUBLIC_PRO_ACCESS_PASS_ID!);

if (result.hasAccess) {
  // User has Pro access
} else {
  // Show upgrade prompt
}
```

## Webhooks (Optional)

To handle post-payment actions (e.g., send confirmation email, grant access):

1. Create a webhook endpoint in `app/api/webhook/route.ts`
2. Configure the webhook URL in your Whop dashboard
3. Validate webhook signatures using `makeWebhookValidator` from `@whop/api`

Example webhook handler:

```typescript
import { makeWebhookValidator, type PaymentWebhookData } from "@whop/api";
import { after } from "next/server";

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET!,
});

export async function POST(request: Request) {
  const webhook = await validateWebhook(request);

  if (webhook.action === "payment.succeeded") {
    after(handlePaymentSucceeded(webhook.data));
  }

  return new Response("OK", { status: 200 });
}

async function handlePaymentSucceeded(data: PaymentWebhookData) {
  // Grant user access, send email, update database, etc.
  console.log("Payment succeeded:", data);
}
```

## Customization

### Adding More Tiers

1. Create a new access pass on Whop
2. Add pricing plan(s) to it
3. Copy the IDs
4. Add environment variables
5. Add a new tier object to the `pricingTiers` array

### Changing Styling

The pricing cards use Tailwind CSS and can be customized in:
- `components/upgrade/PricingCard.tsx` - Individual card styling
- `app/upgrade/page.tsx` - Page layout and grid

### Adding Features

Edit the `features` array for each tier to add/remove feature descriptions.

## Troubleshooting

### "Whop SDK not initialized" Error

**Cause:** Missing or invalid environment variables

**Solution:** 
1. Check that all required env vars are set in `.env.local`
2. Restart your dev server after changing env vars
3. Verify the values are correct in your Whop dashboard

### Payment Modal Not Opening

**Cause:** Iframe SDK not properly initialized

**Solution:**
1. Ensure `<WhopApp>` wrapper exists in `app/layout.tsx`
2. Check that `@whop/react` package is installed
3. Verify you're calling `useIframeSdk()` in a client component

### "Plan not found" Error

**Cause:** Invalid plan ID

**Solution:**
1. Double-check the plan ID in Whop dashboard
2. Ensure the plan is published and active
3. Verify env variable is correctly set

## Security Best Practices

1. **Never expose API keys**: Use `WHOP_API_KEY` (server-only) vs `NEXT_PUBLIC_*` (client-safe)
2. **Validate on server**: Always create checkout sessions server-side
3. **Use webhooks**: Don't rely solely on client-side success callbacks
4. **Add rate limiting**: Protect your checkout endpoints from abuse

## Additional Resources

- [Whop API Documentation](https://docs.whop.com/)
- [Whop SDK Reference](https://docs.whop.com/sdk/overview)
- [Whop Payments Guide](https://docs.whop.com/apps/features/payments-and-payouts)
- [Whop Subscriptions Guide](https://docs.whop.com/apps/features/subscriptions)

## Support

If you encounter issues:

1. Check the [Whop Documentation](https://docs.whop.com/)
2. Review your Whop dashboard for any warnings
3. Check browser console for error messages
4. Contact Whop support at [support@whop.com](mailto:support@whop.com)
