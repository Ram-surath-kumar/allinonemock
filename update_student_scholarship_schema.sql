 -- Migration: Add Student Criteria for Scholarships
-- Run this in Supabase SQL Editor

-- 1. Add demographic and academic columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS category TEXT; -- e.g. General, OBC, SC/ST
ALTER TABLE users ADD COLUMN IF NOT EXISTS minority_community BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_bpl BOOLEAN DEFAULT FALSE; -- Below Poverty Line
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT FALSE; -- Person with Disability
ALTER TABLE users ADD COLUMN IF NOT EXISTS marks_10th_pct DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS marks_12th_pct DECIMAL(5,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS entrance_exam_score DECIMAL(10,2);
ALTER TABLE users ADD COLUMN IF NOT EXISTS family_income DECIMAL(12,2);

-- New addition: First Graduate
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_graduate BOOLEAN DEFAULT FALSE;

-- 2. Add Rules column to scholarships table
-- This config will store filters like: {"min_marks_12th": 90, "category": "OBC", "is_bpl": true}
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS rules JSONB DEFAULT '{}';

-- 3. Comment for documentation
COMMENT ON COLUMN scholarships.rules IS 'JSON Config for eligibility: e.g. {"gender": "female", "min_marks_12th": 85}';

-- 4. Ensure admission_applications table also captures these fields for new applicants
ALTER TABLE admission_applications ADD COLUMN IF NOT EXISTS is_first_graduate BOOLEAN DEFAULT FALSE;
