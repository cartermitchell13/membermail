# MemberMail Stepper (Beehiiv-Style Flow)

**Flow Order:**  
`Compose → Audience → Settings → Review`

### Why This Order Works
- Creators think *content-first*, not configuration-first.  
- “Audience” comes second to make targeting intentional, but never a blocker.  
- “Settings” merges Beehiiv’s “Email/Web” step into one clean pass.  
- “Review” gives a final sanity check and builds confidence before sending.

---

## 1. Compose
**Goal:** Let creators start writing immediately. Zero friction.

**UI**
- Title (optional): Internal name; slug + UTM generated from it.  
- Subject + Preheader fields sit above the editor (sticky).  
- Editor is minimalist: text, image, button, divider.  
- Type `{` for personalization chips (`{first_name}`, `{tier}` etc.).  
- Right-side preview toggle: **Desktop / Mobile**.  
- Utility bar: word count, undo/redo, link, test send, autosave state, help.

**Rules**
- Autosave every 3 seconds of inactivity or on blur.  
- Test send remembers the last address used.  
- If subject is empty when moving on → soft nudge, not a hard block.

---

## 2. Audience
**Goal:** Make targeting clear, visual, and impossible to mess up.

**UI**
- Default: **All active members** (shows live recipient count, e.g., “2,341 recipients”).  
- Quick pills: `All`, `By tier`, `By tag`, `Last 30d active`, `Trials`.  
- “Filter” button opens a drawer with rule builder.  
- Saved filters become reusable **Segments**.  
- Inline exclusions: “31 suppressed (unsubscribed/bounced).”

**Rules**
- If count = 0 → disable Next; show inline tip “No one matches—widen your rules.”  
- Always auto-exclude unsubscribed or bounced users.  
- Show delta between selected and deliverable (e.g., “2,341 total • 31 excluded”).

---

## 3. Settings
**Goal:** One clean pass to “send it right.”

**UI**
- **Sender profile** dropdown (warn if domain unverified).  
- **Tracking** toggles ON by default (opens/clicks).  
- Pre-filled UTM template: `utm_source=membermail&utm_medium=email&utm_campaign={{slug}}`.  
- Timezone + **Quiet hours** toggle (default: 9am–8pm local).  
- Optional **A/B subject** toggle → reveals two inputs + auto-winner rule.

**Rules**
- Cannot send for real if domain unverified (test sends still allowed).  
- Persist last-used sender + UTM defaults.  
- All fields validate silently until Review step.

---

## 4. Review
**Goal:** Give confidence and catch errors before sending.

**UI**
- Compact summary card: Audience size, Subject, Preheader, Sender, Schedule time.  
- Auto validation checklist:
  - Unsubscribe + address footer present  
  - Links valid and HTTPS  
  - Domain verified  
  - Audience > 0

**Actions**
- **Send now** or **Schedule** (datetime picker).  
- On success → redirect to Campaigns with status pill (“Scheduled”, “Sending”, “Sent”).

---

# Supporting Pages

## Campaigns
- Tabs: Drafts, Scheduled, Sent, Failed.  
- Each row: name, status, audience count, send time, open/click rates.  
- Row actions: Preview, Duplicate, Pause, Reschedule, View Report.

## Metrics
- Funnel chart: **Sent → Delivered → Opened → Clicked → Unsub/Bounced**.  
- “Top Links” and “Opens by Hour” heat strip.  
- Quick actions: **Resend to Non-Openers**, **Duplicate Campaign**.

## Members
- Whop sync status (“Updated 7m ago”).  
- Filters: tier, tag, status, last active.  
- Saved filters = Segments (editable).  
- Member panel: email timeline, open/click activity.

---

# Micro Interactions (Beehiiv-Style Polish)
- **Autosave indicator:** “Draft • Synced ●”  
- **Sticky header**: Subject, Preheader, Test Send, Preview toggle.  
- **Segment chip** visible in header after Audience step (“Segment: Trials (842)”).  
- **Unsaved changes modal** on back navigation.  
- **Inline link checker** (validates as you paste).  
- Soft blockers first (nudges), hard blockers only at Review.

---

# Non-Negotiable Guards
- Cannot send without:
  - Verified domain  
  - Subject  
  - Unsubscribe + address footer  
  - Non-zero audience
- Auto-exclude unsubscribed/bounced members.
- Always show audience delta (“2,341 selected • 31 excluded”).

---

# Why It Wins
- Mirrors Beehiiv’s mental model (Compose-first).  
- Fewer clicks to get into flow.  
- All guardrails happen silently until Review.  
- Makes sending email feel like posting content—not configuring software.
