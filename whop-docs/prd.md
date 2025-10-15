# MemberMail — Newsletter Platform for Whop Communities

## Project Overview
Build a newsletter platform specifically for Whop community creators. This is a web application that allows Whop community owners to send beautiful, professional newsletters to their members with seamless Whop integration.

## Core Problem
Whop community creators need to send regular updates to their members but lack a reliable, Whop-native email tool. Existing solutions (EmailSync, Mailoo) have reliability issues, poor member syncing, and are overly complex.

## Solution
MemberMail is a newsletter-first email platform that:
- Automatically syncs with Whop community members
- Provides niche-specific newsletter templates (trading, sports betting, fitness, reselling, e-commerce)
- Makes it dead simple to compose and send beautiful newsletters
- Provides transparent analytics on opens, clicks, and engagement
- Scales from MVP to a full email marketing suite over time

## Tech Stack

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui for components
- React Hook Form + Zod for form validation
- TanStack Query for server state management
- Tiptap for rich text editing
- React Email for email templates

### Backend
- Supabase (PostgreSQL + Auth + Storage)
- Supabase Edge Functions for secure server logic
- Supabase RLS for row-level access control
- Resend for transactional and bulk email sending
- Whop SDK for community integration

### Infrastructure
- Hosting: Vercel (frontend)
- Database & Auth: Supabase
- Email Service: Resend
- File Storage: Supabase Storage
- Cron: Supabase Scheduled Functions for periodic syncs

## Key Features for MVP

### 1. Authentication & Onboarding
- Supabase Auth (email/password or magic link)
- Connect user’s Whop community via OAuth or API key
- Automatically sync Whop members via Edge Function
- Simple onboarding flow (3–5 steps max)

### 2. Member Management
- Display all synced members from Whop
- Show member status (active, cancelled, paused)
- Show membership tier
- Segment by tier if multiple tiers exist
- Real-time sync status indicator
- Auto-sync via cron every 15 minutes
- Handle member join/leave via Whop webhook (Phase 2)

### 3. Newsletter Composer
- Clean, distraction-free composer interface
- Rich text editor (Tiptap) with:
  - Formatting (bold, italic, headings, lists)
  - Links, images (upload to Supabase Storage)
  - Buttons/CTAs
- Subject line and preview text fields
- Live preview (desktop + mobile)
- Save as draft
- Send test email to self

### 4. Templates
Start with 5 niche-specific templates:
1. **Trading** – Weekly trade recap format
2. **Sports Betting** – Weekly picks and results
3. **Fitness** – Member transformation spotlight
4. **Reselling** – Flip of the week showcase
5. **General** – Clean, minimal newsletter template

Each template:
- Built with React Email
- Fully customizable
- Mobile-responsive
- Professionally designed

### 5. Sending
- Send immediately OR schedule for later
- Select audience:
  - All members
  - Specific membership tiers
- Confirmation modal before sending
- Progress indicator during send
- Success/failure notifications
- Send logic handled by Supabase Edge Function (Resend API)

### 6. Analytics Dashboard
- Campaign list with:
  - Date sent
  - Subject line
  - Recipient count
  - Open rate %
  - Click rate %
  - Status (draft, scheduled, sent)
- Campaign analytics view:
  - Opens over time graph
  - Click heatmap
  - List of members who opened/didn’t open
  - Engagement score per member
- Member engagement view:
  - Engagement percentage
  - Last opened date
  - Total opens/clicks

### 7. Settings
- **Community Settings:**
  - Connected Whop community info
  - Sync status
  - Member count
  - Manual sync button
- **Email Settings:**
  - “From” name
  - Reply-to email
  - Default footer text
- **Account Settings:**
  - Profile info
  - Billing
  - API keys (for advanced users)

