-- Sender identity fields for profiles

ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS display_name TEXT,
    ADD COLUMN IF NOT EXISTS mail_username TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_mail_username_unique
    ON profiles ((lower(mail_username)))
    WHERE mail_username IS NOT NULL;

