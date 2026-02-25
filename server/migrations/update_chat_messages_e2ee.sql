-- Add E2EE columns to chat_messages
ALTER TABLE chat_messages
ADD COLUMN IF NOT EXISTS encrypted_content TEXT,
ADD COLUMN IF NOT EXISTS iv TEXT,
ADD COLUMN IF NOT EXISTS sender_key_encrypted TEXT,
ADD COLUMN IF NOT EXISTS recipient_key_encrypted TEXT;

-- Verify columns exist (optional safety check block)
DO $$
BEGIN
    -- We just want to ensure they exist, the ALTER TABLE IF NOT EXISTS handles it.
    -- No complex logic needed here.
    NULL;
END $$;
