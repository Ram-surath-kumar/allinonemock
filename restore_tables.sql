-- SchoolSphere ERP: Chat Schema Restoration
-- Recreates missing chat tables and ensures email columns are present

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create chat_groups table
CREATE TABLE IF NOT EXISTS public.chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    left_at TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

-- 3. Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id),
    receiver_id UUID REFERENCES public.users(id), -- For 1:1 messages
    content TEXT,
    type TEXT DEFAULT 'text',
    reply_to_id UUID REFERENCES public.chat_messages(id),
    file_url TEXT,
    file_name TEXT,
    file_type TEXT,
    file_size BIGINT,
    is_pinned BOOLEAN DEFAULT false,
    starred_by UUID[] DEFAULT '{}',
    deleted_for UUID[] DEFAULT '{}',
    reactions JSONB DEFAULT '[]',
    read BOOLEAN DEFAULT false, -- For 1:1
    read_by UUID[] DEFAULT '{}', -- For groups
    delivered_by UUID[] DEFAULT '{}', -- For double ticks
    recording_duration INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    is_deleted BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    edit_count INTEGER DEFAULT 0,
    encrypted_content TEXT,
    iv TEXT,
    sender_key_encrypted TEXT,
    recipient_key_encrypted TEXT
);

-- 4. Create chat_settings table
CREATE TABLE IF NOT EXISTS public.chat_settings (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    muted_chats TEXT[] DEFAULT '{}', -- Array of group_ids or user_ids
    deleted_conversations TEXT[] DEFAULT '{}',
    archived TEXT[] DEFAULT '{}',
    cleared_at JSONB DEFAULT '{}', -- Map of chatId -> timestamp
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Create chat_calls table
CREATE TABLE IF NOT EXISTS public.chat_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('audio', 'video')),
  status TEXT CHECK (status IN ('initiated', 'ongoing', 'ended', 'missed', 'rejected')) DEFAULT 'initiated',
  room_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Indexes
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_calls_receiver_status ON public.chat_calls(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_calls_caller_id ON public.chat_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_chat_calls_status ON public.chat_calls(status);

-- 7. Add email columns to all previously deleted tables per user request
-- Add email to chat_settings
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_settings' AND column_name='email') THEN 
        ALTER TABLE public.chat_settings ADD COLUMN email TEXT; 
    END IF;
    
    -- Update existing rows based on user_id
    UPDATE public.chat_settings cs
    SET email = u.email
    FROM public.users u
    WHERE cs.user_id = u.id AND cs.email IS NULL;
END $$;

-- Add sender_email and receiver_email to chat_calls
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_calls' AND column_name='caller_email') THEN 
        ALTER TABLE public.chat_calls ADD COLUMN caller_email TEXT; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_calls' AND column_name='receiver_email') THEN 
        ALTER TABLE public.chat_calls ADD COLUMN receiver_email TEXT; 
    END IF;
    
    -- Sync caller email
    UPDATE public.chat_calls cc
    SET caller_email = u.email
    FROM public.users u
    WHERE cc.caller_id = u.id AND cc.caller_email IS NULL;
    
    -- Sync receiver email
    UPDATE public.chat_calls cc
    SET receiver_email = u.email
    FROM public.users u
    WHERE cc.receiver_id = u.id AND cc.receiver_email IS NULL;
END $$;

-- Add sender_email and receiver_email to chat_messages
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='sender_email') THEN 
        ALTER TABLE public.chat_messages ADD COLUMN sender_email TEXT; 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chat_messages' AND column_name='receiver_email') THEN 
        ALTER TABLE public.chat_messages ADD COLUMN receiver_email TEXT; 
    END IF;
    
    -- Sync sender email
    UPDATE public.chat_messages cm
    SET sender_email = u.email
    FROM public.users u
    WHERE cm.sender_id = u.id AND cm.sender_email IS NULL;
    
    -- Sync receiver email
    UPDATE public.chat_messages cm
    SET receiver_email = u.email
    FROM public.users u
    WHERE cm.receiver_id = u.id AND cm.receiver_email IS NULL;
END $$;

-- Add user_email to group_members
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='group_members' AND column_name='user_email') THEN 
        ALTER TABLE public.group_members ADD COLUMN user_email TEXT; 
    END IF;
    
    -- Sync user email
    UPDATE public.group_members gm
    SET user_email = u.email
    FROM public.users u
    WHERE gm.user_id = u.id AND gm.user_email IS NULL;
END $$;
