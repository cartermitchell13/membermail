# Robust Campaign Drafts + Start Flow — Implementation Plan

**Overall Progress:** `88%`

## Tasks

- [x] 🟩 Step 1: Add Start Source modal (composer)
  - [x] 🟩 Create `StartSourceModal` with three options: Start Blank, Automation Preset, From a Draft
  - [x] 🟩 Show modal on `/dashboard/[companyId]/campaigns/new` when no `draftId`/prefill and no consumed session prefill
  - [x] 🟩 Wire actions: Blank (close + mark session as blank), Preset (link to dashboard automations), Drafts (open Drafts modal)
  - [x] 🟩 Clear any consumed `sessionStorage.draft_email_content` immediately after applying

- [x] 🟩 Step 2: Implement Drafts modal (list/open/delete)
  - [x] 🟩 Build `DraftsModal` that fetches `/api/drafts?companyId=<id>` sorted by `updated_at` desc
  - [x] 🟩 Show "Resume last updated" tile + list (subject, snippet, updated time)
  - [x] 🟩 Open: call `loadDraft(id)` and set subject/preview/styles; close modal
  - [x] 🟩 Delete: call `DELETE /api/drafts/[id]` with confirm; update list without full reload

- [x] 🟩 Step 3: Update CampaignComposerProvider logic
  - [x] 🟩 Remove auto-load of most recent draft for plain `/campaigns/new` loads
  - [x] 🟩 Add flags: `prefillConsumed`, `userInteracted` to control autosave gating
  - [x] 🟩 Suppress autosave until user interaction (subject/preview/editor change)
  - [x] 🟩 On successful `create()`: if `draftId` exists, `DELETE /api/drafts/[id]` then route to campaign
  - [x] 🟩 On leave (route change): prompt "Save as draft or discard?"; save uses force save, discard deletes existing draft (if any)

- [x] 🟩 Step 4: Extend autosave hook for suppression
  - [x] 🟩 Add config to `useDraftAutoSave` to defer saving until `userInteracted === true`
  - [x] 🟩 Keep existing API; expose `saveDraft` (force) unchanged
  - [x] 🟩 Maintain `beforeunload` warning but do not silently save; rely on provider prompt for client nav

- [x] 🟩 Step 5: Harden drafts API by company scope
  - [x] 🟩 `GET /api/drafts/[id]`: accept optional `companyId` and enforce `.eq('company_id', companyId)`
  - [x] 🟩 Mirror the check for `PUT`/`DELETE` when `companyId` is provided

- [x] 🟩 Step 6: Add "Open Drafts" entry on Campaigns page
  - [x] 🟩 `app/dashboard/[companyId]/campaigns/page.tsx`: add secondary "Open Drafts" button next to "New campaign"
  - [x] 🟩 Wire it to open `DraftsModal` (via client wrapper state or route flag)

- [x] 🟩 Step 7: Use existing dashboard automations page
  - [x] 🟩 Link "Automation Preset" to `/dashboard/[companyId]/automations`
  - [x] 🟩 Keep current prefill contract: set `sessionStorage.draft_email_content` + `prefillSubject`/`prefillPreview` on return

- [ ] 🟥 Step 8: Validate critical flows
  - [ ] 🟥 New → Start Blank → edit → leave → prompt → Save as draft → reopen from Drafts
  - [ ] 🟥 New → From Draft → edit → create campaign → draft removed
  - [ ] 🟥 New → Automation preset → content appears → no autosave until edit → leave prompt works
  - [ ] 🟥 New → Template picker → apply → no autosave until edit → continue editing
  - [ ] 🟥 Ensure plain new page no longer autoloads a draft


## Notes
- Draft naming uses subject only (no separate title field).
- Drafts are scoped to current user; no sharing for now.
- No changes to experiences/* routes; use dashboard paths only.
- No search in Drafts modal; sort by last updated; paginate later if needed.
