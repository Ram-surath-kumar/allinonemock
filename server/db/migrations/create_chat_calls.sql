-- Create chat_calls table for audio and video calling signaling
CREATE TABLE IF NOT EXISTS chat_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caller_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('audio', 'video')),
  status TEXT CHECK (status IN ('initiated', 'ongoing', 'ended', 'missed', 'rejected')) DEFAULT 'initiated',
  room_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookup of active calls
CREATE INDEX IF NOT EXISTS idx_chat_calls_receiver_status ON chat_calls(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_chat_calls_caller_id ON chat_calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_chat_calls_status ON chat_calls(status);
