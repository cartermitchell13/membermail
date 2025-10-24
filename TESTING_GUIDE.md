# MemberMail Testing Guide

This guide explains how to test campaign functionality during development **without needing a real Whop community with multiple members**.

## 🎯 The Problem

Testing email campaigns requires:
- Multiple member accounts
- Real Whop community membership data
- Active subscriptions
- Email sending quota

This is expensive, slow, and impractical during development.

## ✨ The Solution: Mock Data + Simulation

Instead of relying on real Whop data, you can:
1. **Seed fake member data** directly into your Supabase database
2. **Simulate campaign sends** without actually sending emails
3. **Generate realistic analytics** to test your dashboard

---
## Automation Sequences QA Checklist

1. **Create a sequence**
   - Visit `/dashboard/<companyId>/automations`.
   - Use the *Automation sequences* form to create a new sequence with a Whop trigger.
2. **Build the flow**
   - From the sequence card, click *Add automation email*.
   - Compose an email and keep the delivery mode on **Automation** (sequence emails cannot be manual).
   - Confirm that the new campaign appears in the sequence step list with the correct delay.
3. **Simulate an event**
   - Seed test data if needed (`pnpm seed:test`).
   - Call the webhook endpoint with a supported event, for example:
     ```bash
     curl -X POST http://localhost:3000/api/webhooks \
       -H "Content-Type: application/json" \
       -d '{"action":"payment_failed","data":{"company_id":"biz_testcompany123","user_id":"member_001"}}'
     ```
4. **Process queued jobs**
   - Set `AUTOMATION_CRON_SECRET=local-dev` in your shell.
   - Run the automation processor locally:
     ```bash
     curl -X POST http://localhost:3000/api/automations/process -H "x-cron-secret: local-dev"
     ```
   - Verify email events are stored for the sequence step in `email_events`.
5. **Respect quiet hours**
   - Set quiet hours via the campaign Settings step.
   - Re-run the processor while the scheduled time is outside the window and confirm the job is deferred.
6. **Regression quick-check**
   - `pnpm test:automations` to run the unit tests for event normalization helpers.
   - `pnpm check:test` to confirm seeded data remains consistent.

---

## 🚀 Quick Start

### Option 1: SQL Script (Fastest)

1. Open your Supabase dashboard → SQL Editor
2. Copy the contents of `scripts/seed-test-members.sql`
3. Replace `'biz_testcompany123'` with your test Whop company ID (or leave as-is)
4. Run the script
5. You now have 50 fake members to test with!

### Option 2: TypeScript Script (More Control)

```powershell
# Install tsx if you don't have it
npm install -D tsx

# Set your environment variables
$env:NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:NEXT_PUBLIC_WHOP_COMPANY_ID="biz_testcompany123"

# Run the seeding script
npx tsx scripts/seed-test-data.ts
```

This will:
- ✅ Create a test profile
- ✅ Create a test community
- ✅ Generate 50 realistic members with various tiers and statuses
- ✅ Show you a summary of what was created

---

## 📧 Testing Campaign Sends

### Method 1: Simulate Without Sending Emails (Recommended)

This approach generates realistic analytics **without sending any emails**:

```typescript
// After creating a campaign, call the simulation endpoint
const response = await fetch(`/api/dev/simulate-send?campaignId=${campaignId}`, {
  method: 'POST',
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   summary: {
//     totalRecipients: 50,
//     sent: 50,
//     delivered: 48,
//     bounced: 2,
//     opened: 20,
//     clicked: 5,
//     rates: {
//       delivery: "96.0%",
//       open: "40.0%",
//       click: "10.0%"
//     }
//   }
// }
```

**What this does:**
- ✅ Creates `email_events` for all members (sent, delivered, opened, clicked, bounced)
- ✅ Updates campaign stats (open rate, click rate, recipient count)
- ✅ Uses realistic engagement rates (40% open, 10% click, 5% bounce)
- ❌ Doesn't actually send any emails
- ❌ Doesn't use your Resend quota

### Method 2: Send Test Emails to Yourself

For testing the actual email rendering and delivery:

```typescript
// Use Resend to send a test email to your own address
await fetch('/api/campaigns/test-send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    campaignId: 123,
    testEmail: 'your-email@example.com'
  })
});
```

### Method 3: Send to a Small Subset

Create a custom filter to send to just 5-10 test members:

```typescript
// In your campaign composer, filter members
const testMembers = allMembers.filter(m => 
  m.email.includes('@testmembermail.dev')
).slice(0, 5);
```

---

## 🎭 Realistic Test Data

The seeding scripts create members with:

### Member Tiers
- Basic (25%)
- Premium (25%)
- VIP (25%)
- Elite (25%)

### Member Statuses
- Active (80%)
- Cancelled (15%)
- Paused (5%)

### Other Realistic Attributes
- **Joined dates**: Random within the last year
- **Last active**: Random within the last 30 days
- **Engagement scores**: Random 0-100
- **Email addresses**: `testuser1@testmembermail.dev` format

---

## 🧪 Testing Workflows

### 1. Test Audience Targeting

```typescript
// Test filtering by tier
const premiumMembers = await supabase
  .from('members')
  .select('*')
  .eq('membership_tier', 'premium')
  .eq('status', 'active');

// Test filtering by status
const activeMembers = await supabase
  .from('members')
  .select('*')
  .eq('status', 'active');
```

### 2. Test Campaign Creation

1. Navigate to `/dashboard/[companyId]/campaigns/new`
2. Use the editor to compose a newsletter
3. Select "All Members" as audience
4. Save as draft
5. Review the campaign

