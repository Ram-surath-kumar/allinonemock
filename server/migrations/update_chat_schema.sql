-- Migration to support WhatsApp-style "Double Tick" (Delivered) status

-- Add delivered_by column to chat_messages if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'delivered_by') THEN
        ALTER TABLE chat_messages ADD COLUMN delivered_by UUID[] DEFAULT '{}';
    END IF;
END $$;

-- Add recording_duration column for Voice Notes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'recording_duration') THEN
        ALTER TABLE chat_messages ADD COLUMN recording_duration INTEGER; -- Duration in seconds
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_delivered_by ON chat_messages USING GIN (delivered_by);
