# Course-trigger Automations Plan

**Overall Progress:** `87%`

## Tasks

- [x] ✅ Architecture & schema prep
  - [x] ✅ Model `course_progress_states` and `course_trigger_watches` tables
  - [x] ✅ Document course trigger event payload shape (course/lesson IDs, timestamps)
  - [x] ✅ Ensure automation steps store selected course/chapter/lesson metadata

- [x] ✅ Whop integration helpers
  - [x] ✅ Wrap Whop SDK calls: list courses, fetch course structure, fetch user lesson interactions
  - [x] ✅ Cache course structures to minimize API calls
  - [x] ✅ Handle Whop API errors + rate limiting backoff

- [x] ✅ Course completion webhook wiring
  - [x] ✅ Register/verify `course_lesson_interaction.completed` webhook
  - [x] ✅ Normalize payload into `course_lesson_completed` trigger with course/lesson context
  - [x] ✅ Store progress snapshot updates when webhook fires
  - [x] ✅ Shift completion-based automation triggers to rely on webhook events (retire completion polling)

- [x] ✅ Enrollment + watch creation
  - [x] ✅ Detect eligible members on plan purchase / membership activation
  - [x] ✅ Create watch rows for non-webhook triggers (lesson started, not started, chapter/course milestones)
  - [x] ✅ Seed initial progress snapshot when watch is created, including backfill against latest interactions

- [x] ✅ Progress reconciliation job (inactivity + backfill)
  - [x] ✅ Cron/queue path to process watches for inactivity or "not started" deadlines
  - [x] ✅ Fetch latest interactions only for members lacking webhook coverage or needing backfill
  - [x] ✅ Emit automation triggers for derived events (lesson started, inactivity warnings)
  - [x] ✅ Schedule/reschedule "lesson not started" watchers when deadlines pass

- [x] ✅ UI adjustments
  - [x] ✅ Update automation step config UI: allow selecting course -> chapter -> lesson (optional)
  - [x] ✅ Display selected target in flow summary and review step
  - [x] ✅ Add validation so course triggers require a course pick

- [ ] ⏳ QA & protections
  - [ ] ⏳ Seed sample data + run end-to-end test of webhook + reconciliation paths
  - [ ] ⏳ Verify dedupe logic prevents duplicate sends for same member/step
  - [ ] ⏳ Monitor for API quota issues + add instrumentation/logging
