# Upgrade Page Feature

## Overview

This feature adds a complete subscription/payment system to your MemberMail application using Whop's payment infrastructure. Users can choose from tiered subscription plans and pay securely through Whop's native payment modal.

## What Was Added

### 1. Core Files

- **`lib/actions/create-checkout-session.ts`** - Server actions for secure checkout session creation
- **`components/upgrade/PricingCard.tsx`** - Reusable pricing card component with purchase functionality
- **`app/upgrade/page.tsx`** - Main upgrade page displaying all pricing tiers
- **`app/upgrade/success/page.tsx`** - Success page shown after purchase
- **`lib/utils/subscription-guard.tsx`** - Helper for gating content by subscription tier

### 2. Navigation Updates

- Added "Upgrade" link to `AppSidebar.tsx` with crown icon
- Added upgrade banner to dashboard page (`app/dashboard/[companyId]/page.tsx`)
- Special styling (gold/yellow color) for the upgrade link

### 3. Documentation

- **`SUBSCRIPTION_SETUP.md`** - Complete setup guide with step-by-step instructions
- **`UPGRADE_FEATURE_README.md`** - This file, feature overview

## Quick Start

### 1. Set Up Whop Dashboard

```bash
# Visit https://whop.com/dashboard/developer
# Create access passes for each tier (Basic, Pro, Enterprise)
# Create pricing plans for each access pass
# Copy the plan IDs and access pass IDs
```

### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Basic Tier
NEXT_PUBLIC_BASIC_PLAN_ID="plan_xxx"
NEXT_PUBLIC_BASIC_ACCESS_PASS_ID="prod_xxx"

# Pro Tier
NEXT_PUBLIC_PRO_PLAN_ID="plan_xxx"
NEXT_PUBLIC_PRO_ACCESS_PASS_ID="prod_xxx"

# Enterprise Tier
NEXT_PUBLIC_ENTERPRISE_PLAN_ID="plan_xxx"
NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID="prod_xxx"
```

### 3. Test the Feature

```powershell
# Start the dev server
npm run dev

# Navigate to http://localhost:3000/upgrade
# Click on a pricing tier's "Get Started" button
# Whop's payment modal should open
```

## Feature Highlights

### 🎨 Beautiful UI
- Modern gradient backgrounds
- Responsive grid layout for pricing cards
- "Popular" badge for featured tier
- Visual hierarchy with icons and colors

### 🔒 Secure Payments
- Server-side checkout session creation
- Whop's PCI-compliant payment processing
- No sensitive data handled in client code

### 🛠️ Developer-Friendly
- TypeScript throughout
- Detailed code comments
- Reusable components
- Clear separation of concerns

### 📱 Responsive Design
- Mobile-first approach
- Adapts to all screen sizes
- Touch-friendly buttons

## Usage Examples

### Basic Usage - Display Pricing Page

The pricing page at `/upgrade` automatically displays all tiers:

```tsx
// Users can navigate to /upgrade or click the sidebar link
// The page renders all pricing tiers with purchase buttons
```

### Gating Content by Subscription

```tsx
// app/premium-feature/page.tsx
import { SubscriptionGuard } from "@/lib/utils/subscription-guard";

export default function PremiumFeaturePage() {
  return (
    <SubscriptionGuard 
      accessPassId={process.env.NEXT_PUBLIC_PRO_ACCESS_PASS_ID!}
      tierName="Pro"
    >
      <div>
        <h1>Premium Feature</h1>
        <p>This content is only visible to Pro subscribers</p>
      </div>
    </SubscriptionGuard>
  );
}
```

### Checking Access in Server Actions

```tsx
import { checkUserAccess } from "@/lib/actions/create-checkout-session";

export async function myServerAction() {
  const result = await checkUserAccess(
    process.env.NEXT_PUBLIC_PRO_ACCESS_PASS_ID!
  );
  
  if (!result.hasAccess) {
    return { error: "Pro subscription required" };
  }
  
  // Proceed with premium feature logic...
}
```

### Custom Pricing Tiers

Edit `app/upgrade/page.tsx` to customize tiers:

```tsx
const pricingTiers = [
  {
    name: "Starter",           // Display name
    price: "$5",               // Price string
    period: "month",           // Billing period
    description: "...",        // Short description
    features: [...],           // Array of feature strings
    planId: "...",            // Whop plan ID
    accessPassId: "...",      // Whop access pass ID
    popular: true,            // Optional: marks as popular
    buttonText: "Get Started" // Optional: custom button text
  },
  // Add more tiers...
];
```

## Architecture

### Payment Flow

```
User clicks "Get Started"
    ↓
