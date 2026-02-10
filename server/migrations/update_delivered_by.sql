-- Add delivered_by column to chat_messages if it doesn't exist
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS delivered_by UUID[] DEFAULT '{}';

-- Ensure it's an array of UUIDs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' 
        AND column_name = 'delivered_by'
    ) THEN
        ALTER TABLE chat_messages ADD COLUMN delivered_by UUID[] DEFAULT '{}';
    END IF;
END $$;
