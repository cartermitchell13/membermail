# Webhook Feature Implementation Plan

**Overall Progress:** `87%`

## Tasks

- [x] 🟩 Step 1: Permissions and environment
  - [x] 🟩 Add `developer:manage_webhook` to OAuth scope in `app/api/oauth/init/route.ts`
  - [x] 🟩 Add `APP_URL` env var and note dev tunnel requirement in `.env` docs

- [x] 🟩 Step 2: Database for per-company secrets
  - [x] 🟩 Create `company_webhooks` table (FK `community_id` unique, `whop_webhook_id`, `webhook_secret`, `url`, `enabled`, timestamps)
  - [x] 🟩 Add indexes/constraints and update Supabase types if needed

- [x] 🟩 Step 3: Ensure webhook on first company visit
  - [x] 🟩 Implement `ensureCompanyWebhook(companyId)` in `lib/whop/webhooks.ts`
  - [x] 🟩 Call ensure in server layouts where `companyId` is known:
    - [x] 🟩 `app/dashboard/[companyId]/layout.tsx`
    - [x] 🟩 `app/experiences/[experienceId]/layout.tsx` (if used)

- [x] 🟩 Step 4: New inbound webhook endpoint
  - [x] 🟩 Add `POST /api/whop/webhook` route with dynamic signature verification (HMAC SHA-256 v1, 5‑min tolerance)
  - [x] 🟩 On success, normalize event and invoke existing automation handler; return 200 quickly

- [x] 🟩 Step 5: Subscriptions and idempotency
  - [x] 🟩 Subscribe to events: `membership_went_valid`, `membership_went_invalid`, `payment_succeeded`, `payment_failed`, `refund_created` (apiVersion `v5`)
  - [x] 🟩 Ensure idempotency: match existing webhook by URL per company; update instead of duplicate

- [x] 🟩 Step 6: Legacy route transition
  - [x] 🟩 Keep existing `POST /api/webhooks` (env `WHOP_WEBHOOK_SECRET`) active for transition
  - [x] 🟩 Route all new installs to `/api/whop/webhook` via creation logic using `APP_URL`

- [ ] 🟥 Step 7: Validation
  - [ ] 🟥 Use `whopSdk.webhooks.testWebhook({ id, event })` to verify signing + handler path
  - [ ] 🟥 Smoke test with dev tunnel (ngrok) for real webhook delivery

- [x] 🟩 Step 8: Minimal docs update
  - [x] 🟩 Document `APP_URL` and permission change in setup docs
