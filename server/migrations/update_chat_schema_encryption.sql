-- Migration for End-to-End Encryption (E2EE)

-- 1. Create table for storing User Public Keys
CREATE TABLE IF NOT EXISTS public.user_public_keys (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add encryption columns to chat_messages
DO $$
BEGIN
    -- Encrypted content (main payload)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'encrypted_content') THEN
        ALTER TABLE public.chat_messages ADD COLUMN encrypted_content TEXT;
    END IF;

    -- Initialization Vector (IV) for AES-GCM
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'iv') THEN
        ALTER TABLE public.chat_messages ADD COLUMN iv TEXT;
    END IF;

    -- Encrypted Session Key (for Sender)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'sender_key_encrypted') THEN
        ALTER TABLE public.chat_messages ADD COLUMN sender_key_encrypted TEXT;
    END IF;

    -- Encrypted Session Key (for Recipient)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chat_messages' AND column_name = 'recipient_key_encrypted') THEN
        ALTER TABLE public.chat_messages ADD COLUMN recipient_key_encrypted TEXT;
    END IF;
END $$;

-- 3. Enable RLS on user_public_keys
ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;

-- 4. Policies for user_public_keys
-- Everyone can read others' public keys to send messages
CREATE POLICY "Public keys are viewable by everyone" 
ON public.user_public_keys FOR SELECT 
USING (true);

-- Users can insert/update their own key
CREATE POLICY "Users can insert their own public key" 
ON public.user_public_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own public key" 
ON public.user_public_keys FOR UPDATE 
USING (auth.uid() = user_id);
