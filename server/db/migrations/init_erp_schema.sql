-- SchoolSphere ERP: Comprehensive Database Initialization Script (Robust Version)
-- This script ensures consistent UUID-based architecture across all modules.
-- It safely drops empty legacy tables and applies the finalized schema.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. Cleanup Legacy (Only Empty Tables)
-- ==========================================
DROP TABLE IF EXISTS public.facilities_buildings CASCADE;
DROP TABLE IF EXISTS public.facilities_rooms CASCADE;
DROP TABLE IF EXISTS public.facilities_equipment CASCADE;
DROP TABLE IF EXISTS public.facilities_bookings CASCADE;
DROP TABLE IF EXISTS public.facilities_documents CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.teacher_departments CASCADE;
DROP TABLE IF EXISTS public.semesters CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.hostels CASCADE;
DROP TABLE IF EXISTS public.hostel_rooms CASCADE;
DROP TABLE IF EXISTS public.hostel_allocations_api CASCADE;
DROP TABLE IF EXISTS public.hostel_applications CASCADE;
DROP TABLE IF EXISTS public.books CASCADE;
DROP TABLE IF EXISTS public.book_copies CASCADE;
DROP TABLE IF EXISTS public.library_members CASCADE;
DROP TABLE IF EXISTS public.book_issues CASCADE;
DROP TABLE IF EXISTS public.transport_routes CASCADE;
DROP TABLE IF EXISTS public.transport_stops CASCADE;
DROP TABLE IF EXISTS public.transport_vehicles CASCADE;
DROP TABLE IF EXISTS public.transport_route_vehicles CASCADE;
DROP TABLE IF EXISTS public.transport_registrations CASCADE;
DROP TABLE IF EXISTS public.transport_fee_payments CASCADE;
DROP TABLE IF EXISTS public.vehicle_notes CASCADE;
DROP TABLE IF EXISTS public.vehicle_tasks CASCADE;
DROP TABLE IF EXISTS public.fee_categories CASCADE;
DROP TABLE IF EXISTS public.fee_heads CASCADE;
DROP TABLE IF EXISTS public.scholarships CASCADE;
DROP TABLE IF EXISTS public.fee_structures CASCADE;
DROP TABLE IF EXISTS public.fee_structure_items CASCADE;
DROP TABLE IF EXISTS public.student_fee_assignments CASCADE;
DROP TABLE IF EXISTS public.fee_installments CASCADE;
DROP TABLE IF EXISTS public.adjustments CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.refund_requests CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.bank_transactions CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.journal_lines CASCADE;
DROP TABLE IF EXISTS public.fee_assignment_rules CASCADE;
DROP TABLE IF EXISTS public.fee_penalty_configs CASCADE;
DROP TABLE IF EXISTS public.tax_configs CASCADE;
DROP TABLE IF EXISTS public.tax_config CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.exam_timetable CASCADE;
DROP TABLE IF EXISTS public.hall_tickets CASCADE;
DROP TABLE IF EXISTS public.seating_plans CASCADE;
DROP TABLE IF EXISTS public.exam_attendance CASCADE;
DROP TABLE IF EXISTS public.exam_marks CASCADE;
DROP TABLE IF EXISTS public.exam_logs CASCADE;
DROP TABLE IF EXISTS public.academic_programs CASCADE;
DROP TABLE IF EXISTS public.program_outcomes CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.course_outcomes CASCADE;
DROP TABLE IF EXISTS public.course_offerings CASCADE;
DROP TABLE IF EXISTS public.course_registrations CASCADE;
DROP TABLE IF EXISTS public.registration_logs CASCADE;
DROP TABLE IF EXISTS public.course_prerequisites CASCADE;
DROP TABLE IF EXISTS public.activities CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.event_participants CASCADE;
DROP TABLE IF EXISTS public.admissions CASCADE;
DROP TABLE IF EXISTS public.admission_applications CASCADE;
DROP TABLE IF EXISTS public.document_types CASCADE;
DROP TABLE IF EXISTS public.communications CASCADE;
DROP TABLE IF EXISTS public.entrance_exams CASCADE;
DROP TABLE IF EXISTS public.assessments CASCADE;
DROP TABLE IF EXISTS public.mis_submissions CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.participants CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.message_receipts CASCADE;
DROP TABLE IF EXISTS public.reactions CASCADE;
DROP TABLE IF EXISTS public.chat_history CASCADE;
DROP TABLE IF EXISTS public.chat_calls CASCADE;
DROP TABLE IF EXISTS public.chat_groups CASCADE;
DROP TABLE IF EXISTS public.group_members CASCADE;
DROP TABLE IF EXISTS public.pinned_messages CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_settings CASCADE;

