-- Create table for storing user public keys for E2EE
CREATE TABLE IF NOT EXISTS user_public_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_public_keys ENABLE ROW LEVEL SECURITY;

-- Policies
-- Everyone can read public keys
CREATE POLICY "Public keys are viewable by everyone" 
ON user_public_keys FOR SELECT 
USING (true);

-- Users can insert/update their own public key
CREATE POLICY "Users can insert/update their own public key" 
ON user_public_keys FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
