-- Add missing student profile fields to users table
ALTER TABLE public.users
  -- Academic Info
  ADD COLUMN IF NOT EXISTS student_id_no TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS section TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_date DATE DEFAULT CURRENT_DATE,
  
  -- Personal / Identity Info
  ADD COLUMN IF NOT EXISTS nationality_type TEXT,
  ADD COLUMN IF NOT EXISTS pan_no TEXT,
  ADD COLUMN IF NOT EXISTS voter_id TEXT,
  ADD COLUMN IF NOT EXISTS driving_license TEXT,
  ADD COLUMN IF NOT EXISTS passport_no TEXT,
  
  -- Status & Flags
  ADD COLUMN IF NOT EXISTS study_mode TEXT,
  ADD COLUMN IF NOT EXISTS minority_type TEXT,
  ADD COLUMN IF NOT EXISTS pwd_details TEXT,
  
  -- Guardian Details (Specific to student)
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relation TEXT,
  ADD COLUMN IF NOT EXISTS guardian_contact TEXT,
  
  -- Medical Details
  ADD COLUMN IF NOT EXISTS allergies TEXT,
  ADD COLUMN IF NOT EXISTS medical_conditions TEXT,
  
  -- Metadata
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS document_uploads JSONB DEFAULT '{}'::jsonb;
