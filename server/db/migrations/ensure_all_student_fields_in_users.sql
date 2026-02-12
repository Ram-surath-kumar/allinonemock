-- Migration: Ensure ALL student fields exist in users table
-- Run this in Supabase SQL Editor BEFORE transferring data

ALTER TABLE users 
  -- Demographics & Identity
  ADD COLUMN IF NOT EXISTS dob date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS blood_group text,
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS mother_tongue text,
  ADD COLUMN IF NOT EXISTS aadhar_no text,
  ADD COLUMN IF NOT EXISTS pan_no text,
  
  -- Academic & Scholarship Criteria
  ADD COLUMN IF NOT EXISTS college_email text UNIQUE,
  ADD COLUMN IF NOT EXISTS minority_community text,
  ADD COLUMN IF NOT EXISTS is_bpl text,
  ADD COLUMN IF NOT EXISTS is_pwd text,
  ADD COLUMN IF NOT EXISTS marks_10th_pct numeric,
  ADD COLUMN IF NOT EXISTS marks_12th_pct numeric,
  ADD COLUMN IF NOT EXISTS entrance_exam_score numeric,
  ADD COLUMN IF NOT EXISTS family_income numeric,
  ADD COLUMN IF NOT EXISTS siblings_count integer,
  ADD COLUMN IF NOT EXISTS is_first_graduate text,
  
  -- Contact Information
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS personal_mobile text,
  ADD COLUMN IF NOT EXISTS alt_mobile text,
  ADD COLUMN IF NOT EXISTS landline_phone text,
  
  -- Current Address
  ADD COLUMN IF NOT EXISTS current_street text,
  ADD COLUMN IF NOT EXISTS current_city text,
  ADD COLUMN IF NOT EXISTS current_state text,
  ADD COLUMN IF NOT EXISTS current_pincode text,
  ADD COLUMN IF NOT EXISTS current_country text,
  
  -- Permanent Address
  ADD COLUMN IF NOT EXISTS permanent_street text,
  ADD COLUMN IF NOT EXISTS permanent_city text,
  ADD COLUMN IF NOT EXISTS permanent_state text,
  ADD COLUMN IF NOT EXISTS permanent_pincode text,
  ADD COLUMN IF NOT EXISTS permanent_country text,

  -- Family Information
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS father_occupation text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS mother_occupation text,

  -- Emergency & Health
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS emergency_contact_number text,
  ADD COLUMN IF NOT EXISTS emergency_contact_address text,
  ADD COLUMN IF NOT EXISTS medical_history text;

-- Consistency: Set loopid for existing students if missing and we have it in student_id_no
UPDATE users u
SET loopid = sp.student_id_no
FROM student_profiles sp
WHERE u.id = sp.user_id AND (u.loopid IS NULL OR u.loopid = '');