-- ==========================================
-- 1. Core & Users (Extended & Unified)
-- ==========================================

-- Organizations Table
CREATE TABLE public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_name TEXT NOT NULL UNIQUE,
    org_code TEXT UNIQUE,
    logo TEXT,
    contact_info JSONB,
    allowed_tabs JSONB DEFAULT '["dashboard", "chat", "users", "students", "attendance", "academic_gov", "mis_reports", "finance", "facilities", "hostel", "library", "transport", "exam", "tools", "settings"]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments Table
CREATE TABLE public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    email TEXT,
    head_id UUID, -- Circular Reference Fixed below
    created_by UUID, -- Circular Reference Fixed below
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update users table safely
DO $$ 
BEGIN 
    -- Fix org_id type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='org_id' AND data_type='integer') THEN
        ALTER TABLE public.users ALTER COLUMN org_id TYPE UUID USING NULL;
    END IF;
    
    -- Fix department_id type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department_id' AND data_type='integer') THEN
        ALTER TABLE public.users ALTER COLUMN department_id TYPE UUID USING NULL;
    END IF;

    -- Add missing columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='dob') THEN ALTER TABLE public.users ADD COLUMN dob DATE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='gender') THEN ALTER TABLE public.users ADD COLUMN gender TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='blood_group') THEN ALTER TABLE public.users ADD COLUMN blood_group TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='religion') THEN ALTER TABLE public.users ADD COLUMN religion TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='category') THEN ALTER TABLE public.users ADD COLUMN category TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='nationality') THEN ALTER TABLE public.users ADD COLUMN nationality TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='mother_tongue') THEN ALTER TABLE public.users ADD COLUMN mother_tongue TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='aadhar_no') THEN ALTER TABLE public.users ADD COLUMN aadhar_no TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='pan_no') THEN ALTER TABLE public.users ADD COLUMN pan_no TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='loopid') THEN ALTER TABLE public.users ADD COLUMN loopid TEXT UNIQUE; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='section') THEN ALTER TABLE public.users ADD COLUMN section TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN ALTER TABLE public.users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW(); END IF;
    
    -- Address columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_street') THEN ALTER TABLE public.users ADD COLUMN current_street TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_city') THEN ALTER TABLE public.users ADD COLUMN current_city TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_state') THEN ALTER TABLE public.users ADD COLUMN current_state TEXT; END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_pincode') THEN ALTER TABLE public.users ADD COLUMN current_pincode TEXT; END IF;
END $$;

-- Fix FK constraints on users safely
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_org_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id);
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE public.users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);

-- Fix Circular References for departments
ALTER TABLE public.departments ADD CONSTRAINT departments_head_id_fkey FOREIGN KEY (head_id) REFERENCES public.users(id);
ALTER TABLE public.departments ADD CONSTRAINT departments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);

-- Teacher Departments (Junction)
CREATE TABLE public.teacher_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, department_id)
);

-- Audit Logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    performed_by UUID REFERENCES public.users(id),
    user_role TEXT,
    ip_address TEXT,
    user_agent TEXT,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 2. Academic & Course Registration
-- ==========================================

CREATE TABLE public.semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    add_drop_start_date DATE,
    add_drop_end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.academic_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    department_id UUID REFERENCES public.departments(id),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    duration_years INTEGER,
    approval_status TEXT DEFAULT 'Pending' CHECK (approval_status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.program_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES public.academic_programs(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT,
    target_level NUMERIC DEFAULT 75.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES public.academic_programs(id),
    department_id UUID REFERENCES public.departments(id),
    name TEXT NOT NULL,
    course_code TEXT NOT NULL UNIQUE,
    credits INTEGER DEFAULT 3,
    type TEXT CHECK (type IN ('core', 'elective', 'optional')),
    level TEXT CHECK (level IN ('undergraduate', 'postgraduate')),
    course_type TEXT CHECK (course_type IN ('Theory', 'Lab', 'Theory+Lab')),
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    prerequisites JSONB DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    description TEXT,
    mapped_po_ids UUID[],
    target_level NUMERIC DEFAULT 70.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_offerings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES public.semesters(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES public.users(id),
    faculty_name TEXT,
    room_number TEXT,
    slot_code TEXT,
    capacity INTEGER DEFAULT 60,
    enrolled_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    course_offering_id UUID NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Registered' CHECK (status IN ('Pending', 'Registered', 'Dropped', 'Withdrawn', 'Completed')),
    registration_date TIMESTAMPTZ DEFAULT NOW(),
    registration_mode TEXT DEFAULT 'Regular' CHECK (registration_mode IN ('Regular', 'Audit', 'Re-registration', 'Exemption')),
    attendance_percentage NUMERIC DEFAULT 100.0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_offering_id)
);

CREATE TABLE public.registration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id),
    registration_id UUID REFERENCES public.course_registrations(id),
    action TEXT NOT NULL,
    details JSONB,
    performed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.course_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    min_grade TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 3. Exams & Evaluation