## Database Schema (Supabase SQL)
```sql
-- Profiles
create table profiles (
  id uuid primary key default auth.uid(),
  email text unique not null,
  name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Communities
create table communities (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  whop_community_id text unique not null,
  name text not null,
  member_count int default 0,
  last_sync_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Members
create table members (
  id bigint generated always as identity primary key,
  community_id bigint not null references communities(id) on delete cascade,
  whop_member_id text unique not null,
  email text not null,
  name text,
  membership_tier text,
  status text check (status in ('active','cancelled','paused')),
  joined_at timestamptz not null,
  last_active_at timestamptz,
  engagement_score numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Campaigns
create table campaigns (
  id bigint generated always as identity primary key,
  community_id bigint not null references communities(id) on delete cascade,
  subject text not null,
  preview_text text,
  content_md text,
  html_content text not null,
  status text check (status in ('draft','scheduled','sending','sent','failed')) default 'draft',
  scheduled_for timestamptz,
  sent_at timestamptz,
  recipient_count int default 0,
  open_count int default 0,
  click_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Email Events
create table email_events (
  id bigint generated always as identity primary key,
  campaign_id bigint not null references campaigns(id) on delete cascade,
  member_id bigint not null references members(id) on delete cascade,
  type text check (type in ('sent','delivered','opened','clicked','bounced','complained')) not null,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Templates
create table templates (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  category text,
  thumbnail text,
  content_md text,
  html_content text,
  is_default boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


## RLS
alter table profiles enable row level security;
alter table communities enable row level security;
alter table members enable row level security;
alter table campaigns enable row level security;
alter table email_events enable row level security;
alter table templates enable row level security;

create policy "user can manage own profile" on profiles for all using (id = auth.uid());
create policy "user owns their communities" on communities for all using (user_id = auth.uid());
create policy "user owns their members" on members for all using (
  exists (select 1 from communities c where c.id = members.community_id and c.user_id = auth.uid())
);
create policy "user owns their campaigns" on campaigns for all using (
  exists (select 1 from communities c where c.id = campaigns.community_id and c.user_id = auth.uid())
);
create policy "user can read email events for their campaigns" on email_events for select using (
  exists (
    select 1 from campaigns cp join communities c on c.id = cp.community_id
    where cp.id = email_events.campaign_id and c.user_id = auth.uid()
  )
);
create policy "user owns their templates" on templates for all using (user_id = auth.uid());


## Edge Functions

whop/oauth/callback

Handles Whop OAuth exchange.

Stores tokens securely in Supabase.

whop/sync

Fetches all members from Whop.

Upserts member data.

Updates last_sync_at.

email/send

Queues and sends campaigns via Resend.

Logs events in email_events.

email/webhooks

Handles Resend webhooks for delivery, bounce, spam, etc.

track/open & track/click

Handles pixel tracking and click redirects with HMAC signatures.

Key User Flows
First-Time Setup

User signs up via Supabase Auth

Connects Whop account via OAuth

Selects Whop community

Automatic member sync begins

Redirect to dashboard after sync

Creating & Sending Newsletter

Dashboard → “Create Newsletter”

Choose template or start blank

Compose content in Tiptap

Send test → select audience → confirm

Campaign status updates to “sending”

Success → analytics dashboard

Viewing Analytics

Dashboard → Campaign list

Select campaign

View opens, clicks, inactive members

Option to trigger re-engagement (Phase 2)

Design Principles

UI/UX Guidelines

Clean, minimal, and fast

Focus on core actions: write, send, measure

Mobile responsive

Linear/Vercel-like simplicity

Instant feedback (toasts, loaders, skeletons)

Color Scheme

Primary: Whop’s Orange #FA4616
Background: #000000 
Foreground: #111111
Accent: #191919
Success: Green
Error: Red

Typography

Headings: Geist

Body: Inter/system font

Email Tracking Implementation

Opens

Insert 1×1 transparent pixel: /track/open?c={id}&m={id}&sig={hmac}

Log “opened” event in email_events

Update open_count and engagement_score

Clicks

Replace links with /track/click?c={id}&m={id}&u={encoded}

Log “clicked” event, redirect to URL

Increment click count

Phase 2 Features

Automated welcome/onboarding flows

Re-engagement campaigns

A/B testing subject lines

Custom segmentation

AI writing assistant

Drag-and-drop email builder

Multi-community management

Team collaboration

Custom domains for sending

Advanced analytics (churn prediction)

Success Metrics

Product

Time to first campaign < 10 minutes

Member sync reliability > 99%

Email delivery > 98%

Campaign send < 5 minutes for 1,000 emails

Business

Activation (sent first email) > 60%

Week 1 retention > 50%

Month 1 retention > 40%

Avg. newsletters/user/month > 4

NPS > 50

Development Priorities

Week 1–2: Foundation

Supabase setup (auth, db, RLS)

Whop OAuth

Dashboard layout

Week 3–4: Core Features

Member sync (Whop → Supabase)

Composer

Email templates

Sending via Resend

Week 5–6: Analytics & Polish

Email tracking (opens, clicks)

Dashboard metrics

Error handling & UX cleanup

Week 7–8: Testing & Launch

QA

E2E testing

Soft launch

Docs & onboarding polish

Non-Functional Requirements

Performance

Load < 1s

Lighthouse > 90

Security

All RLS active

HTTPS only

Sanitized inputs

Secure token storage

Signed tracking URLs

Scalability

10,000 members/community

100,000 emails/day

Optimized indexes

Reliability

99.9% uptime

Retry logic on send

Health checks & logging