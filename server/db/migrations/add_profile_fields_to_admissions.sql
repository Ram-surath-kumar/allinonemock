ALTER TABLE admission_applications 
ADD COLUMN IF NOT EXISTS address_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS guardian_info JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}'::jsonb;