PricingCard.handlePurchase()
    ↓
createCheckoutSession() [Server Action]
    ↓
Whop SDK creates session
    ↓
Returns session to client
    ↓
iframeSdk.inAppPurchase(session)
    ↓
Whop payment modal opens
    ↓
User completes payment
    ↓
Redirect to /upgrade/success
```

### Component Structure

```
app/upgrade/page.tsx (Server)
    ├─► PricingCard.tsx (Client)
    │       ├─► useIframeSdk() [Whop React]
    │       └─► createCheckoutSession() [Server Action]
    │               └─► whopSdk.payments.createCheckoutSession()
    │
    └─► FAQ and Setup Instructions
```

## Customization Guide

### Changing Colors

The upgrade link uses gold/yellow to stand out. To change:

```tsx
// components/AppSidebar.tsx
className={isHighlight ? "text-yellow-500 hover:text-yellow-600" : ""}
// Change to your preferred color
```

### Adding More Tiers

1. Create access pass on Whop
2. Create pricing plan(s)
3. Add environment variables
4. Add tier object to `pricingTiers` array

### Modifying Success Page

Edit `app/upgrade/success/page.tsx` to:
- Change success message
- Add custom actions
- Track analytics events
- Send to different page

### Styling Pricing Cards

The `PricingCard` component uses Tailwind CSS:

```tsx
// components/upgrade/PricingCard.tsx
<Card className={`...your custom classes`}>
```

## Webhooks (Advanced)

To handle post-payment events:

```tsx
// app/api/webhook/route.ts
import { makeWebhookValidator } from "@whop/api";

const validateWebhook = makeWebhookValidator({
  webhookSecret: process.env.WHOP_WEBHOOK_SECRET!,
});

export async function POST(request: Request) {
  const webhook = await validateWebhook(request);
  
  if (webhook.action === "payment.succeeded") {
    // Grant access, send email, update DB, etc.
  }
  
  return new Response("OK", { status: 200 });
}
```

## Testing

### Test Mode (Recommended)

1. Use Whop's test mode in dashboard
2. Use test card numbers provided by Whop
3. Verify payment flow without real charges

### Production Testing

1. Create a low-cost test plan ($0.50)
2. Complete a real purchase
3. Verify access is granted
4. Test refund flow

## Troubleshooting

### Modal Not Opening

**Check:**
- `<WhopApp>` wrapper in `app/layout.tsx`
- `@whop/react` package installed
- Browser console for errors

### "SDK not initialized"

**Check:**
- All env vars are set
- Dev server was restarted after adding env vars
- No typos in env var names

### Payment Succeeds But No Access

**Solution:**
- Verify access pass ID matches the plan
- Check webhook configuration
- Refresh the page
- Check Whop dashboard for membership status

## Security Considerations

✅ **DO:**
- Keep API keys server-side only
- Create checkout sessions server-side
- Validate all payments with webhooks
- Use environment variables for sensitive data

❌ **DON'T:**
- Expose `WHOP_API_KEY` to client
- Trust client-side success callbacks alone
- Hardcode plan IDs in client code
- Skip webhook validation

## Next Steps

1. **Set up webhooks** for production
2. **Add analytics** to track conversion rates
3. **Create email notifications** for new subscriptions
4. **Implement usage tracking** per tier
5. **Add annual billing** options
6. **Create admin dashboard** to manage subscriptions

## Resources

- [Full Setup Guide](./SUBSCRIPTION_SETUP.md)
- [Whop Documentation](https://docs.whop.com/)
- [Whop Payments API](https://docs.whop.com/apps/features/payments-and-payouts)
- [Whop Subscriptions](https://docs.whop.com/apps/features/subscriptions)

## Support

For issues or questions:
- Check `SUBSCRIPTION_SETUP.md` for detailed setup
- Review Whop documentation
- Contact Whop support
