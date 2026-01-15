-- Add SIS Master Data columns to student_profiles table

ALTER TABLE student_profiles
  -- IDs & Academic
  ADD COLUMN IF NOT EXISTS student_id_no text UNIQUE, -- YYYY_DEPT_SECTION_SEQUENTIAL
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS enrollment_date date DEFAULT CURRENT_DATE,
  
  -- Personal Details
  ADD COLUMN IF NOT EXISTS category text, -- General, OBC, SC, ST, EWS
  ADD COLUMN IF NOT EXISTS religion text,
  ADD COLUMN IF NOT EXISTS nationality text,
  ADD COLUMN IF NOT EXISTS mother_tongue text,
  ADD COLUMN IF NOT EXISTS pwd_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pwd_details text,
  
  -- Contact Information
  ADD COLUMN IF NOT EXISTS personal_email text,
  ADD COLUMN IF NOT EXISTS college_email text UNIQUE,
  ADD COLUMN IF NOT EXISTS personal_mobile text,
  ADD COLUMN IF NOT EXISTS alt_mobile text,
  ADD COLUMN IF NOT EXISTS landline_phone text,
  
  -- Address Details (Current)
  ADD COLUMN IF NOT EXISTS current_street text,
  ADD COLUMN IF NOT EXISTS current_city text,
  ADD COLUMN IF NOT EXISTS current_state text,
  ADD COLUMN IF NOT EXISTS current_pincode text,
  ADD COLUMN IF NOT EXISTS current_country text,
  
  -- Address Details (Permanent)
  ADD COLUMN IF NOT EXISTS permanent_street text,
  ADD COLUMN IF NOT EXISTS permanent_city text,
  ADD COLUMN IF NOT EXISTS permanent_state text,
  ADD COLUMN IF NOT EXISTS permanent_pincode text,
  ADD COLUMN IF NOT EXISTS permanent_country text,
  ADD COLUMN IF NOT EXISTS comm_address_type text, -- Current / Permanent / Other

  -- Family Information
  ADD COLUMN IF NOT EXISTS father_name text,
  ADD COLUMN IF NOT EXISTS father_occupation text,
  ADD COLUMN IF NOT EXISTS mother_name text,
  ADD COLUMN IF NOT EXISTS mother_occupation text,
  ADD COLUMN IF NOT EXISTS family_annual_income text,
  ADD COLUMN IF NOT EXISTS siblings_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_gen_learner boolean DEFAULT false,
  
  -- Emergency Contact (Updating existing if needed, adding missing)
  ADD COLUMN IF NOT EXISTS emergency_contact_relation text,
  ADD COLUMN IF NOT EXISTS emergency_contact_address text,

  -- Identification Documents
  ADD COLUMN IF NOT EXISTS voter_id text,
  ADD COLUMN IF NOT EXISTS driving_license text,
  ADD COLUMN IF NOT EXISTS passport_no text,
  ADD COLUMN IF NOT EXISTS document_uploads jsonb DEFAULT '{}', -- URLs for Scanned files
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'Pending'; -- Verified/Pending/Rejected
