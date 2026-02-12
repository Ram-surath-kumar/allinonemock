-- Migration: Ensure student fields exist in users table
-- Target Table: users
-- Purpose: Consolidate student profile data from student_profiles to users table

ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS minority_community text,
  ADD COLUMN IF NOT EXISTS is_bpl text,
  ADD COLUMN IF NOT EXISTS is_pwd text,
  ADD COLUMN IF NOT EXISTS marks_10th_pct numeric,
  ADD COLUMN IF NOT EXISTS marks_12th_pct numeric,
  ADD COLUMN IF NOT EXISTS entrance_exam_score numeric,
  ADD COLUMN IF NOT EXISTS family_income numeric,
  ADD COLUMN IF NOT EXISTS is_first_graduate text,
  ADD COLUMN IF NOT EXISTS college_email text UNIQUE;

-- Add comments for clarity
COMMENT ON COLUMN users.college_email IS 'Alternative college email for the student';
COMMENT ON COLUMN users.is_first_graduate IS 'Whether the student is the first graduate in their family';
