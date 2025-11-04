This is a template for a whop app built in NextJS. Fork it and keep the parts you need for your app. 

# Whop NextJS App Template

To run this project: 

1. Install dependencies with: `pnpm i`

2. Create a Whop App on your [whop developer dashboard](https://whop.com/dashboard/developer/), then go to the "Hosting" section and:
	- Ensure the "Base URL" is set to the domain you intend to deploy the site on.
	- Ensure the "App path" is set to `/experiences/[experienceId]`
	- Ensure the "Dashboard path" is set to `/dashboard/[companyId]` 
	- Ensure the "Discover path" is set to `/discover` 

3. Copy the environment variables from the `.env.development` into a `.env.local`. Ensure to use real values from the whop dashboard.
   - Add `APP_URL` pointing to your deployed URL. For local development, use a public tunnel (e.g., ngrok) because Whop webhooks must reach your server. Example: `APP_URL=https://your-id.ngrok.app`
   - OAuth scopes request `developer:manage_webhook` to allow the app to programmatically create webhooks during install.
   - Provide plan + access pass IDs for paid tiers:
     ```bash
     NEXT_PUBLIC_PRO_PLAN_ID="plan_..."
     NEXT_PUBLIC_PRO_ACCESS_PASS_ID="prod_..."
     NEXT_PUBLIC_ENTERPRISE_PLAN_ID="plan_..."
     NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID="prod_..."
     ```
     These power checkout and paywall flows (Pro = $29/mo with 7-day trial, Enterprise = $200/mo).

4. Go to a whop created in the same org as the app you created. Navigate to the tools section and add your app.

5. Run `pnpm dev` to start the dev server. Then in the top right of the window find a translucent settings icon. Select "localhost". The default port 3000 should work.

## Deploying

1. Upload your fork / copy of this template to github. 

2. Go to [Vercel](https://vercel.com/new) and link the repository. Deploy your application with the environment variables from your `.env.local`

3. If necessary update you "Base Domain" and webhook callback urls on the app settings page on the whop dashboard.
   - Ensure your app is reachable at `APP_URL` and that the webhook endpoint is `${APP_URL}/api/whop/webhook`.

## Troubleshooting

**App not loading properly?** Make sure to set the "App path" in your Whop developer dashboard. The placeholder text in the UI does not mean it's set - you must explicitly enter `/experiences/[experienceId]` (or your chosen path name)
a

**Make sure to add env.local** Make sure to get the real app environment vairables from your whop dashboard and set them in .env.local


For more info, see our docs at https://dev.whop.com/introduction

## Pricing & Access Controls

- **Pro ($29/mo)** – includes a 7-day free trial, unlocks AI copilots (newsletter rewriting, image generation) and authorizes sending test emails + live campaigns.
- **Enterprise ($200/mo)** – includes everything in Pro plus concierge onboarding and up to 5 authorized team members at no extra charge.
- The in-app paywall surfaces inside the composer when users trigger AI features, send tests, or send campaigns. Purchases via Whop update access immediately after checkout.
- Subscription state is resolved through `/api/subscription/status`, which also returns Enterprise seat counts. If you invite more than 5 team members, a non-blocking alert reminds you to free up seats.
- To validate a new configuration locally, toggle the paywall by hitting the action (e.g., “Ask AI”). After upgrading, click “Refresh access” in the paywall overlay to re-fetch permissions.

## Testing & Development

### Testing Campaigns Without Real Whop Members

During development, you don't need a real Whop community with members to test campaign functionality. Use our seeding and simulation tools:

#### Quick Start

1. **Seed test member data:**
   ```powershell
   npm run seed:test
   ```
   This creates 50 fake members in your database with realistic attributes (tiers, statuses, engagement scores).

2. **Check your test data:**
   ```powershell
   npm run check:test
   ```
   View a summary of your test communities, members, campaigns, and analytics.

3. **Create and test campaigns:**
   - Navigate to your dashboard
   - Create a new campaign
   - Compose your email content
   - Use the "Simulate Send (Dev)" button to generate mock analytics without sending emails

#### What Gets Created

The seeding script generates:
- ✅ 50 test members with realistic names and emails
- ✅ Multiple membership tiers (basic, premium, vip, elite)
- ✅ Various statuses (80% active, 15% cancelled, 5% paused)
- ✅ Realistic join dates and activity timestamps
- ✅ Engagement scores for testing analytics

#### Simulate Campaign Sends

Instead of burning through your Resend quota, simulate campaign sends:

```typescript
// After creating a campaign, simulate the send
await fetch(`/api/dev/simulate-send?campaignId=${campaignId}`, {
  method: 'POST'
});
```

This generates realistic email events (sent, delivered, opened, clicked, bounced) with industry-standard engagement rates (~40% open, ~10% click).

#### UI Component for Simulation

In development mode, render the simulation button in your campaign interface:

```tsx
{process.env.NODE_ENV === 'development' && (
  <SimulateSendButton campaignId={campaign.id} />
)}
```

For complete testing documentation, see [TESTING_GUIDE.md](./TESTING_GUIDE.md)
