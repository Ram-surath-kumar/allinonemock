import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://vzkbyzpqnojhlazwopvz.supabase.co';
// Use service role key for backend operations (bypasses RLS) if available, otherwise fall back to anon key
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY';

// Log which key is being used (for debugging)
const hasValidServiceKey = supabaseServiceKey &&
  supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE' &&
  supabaseServiceKey.trim() !== '';

if (!hasValidServiceKey) {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found or is a placeholder.');
  console.warn('⚠️  Write operations may fail due to Row Level Security (RLS) policies.');
  console.warn('⚠️  Please add SUPABASE_SERVICE_ROLE_KEY to your server/.env file.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY_HERE') {
  console.error('❌ ERROR: SUPABASE_ANON_KEY is missing or invalid.');
  console.error('❌ Please add SUPABASE_ANON_KEY to your server/.env file.');
  process.exit(1);
}

// Use service role key for ALL operations (read and write) to avoid RLS issues
// If service key is not available or is a placeholder, use anon key
export const supabase = hasValidServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : createClient(supabaseUrl, supabaseAnonKey);

// Always use service role key for admin operations if available
export const supabaseAdmin = hasValidServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  : createClient(supabaseUrl, supabaseAnonKey);
