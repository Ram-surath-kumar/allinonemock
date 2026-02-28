-- Create chat_groups table
CREATE TABLE IF NOT EXISTS chat_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    avatar_url TEXT,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    left_at TIMESTAMPTZ,
    UNIQUE(group_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES chat_groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id),
    receiver_id UUID REFERENCES auth.users(id), -- For 1:1 messages
    content TEXT,
    type TEXT DEFAULT 'text',
    reply_to_id UUID REFERENCES chat_messages(id),
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
    is_deleted BOOLEAN DEFAULT false
);

-- Create chat_settings table
CREATE TABLE IF NOT EXISTS chat_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    muted_chats TEXT[] DEFAULT '{}', -- Array of group_ids or user_ids
    deleted_conversations TEXT[] DEFAULT '{}',
    archived TEXT[] DEFAULT '{}',
    cleared_at JSONB DEFAULT '{}', -- Map of chatId -> timestamp
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON chat_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON chat_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
