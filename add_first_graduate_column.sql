-- Add is_first_graduate column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_graduate BOOLEAN DEFAULT FALSE;

-- Add is_first_graduate column to admission_applications table
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS is_first_graduate BOOLEAN DEFAULT FALSE;

-- Ensure gender column is text (it likely is, but good to double check implicitely via Usage)
-- No change needed for gender if it's already text/varchar
