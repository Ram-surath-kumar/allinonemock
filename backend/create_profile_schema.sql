-- Create Student Profiles Table
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE, -- Links to Supabase Auth User
    admission_number TEXT UNIQUE,
    
    -- Personal Information (JSONB for flexibility)
    -- Structure: { dob, gender, blood_group, nationality, religion, caste, social_category, aadhar_no, pan_no }
    personal_info JSONB DEFAULT '{}'::jsonb,

    -- Address Information
    -- Structure: { 
    --   current: { street, city, state, zip, country },
    --   permanent: { street, city, state, zip, country }
    -- }
    address_info JSONB DEFAULT '{}'::jsonb,

    -- Guardian/Parent Information
    -- Structure: {
    --   father: { name, occupation, phone, email, income },
    --   mother: { name, occupation, phone, email, income },
    --   guardian: { name, relation, phone, email, address }
    -- }
    guardian_info JSONB DEFAULT '{}'::jsonb,

    -- Emergency Contacts
    -- Structure: [ { name, relation, phone } ]
    emergency_contacts JSONB DEFAULT '[]'::jsonb,

    -- Medical History
    -- Structure: { blood_group, allergies, chronic_illness, medications, doctor_contact }
    medical_history JSONB DEFAULT '{}'::jsonb,

    -- Documents (Links to Supabase Storage)
    -- Structure: { photo_url, aadhar_card, transfer_certificate, marksheets: [] }
    documents JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public Read (for development simplicity, should be restricted later)
CREATE POLICY "Public profiles are viewable by everyone" 
ON student_profiles FOR SELECT 
USING (true);

-- 2. Users can insert their own profile
CREATE POLICY "Users can create their own profile" 
ON student_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own profile
CREATE POLICY "Users can update their own profile" 
ON student_profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- 4. Admins (Service Role) can do everything
-- (Implicitly handled if using service role key, but good to be explicit for other admin roles)

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_student_profiles_updated_at
    BEFORE UPDATE ON student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
