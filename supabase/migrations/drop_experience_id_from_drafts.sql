-- Migration: Drop experience_id from drafts now that company_id is required
-- This finalizes the refactor from experience-level to company-level architecture

-- Ensure company_id exists and is NOT NULL (should be handled by previous migration)
-- ALTER TABLE drafts ADD COLUMN IF NOT EXISTS company_id text;
-- ALTER TABLE drafts ALTER COLUMN company_id SET NOT NULL;

-- Drop dependent view before altering table
DROP VIEW IF EXISTS recent_drafts;

-- Drop experience_id column if present
ALTER TABLE drafts DROP COLUMN IF EXISTS experience_id;

-- Refresh helpful indexes (no-op if they already exist)
CREATE INDEX IF NOT EXISTS idx_drafts_company_id ON drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_company ON drafts(user_id, company_id);

-- Recreate recent_drafts view without experience_id (explicit column list)
CREATE OR REPLACE VIEW recent_drafts AS
SELECT 
    d.id,
    d.campaign_id,
    d.user_id,
    d.company_id,
    d.subject,
    d.preview_text,
    d.html_content,
    d.editor_json,
    d.yjs_state,
    d.is_draft,
    d.last_edited_by,
    d.created_at,
    d.updated_at,
    c.status AS campaign_status
FROM drafts d
LEFT JOIN campaigns c ON d.campaign_id = c.id
WHERE d.updated_at > NOW() - INTERVAL '30 days'
ORDER BY d.updated_at DESC;
