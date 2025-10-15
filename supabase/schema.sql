-- MemberMail schema (Supabase/Postgres)

-- Profiles
create table if not exists profiles (
	id uuid primary key default auth.uid(),
	email text unique not null,
	name text,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Communities
create table if not exists communities (
	id bigserial primary key,
	user_id uuid not null references profiles(id) on delete cascade,
	whop_community_id text unique not null,
	name text not null,
	from_name text,
	reply_to_email text,
	footer_text text,
	member_count int default 0,
	last_sync_at timestamptz,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

-- Members
create table if not exists members (
	id bigserial primary key,
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
create table if not exists campaigns (
	id bigserial primary key,
	community_id bigint not null references communities(id) on delete cascade,
	subject text not null,
	preview_text text,
	content_md text,
	html_content text not null,
	audience jsonb,
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
create table if not exists email_events (
	id bigserial primary key,
	campaign_id bigint not null references campaigns(id) on delete cascade,
	member_id bigint not null references members(id) on delete cascade,
	type text check (type in ('sent','delivered','opened','clicked','bounced','complained')) not null,
	metadata jsonb,
	created_at timestamptz default now()
);

-- Templates
create table if not exists templates (
	id bigserial primary key,
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

-- Row Level Security
alter table profiles enable row level security;
alter table communities enable row level security;
alter table members enable row level security;
alter table campaigns enable row level security;
alter table email_events enable row level security;
alter table templates enable row level security;

drop policy if exists "user can manage own profile" on profiles;
create policy "user can manage own profile" on profiles for all using (id = auth.uid());

drop policy if exists "user owns their communities" on communities;
create policy "user owns their communities" on communities for all using (user_id = auth.uid());

drop policy if exists "user owns their members" on members;
create policy "user owns their members" on members for all using (
	exists (
		select 1 from communities c where c.id = members.community_id and c.user_id = auth.uid()
	)
);

drop policy if exists "user owns their campaigns" on campaigns;
create policy "user owns their campaigns" on campaigns for all using (
	exists (
		select 1 from communities c where c.id = campaigns.community_id and c.user_id = auth.uid()
	)
);

drop policy if exists "user can read email events for their campaigns" on email_events;
create policy "user can read email events for their campaigns" on email_events for select using (
	exists (
		select 1 from campaigns cp join communities c on c.id = cp.community_id
		where cp.id = email_events.campaign_id and c.user_id = auth.uid()
	)
);

drop policy if exists "user owns their templates" on templates;
create policy "user owns their templates" on templates for all using (user_id = auth.uid());

-- Indexes helpful for performance
create index if not exists idx_members_community on members(community_id);
create index if not exists idx_members_tier on members(membership_tier);
create index if not exists idx_members_status on members(status);
create index if not exists idx_campaigns_community on campaigns(community_id);
create index if not exists idx_email_events_campaign on email_events(campaign_id);

-- RPC helpers for counters
create or replace function increment_campaign_open_count(cid bigint)
returns void language sql as $$
  update campaigns set open_count = open_count + 1 where id = cid;
$$;

create or replace function increment_campaign_click_count(cid bigint)
returns void language sql as $$
  update campaigns set click_count = click_count + 1 where id = cid;
$$;


