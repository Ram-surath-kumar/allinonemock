-- Migration: Fee Management Enhancements & Library Seeding

-- 1. Update fee_heads type constraint
ALTER TABLE fee_heads DROP CONSTRAINT IF EXISTS fee_heads_type_check;
ALTER TABLE fee_heads ADD CONSTRAINT fee_heads_type_check CHECK (type IN (
    'academic', 'hostel', 'residential', 'co_curricular', 'support', 'infrastructure', 
    'examination', 'special', 'penalty', 'tuition', 'transport', 'library', 'lab', 'mess', 'other'
));

-- 2. Enhance student_fee_assignments
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS lock_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES users(id);
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS concessional_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE student_fee_assignments ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]';

-- 3. Create Fee Assignment Rules
CREATE TABLE IF NOT EXISTS fee_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    student_category TEXT, -- Matches admissions.category
    hostel_status TEXT CHECK (hostel_status IN ('resident', 'day_scholar', 'any')),
    program_id UUID REFERENCES academic_programs(id),
    fee_structure_id UUID REFERENCES fee_structures(id),
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Fee Penalty Configs
CREATE TABLE IF NOT EXISTS fee_penalty_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('flat', 'daily_linear', 'daily_compound')),
    amount DECIMAL(12, 2) NOT NULL,
    grace_period_days INTEGER DEFAULT 0,
    max_penalty_cap DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Seed Fee Heads Library
-- Academic Fees
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Tuition Fee', 'academic', false),
('Lab Fee', 'academic', false),
('Practical Fee', 'academic', false),
('Course Fee', 'academic', false),
('Exam Fee', 'academic', false),
('Re-exam Fee', 'academic', false),
('Thesis/Project Fee', 'academic', false),
('Semester Fee', 'academic', false)
ON CONFLICT DO NOTHING;

-- Hostel & Residential
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Hostel Fee', 'residential', false),
('Mess Fee', 'residential', false),
('Room Rent', 'residential', false),
('Caution Deposit', 'residential', true),
('Hostel Maintenance', 'residential', false),
('Utility Charges', 'residential', false)
ON CONFLICT DO NOTHING;

-- Co-Curricular
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Sports Fee', 'co_curricular', false),
('Club Membership', 'co_curricular', false),
('Event Registration', 'co_curricular', false),
('Uniform & Materials', 'co_curricular', false),
('Field Trip', 'co_curricular', false),
('Excursion', 'co_curricular', false)
ON CONFLICT DO NOTHING;

-- Support Services
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Library Fee', 'support', false),
('Student Services Fee', 'support', false),
('Medical Insurance', 'support', false),
('Transportation', 'support', false),
('Internet & WiFi', 'support', false),
('Alumni Fund', 'support', false)
ON CONFLICT DO NOTHING;

-- Technology & Infrastructure
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Lab Equipment Fee', 'infrastructure', false),
('Software License Fee', 'infrastructure', false),
('Computer Fee', 'infrastructure', false),
('Building Development', 'infrastructure', false),
('Infrastructure Maintenance', 'infrastructure', false)
ON CONFLICT DO NOTHING;

-- Examination & Assessment
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Internal Assessment', 'examination', false),
('Final Exam', 'examination', false),
('Practical Exam', 'examination', false),
('Project Evaluation', 'examination', false),
('Certification Exam', 'examination', false)
ON CONFLICT DO NOTHING;

-- Special Charges
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Late Fee Submission', 'special', false),
('Duplicate Certificate', 'special', false),
('Transcript Charges', 'special', false),
('Mark Sheet Charges', 'special', false),
('Conduct Certificate', 'special', false),
('Convocation Fee', 'special', false)
ON CONFLICT DO NOTHING;

-- Penalties & Fines
INSERT INTO fee_heads (name, type, is_refundable) VALUES
('Late Fee Payment Penalty', 'penalty', false),
('Document Submission Late Fee', 'penalty', false),
('Hostel Violation Fine', 'penalty', false),
('Library Fine', 'penalty', false),
('Discipline Fine', 'penalty', false),
('Damage Charges', 'penalty', false)
ON CONFLICT DO NOTHING;
