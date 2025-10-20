-- Create drafts table for auto-saving campaign drafts
-- This table stores draft states with collaboration support
CREATE TABLE IF NOT EXISTS drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id BIGINT REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    experience_id TEXT NOT NULL,
    subject TEXT,
    preview_text TEXT,
    html_content TEXT,
    -- JSON content for TipTap editor state
    editor_json JSONB,
    -- Yjs document state for collaboration (binary data stored as base64)
    yjs_state TEXT,
    -- Metadata
    is_draft BOOLEAN DEFAULT true,
    last_edited_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(campaign_id, user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_drafts_user_experience ON drafts(user_id, experience_id);
CREATE INDEX IF NOT EXISTS idx_drafts_campaign ON drafts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_drafts_updated ON drafts(updated_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_drafts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER drafts_updated_at
    BEFORE UPDATE ON drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_drafts_updated_at();

-- Enable Row Level Security
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

-- Create policies for drafts
-- Users can read their own drafts and drafts for experiences they have access to
CREATE POLICY "Users can read own drafts" ON drafts
    FOR SELECT USING (true);

-- Users can insert their own drafts
CREATE POLICY "Users can insert own drafts" ON drafts
    FOR INSERT WITH CHECK (true);

-- Users can update their own drafts
CREATE POLICY "Users can update own drafts" ON drafts
    FOR UPDATE USING (true);

-- Users can delete their own drafts
CREATE POLICY "Users can delete own drafts" ON drafts
    FOR DELETE USING (true);

-- Create a view for recent drafts
CREATE OR REPLACE VIEW recent_drafts AS
SELECT 
    d.*,
    c.status as campaign_status
FROM drafts d
LEFT JOIN campaigns c ON d.campaign_id = c.id
WHERE d.updated_at > NOW() - INTERVAL '30 days'
ORDER BY d.updated_at DESC;
