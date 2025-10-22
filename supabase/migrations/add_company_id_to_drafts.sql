-- Migration: Add company_id to drafts table and replace experience_id
-- This supports the refactor from experience-level to company-level architecture

-- Add company_id column (nullable initially for backward compatibility)
ALTER TABLE drafts ADD COLUMN IF NOT EXISTS company_id text;

-- Copy data from experience_id to company_id if it exists
UPDATE drafts 
SET company_id = experience_id 
WHERE company_id IS NULL AND experience_id IS NOT NULL;

-- Now make company_id not null since we've migrated the data
ALTER TABLE drafts ALTER COLUMN company_id SET NOT NULL;

-- Optional: Drop experience_id column after migration
-- Uncomment this line after verifying the migration works
-- ALTER TABLE drafts DROP COLUMN IF EXISTS experience_id;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_drafts_company_id ON drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_drafts_user_company ON drafts(user_id, company_id);
