# Automations Feature Implementation Plan

**Overall Progress:** `100%`

## Tasks

- [x] 🟩 Simplify Automations index UI
  - [x] 🟩 Collapse editorial sections into a single "Learn more" disclosure
  - [x] 🟩 Add inline "New Flow" trigger picker that creates a Draft sequence
  - [x] 🟩 Render compact flow cards (trigger label, status toggle, timezone, quiet-hours summary)
  - [x] 🟩 Add inline "Add Email" row per flow (delay value + unit + Write Email button)
  - [x] 🟩 Show steps list with actions: Open email, Up, Down, Remove
  - [x] 🟩 Link flow card to dedicated flow editor route

- [x] 🟩 Replace Flow page with list-based builder
  - [x] 🟩 Replace static canvas at `app/dashboard/[companyId]/automations/flows/[flowId]/page.tsx` with list-based editor
  - [x] 🟩 Flow-level settings: status (Draft/Active/Paused), timezone, quiet-hours (enable/start/end)
  - [x] 🟩 Inline add-step row (delay inputs + Write Email) and steps list
  - [x] 🟩 Implement Up/Down reorder UI calling step PATCH API
  - [x] 🟩 Implement Remove step UI with confirmation dialog

- [x] 🟩 Composer automation editor mode
  - [x] 🟩 Add mode flag via URL (`automationEditor=1`) or presence of `automationSequenceId`
  - [x] 🟩 Hide stepper and per-email delivery settings in automation editor mode
  - [x] 🟩 Auto-fetch sequence by `automationSequenceId` and set `sendMode=automation` + `triggerEvent`
  - [x] 🟩 Support URL params: `automationSequenceId`, `stepDelayValue`, `stepDelayUnit`, `returnTo`
  - [x] 🟩 After create, auto-attach campaign as a step with provided delay; redirect to `returnTo`

- [x] 🟩 Steps API and server behavior
  - [x] 🟩 Add `PATCH /api/automations/sequences/[id]/steps/[stepId]` to update `delay_value`, `delay_unit`, and `position` (reorder)
  - [x] 🟩 Reindex step positions (1..N) server-side after reorder
  - [x] 🟩 Add `DELETE /api/automations/sequences/[id]/steps/[stepId]` to delete step AND the attached campaign
  - [x] 🟩 On step delete, cancel pending `automation_jobs` for the deleted campaign

- [x] 🟩 Sequence quiet-hours (DB + processor)
  - [x] 🟩 Add columns to `automation_sequences`: `quiet_hours_enabled` (bool), `quiet_hours_start` (int 0-23), `quiet_hours_end` (int 0-23)
  - [x] 🟩 Update `lib/supabase/types.ts` to include the new fields
  - [x] 🟩 Update `app/api/automations/process/route.ts` to prefer sequence quiet hours when `sequence_id` is present; fallback to campaign-level
  - [x] 🟩 Ensure processor skips/cancels jobs when the parent sequence status is `paused`
  - [x] 🟩 Bind flow-page quiet-hours UI to sequence fields

- [x] 🟩 Navigation and linking
  - [x] 🟩 From Automations/Flow, open composer with: `automationEditor=1`, `automationSequenceId`, optional `stepDelayValue`, `stepDelayUnit`, and `returnTo`
  - [x] 🟩 After save in composer, redirect to `returnTo` (flow page)

- [x] 🟩 QA and guardrails
  - [x] 🟩 Verify webhook-triggered scheduling for active sequences; standalone automations unaffected
  - [x] 🟩 Validate reorder persists and displays correctly (no retroactive changes to already scheduled jobs)
  - [x] 🟩 Confirm deleting a step removes its campaign and cancels only that campaign's pending jobs
  - [x] 🟩 Confirm sequence quiet-hours are applied in processor and UI reflects current settings
