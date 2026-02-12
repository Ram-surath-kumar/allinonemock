-- Revised Migration: More Robust for Supabase SQL Editor
-- Run this in the SQL Editor

-- Step 1: Ensure all required columns exist in the users table
ALTER TABLE public.users 
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
  ADD COLUMN IF NOT EXISTS college_email text, -- Note: dropped UNIQUE constraint here to avoid potential conflicts on existing data, add later if needed
  ADD COLUMN IF NOT EXISTS minority_community text,
  ADD COLUMN IF NOT EXISTS is_bpl text,
  -- For boolean flags, use BOOLEAN if possible, but keep text if established schema dictates. 
  -- Error indicated boolean type mismatch, so ensuring BOOLEAN columns here.
  ADD COLUMN IF NOT EXISTS is_pwd boolean, 
  ADD COLUMN IF NOT EXISTS marks_10th_pct numeric,
  ADD COLUMN IF NOT EXISTS marks_12th_pct numeric,
  ADD COLUMN IF NOT EXISTS entrance_exam_score numeric,
  ADD COLUMN IF NOT EXISTS family_income numeric,
  ADD COLUMN IF NOT EXISTS siblings_count integer,
  ADD COLUMN IF NOT EXISTS is_first_graduate boolean,
  
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
  ADD COLUMN IF NOT EXISTS medical_history text,

  -- Loop ID (if missing)
  ADD COLUMN IF NOT EXISTS loopid text;

-- Step 2: Update users with data from student_profiles
UPDATE public.users
SET 
  dob = sp.dob,
  gender = sp.gender,
  blood_group = sp.blood_group,
  religion = sp.religion,
  category = sp.category,
  nationality = sp.nationality,
  mother_tongue = sp.mother_tongue,
  aadhar_no = sp.aadhar_no,
  pan_no = sp.pan_no,
  college_email = sp.college_email,
  personal_email = sp.personal_email,
  personal_mobile = sp.personal_mobile,
  alt_mobile = sp.alt_mobile,
  landline_phone = sp.landline_phone,
  current_street = sp.current_street,
  current_city = sp.current_city,
  current_state = sp.current_state,
  current_pincode = sp.current_pincode,
  current_country = sp.current_country,
  permanent_street = sp.permanent_street,
  permanent_city = sp.permanent_city,
  permanent_state = sp.permanent_state,
  permanent_pincode = sp.permanent_pincode,
  permanent_country = sp.permanent_country,
  father_name = sp.father_name,
  father_occupation = sp.father_occupation,
  mother_name = sp.mother_name,
  mother_occupation = sp.mother_occupation,
  family_income = CAST(NULLIF(sp.family_annual_income, '') AS NUMERIC),
  siblings_count = sp.siblings_count,
  is_first_graduate = CASE WHEN sp.first_gen_learner = true THEN true ELSE false END,
  is_pwd = CASE WHEN sp.pwd_status = true THEN true ELSE false END,
  emergency_contact_relation = sp.emergency_contact_relation,
  emergency_contact_address = sp.emergency_contact_address,
  loopid = COALESCE(public.users.loopid, sp.student_id_no)
FROM public.student_profiles sp
WHERE public.users.id = sp.user_id::uuid; -- Explicitly cast to uuid for join safety
