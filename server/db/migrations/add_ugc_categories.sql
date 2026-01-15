-- Add UGC/AICTE Compliance Columns to student_profiles
ALTER TABLE student_profiles
  -- Study Mode / Status
  ADD COLUMN IF NOT EXISTS study_mode text DEFAULT 'Regular', -- Regular, Distance, Part-Time, Sponsored, Research
  
  -- Social Status (Extended)
  ADD COLUMN IF NOT EXISTS bpl_status boolean DEFAULT false, -- Below Poverty Line
  ADD COLUMN IF NOT EXISTS minority_status boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS minority_type text, -- Muslim, Christian, Sikh, Buddhist, Parsi, Jain
  
  -- Nationality Details
  ADD COLUMN IF NOT EXISTS nationality_type text DEFAULT 'Indian'; -- Indian, NRI, OCI, Foreign
