# Testing MemberMail Without Real Whop Members

## The Solution

You **don't need** a real Whop community with multiple members to test campaigns. I've created a complete testing infrastructure that allows you to:

1. ✅ **Seed fake member data** directly into your database
2. ✅ **Simulate campaign sends** without sending real emails
3. ✅ **Generate realistic analytics** to test your dashboard
4. ✅ **Test all features** without API quota limits or costs

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Environment Variables

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
$env:SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
$env:NEXT_PUBLIC_WHOP_COMPANY_ID="biz_testcompany123"
```

### Step 2: Seed Test Members

```powershell
npm run seed:test
```

**What this does:**
- Creates a test community in your database
- Generates 50 fake members with realistic data
- Assigns various tiers (basic, premium, vip, elite)
- Distributes statuses (80% active, 15% cancelled, 5% paused)
- Sets realistic join dates and engagement scores

**Output:**
```
✨ Test data seeded successfully!

📊 Summary:
   Total Members: 50
   Active: 40
   Cancelled: 8
   Paused: 2
   
   Community ID: biz_testcompany123
```

### Step 3: Test Your Campaigns

Now you can:
- Create campaigns in your UI
- Select "All Members" as audience (40 active recipients)
- Test the campaign composer, preview, and settings
- Simulate sends to generate analytics

---

## 📧 Testing Campaign Sends

### Option A: Simulate Send (No Emails Sent)

```powershell
# After creating a campaign, call the simulation endpoint
POST /api/dev/simulate-send?campaignId=123
```

**What happens:**
- ✅ Creates email events for all active members
- ✅ Simulates realistic engagement (40% open, 10% click, 5% bounce)
- ✅ Updates campaign statistics
- ✅ Generates analytics data
- ❌ Doesn't send any actual emails
- ❌ Doesn't use your Resend quota

**Expected Response:**
```json
{
  "success": true,
  "summary": {
    "totalRecipients": 40,
    "sent": 40,
    "delivered": 38,
    "bounced": 2,
    "opened": 16,
    "clicked": 4,
    "rates": {
      "delivery": "95.0%",
      "open": "40.0%",
      "click": "10.0%"
    }
  }
}
```

### Option B: UI Button Component

Add this to your campaign review page:

```tsx
import { SimulateSendButton } from '@/components/campaigns/SimulateSendButton';

// In your component
{process.env.NODE_ENV === 'development' && (
  <SimulateSendButton 
    campaignId={campaign.id}
    onSuccess={() => {
      // Refresh campaign data
      router.refresh();
    }}
  />
)}
```

This gives you a nice UI button with success toasts showing the simulation results.

---

## 🔍 Checking Your Test Data

```powershell
npm run check:test
```

**Shows you:**
- Number of communities
- Members per community (with status breakdown)
- Member tier distribution
- Campaign count and status
- Recent campaigns with stats
- Email events count by type

**Example Output:**
```
🔍 Checking MemberMail test data...

🏢 Communities:
   Total: 1

   📍 Test Community - MemberMail Dev
      ID: 1
      Whop ID: biz_testcompany123
      Member Count: 50
      Last Sync: 2025-10-21T18:03:00Z

   👥 Members: 50
      Active: 40
      Cancelled: 8
      Paused: 2

   🎯 Tier Breakdown:
      basic: 13
      premium: 12
      vip: 13
      elite: 12

   📧 Campaigns: 3
      Draft: 1
      Sent: 2

   📋 Recent Campaigns:
      • Weekly Newsletter (sent)
        10/21/2025 | Recipients: 40 | Open Rate: 42.5%
```

---

## 📂 Files Created

| File | Purpose |
|------|---------|
| `scripts/seed-test-data.ts` | TypeScript script to seed test members |
| `scripts/seed-test-members.sql` | SQL script for manual seeding |
| `scripts/check-test-data.ts` | Verify test data in database |
| `app/api/dev/simulate-send/route.ts` | Endpoint to simulate campaign sends |
| `components/campaigns/SimulateSendButton.tsx` | UI component for simulation |
| `TESTING_GUIDE.md` | Complete testing documentation |

---

## 🎯 Workflow Example

Here's a typical testing session:

```powershell
# 1. Seed test data (first time only)
npm run seed:test

# 2. Start dev server
npm run dev

# 3. Open app in browser
# http://localhost:3000/dashboard/biz_testcompany123

# 4. Create a campaign
# - Click "New Campaign"
# - Write content in the editor
# - Select "All Members" audience
# - Save as draft

# 5. Simulate send
# - Click "Simulate Send (Dev)" button
# - View generated analytics

# 6. Check campaign stats
# - View open rates, click rates
# - See member engagement
# - Test analytics dashboard

# 7. Iterate on features
# - Make code changes
# - Test with existing campaigns
# - Re-seed data if needed: npm run seed:test
```

---

## 🧪 What You Can Test

### ✅ Campaign Composer
- Rich text editing
- Image uploads
- CTA button customization
- Subject line and preview text
- Mobile/desktop preview
- Autosave functionality

### ✅ Audience Targeting
- Filter by membership status
- Filter by membership tier
- Segment creation
- Recipient count display

### ✅ Campaign Analytics
- Open rate calculation
- Click rate tracking
- Delivery rate monitoring
- Bounce handling
- Member engagement timelines

### ✅ Member Management
- Member list display
- Status filtering
- Tier filtering
- Engagement scores
- Member activity history

---

## 💡 Pro Tips

1. **Re-seed frequently**: Run `npm run seed:test` to get fresh data whenever you need it
2. **Use the check script**: `npm run check:test` helps verify your database state
3. **Test edge cases**: Create campaigns with different audience sizes
4. **Monitor performance**: Use Supabase logs to check query performance
5. **Test mobile**: Use browser DevTools to test responsive design

---

## 🔄 Reset Everything

If you want to start fresh:

```sql
-- Run in Supabase SQL Editor
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

Then re-run `npm run seed:test` to start fresh.

---

## 🚦 Production Readiness

When you're ready to test with **real** Whop members:

1. **Remove dev-only code:**
   - Remove `<SimulateSendButton>` components
   - Keep the `/api/dev/simulate-send` endpoint (it's protected by `NODE_ENV` check)

2. **Connect real Whop community:**
   - Set `NEXT_PUBLIC_WHOP_COMPANY_ID` to your real company ID
   - Set `WHOP_API_KEY` for authentication

3. **Sync real members:**
   ```typescript
   POST /api/sync/members?companyId=biz_YOUR_REAL_COMPANY
   ```

4. **Use real email sending:**
   - Set `RESEND_API_KEY`
   - Test with small audience first (5-10 members)
   - Monitor delivery rates

---

## 📚 Additional Resources

- **Full Testing Guide**: See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Whop API Docs**: [https://docs.whop.com/api](https://docs.whop.com/api)
- **Resend Docs**: [https://resend.com/docs](https://resend.com/docs)
- **Supabase RLS**: [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Questions?** Check the [TESTING_GUIDE.md](./TESTING_GUIDE.md) for detailed documentation or create an issue.