-- ==========================================

CREATE TABLE public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'ONGOING', 'COMPLETED', 'CANCELLED')),
    academic_calendar_id UUID REFERENCES public.semesters(id),
    programs TEXT[],
    semesters INTEGER[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exam_timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id),
    subject_id UUID, -- Backwards compatibility
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 180,
    room_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hall_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'BLOCKED', 'REVOKED')),
    room_number TEXT,
    seat_number TEXT,
    file_url TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

CREATE TABLE public.seating_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    exam_timetable_id UUID REFERENCES public.exam_timetable(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_number TEXT,
    seat_number TEXT,
    center_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exam_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    exam_timetable_id UUID REFERENCES public.exam_timetable(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'MALPRACTICE')),
    remarks TEXT,
    marked_by UUID REFERENCES public.users(id),
    marked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.exam_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    score NUMERIC NOT NULL,
    total_marks NUMERIC DEFAULT 100,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

CREATE TABLE public.exam_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES public.exams(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    description TEXT,
    logged_by UUID REFERENCES public.users(id),
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 4. Facilities Management
-- ==========================================

CREATE TABLE public.facilities_buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    campus_location TEXT,
    floors INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.facilities_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    building_id UUID REFERENCES public.facilities_buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_name TEXT,
    floor_number INTEGER DEFAULT 1,
    room_type TEXT CHECK (room_type IN ('Classroom', 'Lab', 'Seminar Hall', 'Office', 'Auditorium', 'Canteen', 'Other')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'In Use', 'Closed', 'Under Renovation')),
    capacity INTEGER,
    physical_specs JSONB DEFAULT '{}'::JSONB,
    equipment JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.facilities_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES public.facilities_rooms(id) ON DELETE CASCADE,
    item_name TEXT NOT NULL,
    category TEXT CHECK (category IN ('Furniture', 'Technology', 'Utilities', 'Specialized', 'Other')),
    quantity INTEGER DEFAULT 1,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.facilities_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.facilities_rooms(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    organizer TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. Finance & Accounting
-- ==========================================

CREATE TABLE public.fee_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fee_heads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('academic', 'hostel', 'residential', 'co_curricular', 'support', 'infrastructure', 'examination', 'special', 'penalty', 'tuition', 'transport', 'library', 'lab', 'mess', 'other')),
    is_refundable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.scholarships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'merit', 'need-based', 'sport', 'other')),
    value NUMERIC NOT NULL,
    rules JSONB DEFAULT '{}'::JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fee_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.fee_categories(id),
    semester_id UUID REFERENCES public.semesters(id),
    name TEXT NOT NULL,
    academic_year TEXT,
    batch_year INTEGER,
    total_amount NUMERIC DEFAULT 0.00,
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fee_structure_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
    head_id UUID NOT NULL REFERENCES public.fee_heads(id),
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.student_fee_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    structure_id UUID REFERENCES public.fee_structures(id),
    scholarship_id UUID REFERENCES public.scholarships(id),
    total_amount NUMERIC NOT NULL,
    discount_amount NUMERIC DEFAULT 0,
    net_amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    assigned_by UUID REFERENCES public.users(id),
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fee_installments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES public.student_fee_assignments(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount NUMERIC NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    paid_amount NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id),
    assignment_id UUID REFERENCES public.student_fee_assignments(id),
    installment_id UUID REFERENCES public.fee_installments(id),
    amount NUMERIC NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('online', 'cash', 'cheque', 'bank_transfer', 'wallet', 'demand_draft')),
    gateway_transaction_id TEXT,
    receipt_number TEXT UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    remarks TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES public.transactions(id),
    amount NUMERIC NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'rejected', 'processed')),
    requested_by UUID REFERENCES public.users(id),
    approved_by UUID REFERENCES public.users(id),
    processed_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    bank_name TEXT NOT NULL,
    account_number TEXT UNIQUE NOT NULL,
    ifsc_code TEXT,
    account_type TEXT DEFAULT 'savings',
    current_balance NUMERIC DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('credit', 'debit')),
    description TEXT,
    transaction_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.fee_penalty_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('flat', 'daily_linear', 'daily_compound')),
    amount NUMERIC NOT NULL,
    grace_period_days INTEGER DEFAULT 0,
    max_penalty_cap NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.tax_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    gst_rate NUMERIC DEFAULT 18,
    tds_rate NUMERIC DEFAULT 10,
    gst_no TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 6. Hostel Management
