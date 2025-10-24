# Setup Feature Implementation Plan

**Overall Progress:** `100%`

## Tasks

- [x] 🟩 **Step 1: DB migration — sender identity**
  - [x] 🟩 Add `profiles.display_name` (TEXT, nullable)
  - [x] 🟩 Add `profiles.mail_username` (TEXT, UNIQUE, nullable)
  - [x] 🟩 Create migration: `supabase/migrations/add_sender_identity.sql`
  - [x] 🟩 Update `lib/supabase/types.ts` to include new fields (if applicable)

- [x] 🟩 **Step 2: Sender identity API**
  - [x] 🟩 `GET /api/sender-identity?companyId=...` → returns `{ display_name, mail_username, setupComplete }`
  - [x] 🟩 `POST /api/sender-identity?companyId=...` → sets `{ display_name, mail_username }` (validate, lowercase, lock-once)
  - [x] 🟩 `GET /api/sender-identity/check?username=...` → real-time availability `{ available }`

- [x] 🟩 **Step 3: Enforce setup in send routes**
  - [x] 🟩 `app/api/campaigns/[id]/send/route.ts` → block if not configured; send with `From: Display Name <username@mail.membermail.app>`
  - [x] 🟩 `app/api/campaigns/[id]/send-test/route.ts` → resolve identity; send with correct `From`
  - [x] 🟩 `app/api/test-email/route.ts` → require `companyId`; resolve identity; send with correct `From`
  - [x] 🟩 `app/api/automations/process/route.ts` → if not configured, skip/reschedule job; when configured, send with correct `From`

- [x] 🟩 **Step 4: Setup UI under dashboard**
  - [x] 🟩 Add `app/dashboard/[companyId]/setup/page.tsx` with inputs: Display Name, Username
  - [x] 🟩 Real-time username availability (calls `/api/sender-identity/check`)
  - [x] 🟩 Submit to `POST /api/sender-identity` and lock username after save
  - [x] 🟩 Redirect to campaigns on success

- [x] 🟩 **Step 5: Sidebar entry**
  - [x] 🟩 Add “Setup” link in `components/AppSidebar.tsx`

- [x] 🟩 **Step 6: Preview and test UX**
  - [x] 🟩 `components/campaigns/new/modals/PreviewModal.tsx` → show `From: Display Name <username@mail.membermail.app>` (fetched from identity endpoint)
  - [x] 🟩 Fix any `.com` → `.app` for sender address display
  - [x] 🟩 `components/campaigns/new/modals/SendTestEmailDialog.tsx` → include `companyId` in request; disable if setup incomplete

- [x] 🟩 **Step 7: UI guardrails for send**
  - [x] 🟩 `app/dashboard/[companyId]/campaigns/[id]/page.tsx` → disable Send; show “Complete Setup” banner linking to Setup when not configured
  - [x] 🟩 Composer (Compose step) → disable Test Send until setup complete

- [x] 🟩 **Step 8: Validation rules**
  - [x] 🟩 Enforce lowercase username with digits and hyphens only
  - [x] 🟩 3–30 chars; start/end alphanumeric; no consecutive hyphens
  - [x] 🟩 Reserved names: `admin`, `support`, `postmaster`, `abuse`, `no-reply`
