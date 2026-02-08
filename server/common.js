import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://vzkbyzpqnojhlazwopvz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY';

// Log which key is being used (for debugging)
const hasValidServiceKey = supabaseServiceKey &&
  supabaseServiceKey !== 'YOUR_SERVICE_ROLE_KEY_HERE' &&
  supabaseServiceKey.trim() !== '';

// console.log('[common.js] Init Supabase Client');
// console.log('[common.js] URL:', supabaseUrl);
// console.log('[common.js] Has Service Key:', hasValidServiceKey);
// console.log('[common.js] Service Key Length:', supabaseServiceKey ? supabaseServiceKey.length : 0);

if (!hasValidServiceKey) {
  console.warn('⚠️  WARNING: SUPABASE_SERVICE_ROLE_KEY not found or is a placeholder.');
  console.warn('⚠️  Write operations may fail due to Row Level Security (RLS) policies.');
  console.warn('⚠️  Please add SUPABASE_SERVICE_ROLE_KEY to your server/.env file.');
}

if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_ANON_KEY_HERE') {
  console.error('❌ ERROR: SUPABASE_ANON_KEY is missing or invalid.');
  console.error('❌ Please add SUPABASE_ANON_KEY to your server/.env file.');
  // Don't exit in serverless environment - let it fail gracefully
  if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
    process.exit(1);
  }
}

// Use service role key for ALL operations (read and write) to avoid RLS issues
// If service key is not available or is a placeholder, use anon key
// Use service role key for ALL operations (read and write) to avoid RLS issues
// If service key is not available or is a placeholder, use anon key
export const supabase = hasValidServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

// Always use service role key for admin operations if available
export const supabaseAdmin = hasValidServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

// Common error handler
export const handleError = (error, res, message = 'An error occurred') => {
  console.error(`${message}:`, error);
  res.status(500).json({
    data: null,
    error: error.message || message
  });
};

// Common success response
export const sendSuccess = (res, data) => {
  res.json({ data, error: null });
};

// Common validation error response
export const sendValidationError = (res, message) => {
  res.status(400).json({
    data: null,
    error: message
  });
};

