create table if not exists course_progress_states (
    id bigserial primary key,
    member_id bigint not null references members(id) on delete cascade,
    course_id text not null,
    lesson_id text not null,
    status text not null default 'not_started',
    started_at timestamptz,
    completed_at timestamptz,
    last_interaction_at timestamptz,
    metadata jsonb,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now()),
    unique (member_id, course_id, lesson_id)
);

create table if not exists course_trigger_watches (
    id bigserial primary key,
    member_id bigint not null references members(id) on delete cascade,
    course_id text not null,
    chapter_id text,
    lesson_id text,
    trigger_kind text not null,
    trigger_metadata jsonb,
    deadline_at timestamptz,
    satisfied_at timestamptz,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists course_trigger_watches_active_deadline_idx
    on course_trigger_watches (trigger_kind, deadline_at)
    where satisfied_at is null;

create index if not exists course_trigger_watches_member_idx
    on course_trigger_watches (member_id);

alter table automation_steps
    add column if not exists metadata jsonb;

alter table campaigns
    add column if not exists automation_trigger_metadata jsonb;
