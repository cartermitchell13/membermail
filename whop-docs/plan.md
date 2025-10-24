# Automation & Scheduling Feature Plan

**Overall Progress:** `100%`

## Tasks:

- [x] ?? **Step 1: Design Data Model & Migrations**
  - [x] ?? Add tables for sequences, steps, enrollments, jobs, and automation-specific metadata
  - [x] ?? Capture campaign scheduling fields (trigger type, status, delay config) via schema updates
  - [x] ?? Document relationships and constraints for Supabase migration review

- [x] ?? **Step 2: Extend API & Webhook Ingestion**
  - [x] ?? Enhance `/api/campaigns` payloads for manual vs automation mode and status updates
  - [x] ?? Implement webhook handlers for the required Whop events with friendly labels
  - [x] ?? Persist enrollment/job records when events arrive or when automations activate

- [x] ?? **Step 3: Implement Job Runner (Supabase Cron)**
  - [x] ?? Create processing endpoint to dequeue jobs, send emails, and reschedule follow-up steps
  - [x] ?? Ensure idempotency and guardrails (quiet hours, unsubscribe honoring)
  - [x] ?? Wire Supabase scheduled function to invoke processor with proper batching

- [x] ?? **Step 4: Update Campaign Wizard**
  - [x] ?? Add automation/scheduling step with Manual vs Automation choice and event picker
  - [x] ?? Store selections in composer context, block manual send for automation campaigns
  - [x] ?? Surface trigger details in Review step and campaign detail view

- [x] ?? **Step 5: Build Automations Sequence Builder**
  - [x] ?? Create Automations page UI for multi-email sequences (step timing, delays, status)
  - [x] ?? Allow editing/activating sequences tied to new schema records
  - [x] ?? Integrate blueprint prefills and enforce automation-only lifecycle

- [x] ?? **Step 6: Testing & Verification**
  - [x] ?? Add unit/integration tests for API/webhook/job scheduling behaviors
  - [x] ?? Exercise Supabase cron flow and manual QA for trigger-to-send paths
  - [x] ?? Update documentation and provide QA checklist for rollout