-- ==========================================

CREATE TABLE public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    type TEXT,
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Mixed')),
    capacity INTEGER DEFAULT 0,
    facilities JSONB DEFAULT '{}'::JSONB,
    address TEXT,
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hostel_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER DEFAULT 1,
    room_type TEXT DEFAULT 'standard',
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    floor_number INTEGER,
    monthly_rent NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hostel_allocations_api (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES public.hostel_rooms(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    allocated_date DATE DEFAULT CURRENT_DATE,
    release_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'vacated')),
    monthly_rent NUMERIC,
    deposit_amount NUMERIC,
    allocated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.hostel_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    application_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 7. Library Management
-- ==========================================

CREATE TABLE public.books (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    title TEXT NOT NULL,
    author TEXT,
    isbn TEXT UNIQUE,
    publisher TEXT,
    edition TEXT,
    category TEXT,
    status TEXT DEFAULT 'active',
    quantity INTEGER DEFAULT 0,
    available_quantity INTEGER DEFAULT 0,
    is_reference_only BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.book_copies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
    accession_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'issued', 'lost', 'damaged')),
    purchase_date DATE,
    price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.library_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    member_number TEXT UNIQUE NOT NULL,
    membership_type TEXT DEFAULT 'student',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.book_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    copy_id UUID NOT NULL REFERENCES public.book_copies(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
    issue_date DATE DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    returned_date DATE,
    status TEXT DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'overdue', 'lost')),
    fine_amount NUMERIC DEFAULT 0,
    issued_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. Transport Management
-- ==========================================

CREATE TABLE public.transport_vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    vehicle_number TEXT UNIQUE NOT NULL,
    vehicle_type TEXT,
    capacity INTEGER,
    driver_name TEXT,
    driver_contact TEXT,
    status TEXT DEFAULT 'active',
    insurance_expiry DATE,
    fitness_expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transport_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    vehicle_id UUID REFERENCES public.transport_vehicles(id),
    route_name TEXT NOT NULL,
    route_code TEXT UNIQUE,
    start_point TEXT,
    end_point TEXT,
    distance_km NUMERIC,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transport_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id UUID NOT NULL REFERENCES public.transport_routes(id) ON DELETE CASCADE,
    stop_name TEXT NOT NULL,
    arrival_time TIME,
    stop_order INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transport_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.transport_routes(id),
    vehicle_id UUID REFERENCES public.transport_vehicles(id),
    reg_id TEXT UNIQUE,
    status TEXT DEFAULT 'active',
    reg_date DATE DEFAULT CURRENT_DATE,
    fee_annual NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.transport_fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    registration_id UUID NOT NULL REFERENCES public.transport_registrations(id) ON DELETE CASCADE,
    amount_due NUMERIC NOT NULL,
    amount_paid NUMERIC DEFAULT 0,
    due_date DATE NOT NULL,
    paid_date DATE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid', 'Partial', 'Overdue')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.vehicle_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.vehicle_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id),
    vehicle_id UUID REFERENCES public.transport_vehicles(id) ON DELETE CASCADE,
    task_title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Medium',
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 9. General Utilities
-- ==========================================

CREATE TABLE public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    marked_by UUID REFERENCES public.users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon_name TEXT,
    color_class TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 10. Triggers for updated_at
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all relevant tables
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
        AND table_name NOT IN ('users') -- Handle users separately if needed, but let's include it
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_update_updated_at ON public.%I', t);
        EXECUTE format('CREATE TRIGGER trg_update_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()', t);
    END LOOP;
END $$;