### 3. Test Campaign Sending (Simulated)

```typescript
// Create campaign
const { data: campaign } = await supabase
  .from('campaigns')
  .insert({ 
    subject: 'Test Newsletter',
    html_content: '<h1>Hello</h1>',
    community_id: 1,
    status: 'draft'
  })
  .select()
  .single();

// Simulate send
await fetch(`/api/dev/simulate-send?campaignId=${campaign.id}`, {
  method: 'POST'
});

// Check analytics
const { data: events } = await supabase
  .from('email_events')
  .select('*')
  .eq('campaign_id', campaign.id);
```

### 4. Test Analytics Dashboard

After simulating a send:
1. Navigate to campaign details page
2. View metrics: open rate, click rate, delivery rate
3. Check engagement timeline
4. View member-level activity

---

## 🔄 Updating Test Data

### Add More Members

```powershell
npx tsx scripts/seed-test-data.ts
```

Each run will:
- Clean existing test members
- Generate fresh member data
- Maintain your test community

### Modify Member Distribution

Edit `scripts/seed-test-data.ts`:

```typescript
// Change engagement rates
status: i % 5 === 0 ? 'cancelled' : 'active', // 20% cancelled

// Change tier distribution
membership_tier: i < 10 ? 'vip' : 'basic', // 10 VIP, rest basic

// Change number of members
const NUM_MEMBERS = 100; // Generate 100 members
```

### Reset All Data

```sql
-- In Supabase SQL Editor
DELETE FROM email_events WHERE campaign_id IN (
  SELECT id FROM campaigns WHERE community_id IN (
    SELECT id FROM communities WHERE whop_community_id = 'biz_testcompany123'
  )
);

DELETE FROM campaigns WHERE community_id IN (
  SELECT id FROM communities WHERE whop_community_id = 'biz_testcompany123'
);

DELETE FROM members WHERE community_id IN (
  SELECT id FROM communities WHERE whop_community_id = 'biz_testcompany123'
);

DELETE FROM communities WHERE whop_community_id = 'biz_testcompany123';
```

---

## 🔐 Environment Setup

Required environment variables for testing:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Whop (use test company ID)
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_testcompany123
WHOP_API_KEY=your-api-key (optional for testing with mock data)

# Email (only needed for real sends)
RESEND_API_KEY=re_xxx (only needed for actual email testing)
```

---

## 🎨 UI Testing Tips

### Test Campaign Composer
- ✅ Rich text editing (bold, italic, links)
- ✅ Image uploads
- ✅ CTA button customization
- ✅ Subject line and preview text
- ✅ Mobile vs desktop preview
- ✅ Autosave functionality

### Test Member List
- ✅ Filtering by status
- ✅ Filtering by tier
- ✅ Search by name/email
- ✅ Member detail view
- ✅ Engagement scores

### Test Analytics Dashboard
- ✅ Campaign list view
- ✅ Open rate charts
- ✅ Click rate tracking
- ✅ Engagement timelines
- ✅ Member activity logs

---

## 🐛 Common Issues

### "No members found"
**Solution**: Run the seeding script to create test members

### "Community not found"
**Solution**: Check that `NEXT_PUBLIC_WHOP_COMPANY_ID` matches the community ID in your database

### "Permission denied"
**Solution**: Ensure you're using the service role key for seeding scripts, not the anon key

### "Failed to insert members"
**Solution**: Check your RLS policies allow insert operations for the test user

---

## 🚦 Development Workflow

Here's the recommended workflow for testing campaigns:

```
1. Seed test data
   └─> npx tsx scripts/seed-test-data.ts

2. Start dev server
   └─> npm run dev

3. Create campaign
   └─> Navigate to dashboard
   └─> Click "New Campaign"
   └─> Compose email content
   └─> Select audience

4. Simulate send
   └─> Save campaign as draft
   └─> Call /api/dev/simulate-send
   └─> View analytics

5. Iterate on UI/features
   └─> Make changes
   └─> Test with existing campaigns
   └─> Reset data if needed

6. Test real sending (optional)
   └─> Add Resend API key
   └─> Send test email to yourself
   └─> Verify rendering
```

---

## 📊 Sample Analytics

After running a simulation, expect to see:

| Metric | Typical Value | Notes |
|--------|---------------|-------|
| Delivery Rate | 95-96% | ~5% bounce rate |
| Open Rate | 35-45% | Industry standard |
| Click Rate | 8-12% | ~25% of openers click |
| Bounce Rate | 4-5% | Mix of hard/soft bounces |

---

## 🎓 Pro Tips

1. **Use descriptive campaign subjects**: Makes it easier to identify test campaigns
2. **Tag test campaigns**: Add `[TEST]` prefix to subject lines
3. **Keep test data fresh**: Re-seed weekly to avoid stale data
4. **Test edge cases**: Try campaigns with 0 members, 1 member, 1000+ members
5. **Monitor query performance**: Use Supabase logs to optimize slow queries
6. **Test mobile responsiveness**: Use browser DevTools device emulation

---

## 🔗 Related Files

- `scripts/seed-test-members.sql` - SQL seeding script
- `scripts/seed-test-data.ts` - TypeScript seeding script
- `app/api/dev/simulate-send/route.ts` - Campaign simulation endpoint
- `app/api/sync/members/route.ts` - Real Whop sync (for production)

---

## 📚 Additional Resources

- [Whop API Documentation](https://docs.whop.com/api)
- [Resend API Documentation](https://resend.com/docs)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Testing Email Campaigns Best Practices](https://www.litmus.com/blog/testing-email-campaigns)

---

**Questions?** Create an issue or check the project README for more information.


