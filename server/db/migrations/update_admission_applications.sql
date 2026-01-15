-- Add UGC Fields to admission_applications
ALTER TABLE admission_applications
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS category TEXT, -- General, OBC, SC, ST, EWS
    ADD COLUMN IF NOT EXISTS study_mode TEXT DEFAULT 'Regular',
    ADD COLUMN IF NOT EXISTS nationality_type TEXT DEFAULT 'Indian',
    
    -- Social Status flags
    ADD COLUMN IF NOT EXISTS is_bpl BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_pwd BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_minority BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS minority_type TEXT;
