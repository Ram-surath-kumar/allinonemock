-- Temporary fix: Disable RLS on departments table to allow inserts
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vzkbyzpqnojhlazwopvz/sql/new

-- Disable RLS on departments table
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'departments';

-- Note: This allows anyone with the anon key to insert/update/delete departments
-- For production, you should use the service role key instead

