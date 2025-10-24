# Whop Email Automations — Practical Blueprint
---

## What to automate (high-leverage sequences)

### 1) New buyer → “First 7 days” activation
**Trigger:** `payment.succeeded` (or access granted)  
**Goals:** first action, habit, conversion to core feature use  
**Flow (opinionated default):**
- **T+0m:** “Welcome + 1 simple win”
- **T+24h:** “Setup checklist” (3 bullets + 1 CTA)
- **T+72h:** “Case study + quick win template”
- **T+7d:** “Progress nudge + ask for reply”

**Whop data:** member id, plan, experience/company access.  
**Scopes:** `payment:basic:read`, `plan:basic:read`, `member:basic:read`, `member:email:read`.

---

### 2) Dunning & failed renewals
**Trigger:** `payment.failed` + retry events  
**Flow:**
- **Immediate:** “Update card” with in-app payment modal link
- **T+24h:** “2 clicks to fix” + alternative method
- **T+72h:** final notice → auto-downgrade if still failing

**Whop:** payments API + webhooks  
**Scopes:** `payment:manage` for retry if you expose a one-click retry; otherwise link to Whop checkout.

---

### 3) Churn save / access revoked
**Trigger:** access pass removed / refund / cancel  
**Flow:** exit survey → “keep content for 7 days” grace → win-back at day 14 with targeted offer.  
**Whop:** access/plan state + refunds/voids  
**Scopes:** `access_pass:basic:read`, `payment:basic:read`.

---

### 4) Content/activity digests (community/products)
**Trigger:** weekly cron + forum/posts/events counts; last seen activity  
**Flow:** weekly “What you missed” (top 3 posts, new files, upcoming event CTA).  
**Whop:** forum/posts experiences & access validation, discover/experience views to deep-link.

---

### 5) Milestones & usage-based nudges
**Trigger:** first course completed, N logins, N purchases, affiliate referrals, etc.  
**Flow:** congrats + next step + upsell to higher tier or add-on.  
**Whop:** experiences + company dashboard deep links.

---

### 6) Trials / first purchase intent
**Trigger:** free role added or $0 plan → no activity in 48h  
**Flow:** walkthrough → objection handling → limited-time upgrade.  
**Whop:** plan list/read + payments modal if upgrading.

---

### 7) Launch & promo blasts (one-off → drip)
**Trigger:** creator starts a promo (UI action)  
**Flow:** announce → reminder → last-chance (auto time windows).  
**Whop:** charge via iframe SDK or redirect to checkout.

---

## How to build it (architecture that won’t bite later)

### Event pipeline
- **Ingest:** Whop **webhooks** (e.g., `payment.succeeded`, `payment.failed`) → `/api/webhook` → validate signature.
- **Queue:** push to a jobs table/queue with idempotency key = `${event.id}`.
- **Rules Engine:** map events to **Segments** (e.g., “New Buyers,” “At-Risk Renewals”) then to **Sequences** (activation, dunning, etc.).
- **Scheduler:** create future jobs (T+24h, T+72h) with **cancellation guards** (e.g., stop dunning if payment succeeded).

### Data + permissions map
- **Identify users:** OAuth (“Login with Whop”) and SDK tokens.
- **Read:** `member:basic:read`, `member:email:read`, `plan:basic:read`, `access_pass:basic:read`, `payment:basic:read`.
- **Charge/Retry (optional):** `payment:manage` or open Whop checkout/iframe modal.
- **Validate Access:** use SDK `checkIfUserHasAccessToCompany/Experience` before sending gated content links.

### Email rendering
- **Templates:** MJML/React email templates with variables from Whop payload (plan name, next_renewal, community links).
- **Personalization:** lightweight Liquid-style: `{{first_name}}`, conditionals for plan tier.

### Minimal schema (tables)
- `audiences(id, name, filter_json)`
- `sequences(id, name, type, steps_json)`
- `sequence_enrollments(id, user_id, sequence_id, status, started_at)`
- `jobs(id, kind, run_at, payload_json, status, dedupe_key)`
- `events(id, type, source, raw_json)`
- `messages(id, user_id, sequence_id, step, sent_at, status, provider_id)`

### Idempotency & compliance
- **Idempotent sends:** dedupe on `(user_id, sequence_id, step)`.
- **Unsubscribe & rate limits:** global + sequence-level caps; pause on bounces.
- **Time windows:** local-time quiet hours.

---

## Product UX (fast + obvious)

**Top nav:** `Campaigns | Automations | Audience | Analytics`

### Automations
- **Recipes (opinionated defaults):**
  - “New buyer 7-day”
  - “Dunning”
  - “Win-back 14d”
  - “Weekly digest”
  - “Trial → Paid”
- Each recipe ships with pre-timed steps + copy blocks the creator edits (not a blank canvas).

- **Builder (simple stepper, not a scary canvas):**
  1. **Trigger** (Webhook event / Time / Manual)
  2. **Audience** (filters: plan, last payment status, last_seen, tags)
  3. **Steps** (Email → Wait → Branch on condition)
  4. **Safeguards** (send window, max sends/week, stop conditions)
  5. **Review & Start**

- **Preview & Test:** “Render as member …” + send test to self.

### Analytics
- Per sequence: **enrolled → delivered → opened → clicked → goal (renewal/charge/visit)**.
- Dunning: recovery rate, time-to-recover.
- Activation: day-7 activation %, reply rate.

---

## Concrete wiring examples

**Webhook → Activation enroll**
```ts
// /api/webhook (validated)
if (event.type === "payment.succeeded") {
  enqueue({
    kind: "ENROLL_SEQUENCE",
    run_at: now(),
    payload: { userId: event.user_id, sequence: "activation_7d" }
  });
}
```

**Dunning guard**
```ts
// stop future dunning if paid
if (event.type === "payment.succeeded") {
  cancelJobsWhere({ userId: event.user_id, sequence: "dunning" });
}
```

**Open Whop payment modal from email CTA**
- Link lands on your app → calls server → creates charge via Whop API → open **iframe SDK** modal to confirm.  
- (Or redirect to Whop checkout if you don’t run iframe.)

---

## Starter pack (ship this first)
1. **New buyer 7-day** (pre-written copy)
2. **Dunning 3-step** with one-click fix path
3. **Weekly digest** from forum/events feed
4. **Churn save** (exit survey + 14-day win-back)
5. **Trial → Paid** 48h + 5-day nudges


