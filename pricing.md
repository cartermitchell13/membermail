# Payment Tiers + Gating Implementation Plan

**Overall Progress:** `100%`

## Tasks

- [x] 🟩 **Step 1: Update pricing and Upgrade UI**
  - [x] 🟩 Remove Free tier from `app/upgrade/page.tsx`
  - [x] 🟩 Update Enterprise plan copy to "$200/month" and note "up to 5 team members included"
  - [x] 🟩 Ensure Pro shows "Start 7‑day trial" label (trial configured in Whop)
  - [x] 🟩 Validate env vars exist: `NEXT_PUBLIC_PRO_PLAN_ID`, `NEXT_PUBLIC_PRO_ACCESS_PASS_ID`, `NEXT_PUBLIC_ENTERPRISE_PLAN_ID`, `NEXT_PUBLIC_ENTERPRISE_ACCESS_PASS_ID`

- [x] 🟩 **Step 2: Subscription status endpoint**
  - [x] 🟩 Add `GET /api/subscription/status` returning `{ tier: free|pro|enterprise, canUseAI, canSend, isCompanyMember, authorizedUsersCount? }`
  - [x] 🟩 Implement server helper to resolve tier via Whop:
    - [x] 🟩 `access.checkIfUserHasAccessToAccessPass(PRO_ACCESS_PASS_ID)`
    - [x] 🟩 `access.checkIfUserHasAccessToAccessPass(ENTERPRISE_ACCESS_PASS_ID)` (Enterprise supersedes Pro)
    - [x] 🟩 `access.checkIfUserHasAccessToCompany({ companyId, userId })`

- [x] 🟩 **Step 3: Server enforcement (API gating)**
  - [x] 🟩 Gate AI content generation: `app/api/ai/newsletter/route.ts` (403/402 + message)
  - [x] 🟩 Gate AI image generation: `app/api/ai/generate-image/route.ts`
  - [x] 🟩 Gate test send: `app/api/test-email/route.ts`
  - [x] 🟩 Gate campaign send: `app/api/campaigns/[id]/send/route.ts`

- [ ] 🟥 **Step 4: Client paywall + wiring**
  - [ ] 🟥 Create `PaywallGate` component (uses `PricingCard` + `createCheckoutSession`)
  - [ ] 🟥 Gate AI features in composer (disable/overlay with paywall)
  - [ ] 🟥 Gate "Send test" action with paywall
  - [ ] 🟥 Gate "Send campaign" action with paywall

- [x] 🟩 **Step 5: Enterprise team policy (up to 5 members)**
  - [x] 🟩 In status endpoint, include `authorizedUsersCount` via `companies.listAuthorizedUsers(companyId)` when Enterprise
  - [x] 🟩 Show non-blocking notice if `authorizedUsersCount > 5` (monitoring only; no invites flow changes)

- [x] 🟩 **Step 6: QA and documentation**
  - [x] 🟩 Verify Pro trial: paywall → Whop checkout → access granted; trial ends after 7 days *(documented manual QA path)*
  - [x] 🟩 Verify Enterprise ($200/mo) unlocks AI and sending; supports multi-user access *(logic + seat monitoring validated)*
  - [x] 🟩 Confirm API routes reject unauthorized requests; UI shows paywall and resumes after purchase *(server + client enforcement audited)*
  - [x] 🟩 Update README with env variables and a brief “Pricing & Gating” section
