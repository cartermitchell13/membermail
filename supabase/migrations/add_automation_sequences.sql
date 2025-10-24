-- Automation infrastructure: sequences, steps, enrollments, jobs

-- Sequences represent a multi-email automation owned by a community
CREATE TABLE IF NOT EXISTS automation_sequences (
    id BIGSERIAL PRIMARY KEY,
    community_id BIGINT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_event TEXT NOT NULL,
    trigger_label TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
    timezone TEXT DEFAULT 'UTC',
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_sequences_community
    ON automation_sequences(community_id);

-- Individual email steps inside a sequence. Each step is backed by a campaign record.
CREATE TABLE IF NOT EXISTS automation_steps (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL REFERENCES automation_sequences(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    position INT NOT NULL CHECK (position > 0),
    delay_value INT NOT NULL DEFAULT 0 CHECK (delay_value >= 0),
    delay_unit TEXT NOT NULL DEFAULT 'minutes' CHECK (delay_unit IN ('minutes', 'hours', 'days')),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sequence_id, position)
);

CREATE INDEX IF NOT EXISTS idx_automation_steps_sequence
    ON automation_steps(sequence_id);

CREATE INDEX IF NOT EXISTS idx_automation_steps_campaign
    ON automation_steps(campaign_id);

-- Track member enrollment into a sequence and current progress
CREATE TABLE IF NOT EXISTS automation_enrollments (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT NOT NULL REFERENCES automation_sequences(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),
    current_step_id BIGINT REFERENCES automation_steps(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sequence_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_automation_enrollments_sequence
    ON automation_enrollments(sequence_id);

CREATE INDEX IF NOT EXISTS idx_automation_enrollments_member
    ON automation_enrollments(member_id);

-- Jobs drive the scheduled execution of automation steps
CREATE TABLE IF NOT EXISTS automation_jobs (
    id BIGSERIAL PRIMARY KEY,
    sequence_id BIGINT REFERENCES automation_sequences(id) ON DELETE CASCADE,
    step_id BIGINT REFERENCES automation_steps(id) ON DELETE CASCADE,
    member_id BIGINT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    campaign_id BIGINT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_due
    ON automation_jobs(status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_automation_jobs_member
    ON automation_jobs(member_id);

-- Campaign level metadata for automation support
ALTER TABLE campaigns
    ADD COLUMN IF NOT EXISTS send_mode TEXT NOT NULL DEFAULT 'manual'
        CHECK (send_mode IN ('manual', 'automation')),
    ADD COLUMN IF NOT EXISTS trigger_event TEXT,
    ADD COLUMN IF NOT EXISTS trigger_delay_value INT DEFAULT 0 CHECK (trigger_delay_value >= 0),
    ADD COLUMN IF NOT EXISTS trigger_delay_unit TEXT DEFAULT 'minutes'
        CHECK (trigger_delay_unit IN ('minutes', 'hours', 'days')),
    ADD COLUMN IF NOT EXISTS automation_sequence_id BIGINT REFERENCES automation_sequences(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS automation_status TEXT DEFAULT 'draft'
        CHECK (automation_status IN ('draft', 'active', 'paused', 'archived')),
    ADD COLUMN IF NOT EXISTS quiet_hours_enabled BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS quiet_hours_start INT DEFAULT 9 CHECK (quiet_hours_start BETWEEN 0 AND 23),
    ADD COLUMN IF NOT EXISTS quiet_hours_end INT DEFAULT 20 CHECK (quiet_hours_end BETWEEN 0 AND 23);

CREATE INDEX IF NOT EXISTS idx_campaigns_send_mode
    ON campaigns(send_mode);

CREATE INDEX IF NOT EXISTS idx_campaigns_automation_sequence
    ON campaigns(automation_sequence_id);

