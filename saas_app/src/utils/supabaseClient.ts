import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lhwbadpbmwokdyjgqfxy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxod2JhZHBibXdva2R5amdxZnh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyODkzMDIsImV4cCI6MjA5NDg2NTMwMn0.orvUNhY5oD5lYWoDsMlAGgSXQlm1YcuTRUDvVO9gzTg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
