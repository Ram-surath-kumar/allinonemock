-- ============================================================================
-- REGENERATE UNUSED TABLES SCRIPT
-- ============================================================================
-- This file contains CREATE TABLE statements for 65 unused tables that were
-- removed from the database. This serves as a backup in case any of these
-- tables need to be restored in the future.
-- 
-- Created: 2026-02-08
-- Reason: These tables have 0 rows, 0 activity, and are not referenced in code
-- ============================================================================

-- ====================
-- OLD HOSTEL SYSTEM TABLES (Replaced by hostel_rooms, hostel_allocations_api)
-- ====================

CREATE TABLE IF NOT EXISTS rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hostel_id UUID REFERENCES hostels(id),
    room_number TEXT NOT NULL,
    room_type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    floor INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS beds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    bed_number TEXT NOT NULL,
    status TEXT DEFAULT 'VACANT',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS hostel_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    preferred_hostel_id UUID REFERENCES hostels(id),
    preferred_room_type TEXT,
    status TEXT DEFAULT 'APPLIED',
    priority_score INTEGER DEFAULT 0,
    application_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS hostel_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    application_id UUID REFERENCES hostel_applications(id),
    student_id UUID NOT NULL,
    bed_id UUID REFERENCES beds(id),
    allocation_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    status TEXT DEFAULT 'ACTIVE',
    approved_by UUID
);

CREATE TABLE IF NOT EXISTS hostel_checkins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    allocation_id UUID REFERENCES hostel_allocations(id),
    checkin_date TIMESTAMPTZ,
    checkout_date TIMESTAMPTZ,
    status TEXT DEFAULT 'CHECKED_IN'
);

CREATE TABLE IF NOT EXISTS hostel_inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES rooms(id),
    item_name TEXT NOT NULL,
    condition TEXT DEFAULT 'GOOD',
    quantity INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL,
    hostel_id UUID REFERENCES hostels(id),
    room_id UUID REFERENCES rooms(id),
    description TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    priority TEXT DEFAULT 'NORMAL',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS visitor_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    hostel_id UUID REFERENCES hostels(id),
    student_id UUID,
    visitor_name TEXT NOT NULL,
    relation TEXT,
    check_in_time TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    check_out_time TIMESTAMPTZ,
    approved_by UUID
);

CREATE TABLE IF NOT EXISTS hostel_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    term TEXT NOT NULL,
    hostel_fee NUMERIC DEFAULT 0,
    mess_fee NUMERIC DEFAULT 0,
    security_deposit NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    due_date DATE,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS mess_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    status TEXT DEFAULT 'TAKEN'
);

CREATE TABLE IF NOT EXISTS hostel_complaints (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL,
    against_id UUID,
    description TEXT NOT NULL,
    anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS disciplinary_actions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    incident_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    violation_type TEXT NOT NULL,
    action_taken TEXT NOT NULL,
    fine_amount NUMERIC DEFAULT 0,
    approved_by UUID
);

-- ====================
-- EXAM SYSTEM TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS academic_calendar (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    academic_year VARCHAR NOT NULL,
    term VARCHAR NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    code VARCHAR UNIQUE NOT NULL,
    weightage NUMERIC NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exam_centers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    location VARCHAR,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS invigilation_duties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_timetable_id UUID REFERENCES exam_timetable(id),
    faculty_id UUID REFERENCES users(id),
    exam_center_id UUID REFERENCES exam_centers(id),
    status VARCHAR DEFAULT 'ASSIGNED',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- ASSESSMENT & GRADING TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS assessment_components (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id VARCHAR NOT NULL,
    name VARCHAR NOT NULL,
    type VARCHAR NOT NULL,
    max_marks NUMERIC NOT NULL,
    weightage NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS marks_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    assessment_component_id UUID REFERENCES assessment_components(id),
    marks_obtained NUMERIC NOT NULL,
    grade VARCHAR,
    comments TEXT,
    status VARCHAR DEFAULT 'DRAFT',
    evaluated_by UUID REFERENCES users(id),
    evaluated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS grade_schemes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    grade VARCHAR NOT NULL,
    min_score NUMERIC NOT NULL,
    max_score NUMERIC NOT NULL,
    grade_point NUMERIC NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS student_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES users(id),
    course_id VARCHAR NOT NULL,
    total_marks NUMERIC,
    final_grade VARCHAR,
    grade_point NUMERIC,
    status VARCHAR DEFAULT 'PASS',
    published BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS performance_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exam_id UUID REFERENCES exams(id),
    course_id VARCHAR,
    batch_year VARCHAR,
    avg_marks NUMERIC,
    pass_percentage NUMERIC,
    highest_score NUMERIC,
    lowest_score NUMERIC,
    generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assessment_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id UUID REFERENCES assessments(id),
    student_id UUID REFERENCES users(id),
    marks_obtained NUMERIC,
    co_attainment JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- LIBRARY SYSTEM TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS library_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) NOT NULL,
    library_id UUID,
    member_number VARCHAR UNIQUE,
    status VARCHAR DEFAULT 'active',
    membership_type VARCHAR DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_issues (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    copy_id UUID REFERENCES book_copies(id) NOT NULL,
    member_id UUID REFERENCES library_members(id) NOT NULL,
    issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR DEFAULT 'issued',
    issued_by UUID REFERENCES users(id),
    fine_amount NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- ACCOUNTING & FINANCE TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_id UUID REFERENCES chart_of_accounts(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    reference_type TEXT,
    reference_id UUID,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_lines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    journal_entry_id UUID REFERENCES journal_entries(id),
    account_id UUID REFERENCES chart_of_accounts(id),
    debit NUMERIC DEFAULT 0.00,
    credit NUMERIC DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bank_account_id UUID REFERENCES bank_accounts(id),
    transaction_date DATE NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdraw')),
    amount NUMERIC NOT NULL,
    description TEXT,
    reference_number TEXT,
    transaction_id UUID REFERENCES transactions(id),
    status TEXT DEFAULT 'cleared' CHECK (status IN ('pending', 'cleared', 'bounced')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    percentage NUMERIC NOT NULL,
    type TEXT CHECK (type IN ('gst', 'tds', 'other')),
    gl_account_id UUID REFERENCES chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tax_id UUID REFERENCES tax_settings(id),
    transaction_id UUID REFERENCES transactions(id),
    expense_id UUID,
    taxable_amount NUMERIC NOT NULL,
    tax_amount NUMERIC NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tax_filings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    filing_type TEXT CHECK (filing_type IN ('GST', 'TDS', 'Income Tax')),
    period TEXT NOT NULL,
    filing_date DATE DEFAULT CURRENT_DATE,
    gross_amount NUMERIC,
    tax_amount NUMERIC,
    status TEXT DEFAULT 'filed' CHECK (status IN ('draft', 'filed', 'paid')),
    reference_number TEXT,
    document_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reconciliations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    transaction_id UUID REFERENCES transactions(id),
    bank_transaction_id UUID REFERENCES bank_transactions(id),
    reconciled_at TIMESTAMPTZ DEFAULT now(),
    reconciled_by UUID REFERENCES users(id)
);

-- ====================
-- ADMISSIONS & ACADEMIC TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS entrance_exam_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admission_id UUID REFERENCES admissions(id),
    exam_id UUID REFERENCES entrance_exams(id),
    score NUMERIC NOT NULL,
    percentile NUMERIC,
    rank INTEGER,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS merit_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    round_number INTEGER DEFAULT 1,
    cut_off_score NUMERIC NOT NULL,
    category TEXT,
    course_identifier TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    publish_date TIMESTAMPTZ,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semesters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    academic_year TEXT NOT NULL,
    is_current BOOLEAN DEFAULT false,
    registration_start_date TIMESTAMPTZ,
    registration_end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    add_drop_start_date TIMESTAMPTZ,
    add_drop_end_date TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    program_name TEXT NOT NULL,
    batch_year TEXT NOT NULL,
    current_semester INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    admission_reference_id UUID REFERENCES admissions(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS course_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    semester_id UUID REFERENCES semesters(id),
    course_id UUID REFERENCES courses(id),
    status TEXT DEFAULT 'registered',
    grade TEXT,
    credits_earned INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    semester_id UUID REFERENCES semesters(id) NOT NULL,
    credits_attempted INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    sgpa NUMERIC,
    cgpa NUMERIC,
    standing TEXT DEFAULT 'Good' CHECK (standing IN ('Good', 'Probation', 'Suspended', 'Dean List')),
    remarks TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_transcripts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    document_url TEXT NOT NULL,
    issued_date DATE DEFAULT CURRENT_DATE,
    type TEXT DEFAULT 'official',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    department TEXT,
    total_credits_required INTEGER DEFAULT 120,
    min_cgpa_required NUMERIC DEFAULT 5.0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS program_core_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    program_id UUID REFERENCES programs(id),
    course_id UUID REFERENCES courses(id),
    semester_recommended INTEGER
);

CREATE TABLE IF NOT EXISTS student_leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    leave_type TEXT CHECK (leave_type IN ('Medical', 'Casual', 'Duty', 'Emergency')) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by UUID,
    rejection_reason TEXT,
    applied_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_course_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL,
    course_offering_id UUID REFERENCES course_offerings(id) NOT NULL,
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('Present', 'Absent', 'Late', 'Excused')) NOT NULL,
    remarks TEXT,
    recorded_by UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- HR & MANAGEMENT TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS promotions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    from_role TEXT,
    to_role TEXT,
    promotion_date DATE DEFAULT CURRENT_DATE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS salary_hikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    previous_salary NUMERIC,
    new_salary NUMERIC,
    hike_percentage NUMERIC,
    hike_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS compliance_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category TEXT CHECK (category IN ('AICTE', 'UGC', 'State', 'NAAC', 'NBA')) NOT NULL,
    requirement_name TEXT NOT NULL,
    status TEXT CHECK (status IN ('Compliant', 'Non-Compliant', 'Pending Review', 'In Progress')),
    last_checked_at TIMESTAMPTZ DEFAULT now(),
    evidence_url TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    version TEXT NOT NULL,
    description TEXT,
    release_date TIMESTAMPTZ DEFAULT now(),
    type TEXT CHECK (type IN ('Feature', 'Bug Fix', 'Security', 'Maintenance'))
);

CREATE TABLE IF NOT EXISTS approval_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES users(id),
    type TEXT CHECK (type IN ('Leave', 'Expense', 'Curriculum', 'Resignation', 'Other')),
    status TEXT CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    details JSONB,
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- OTHER SYSTEM TABLES (Never implemented)
-- ====================

CREATE TABLE IF NOT EXISTS academic_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    semester INTEGER,
    academic_year TEXT,
    status TEXT CHECK (status IN ('active', 'probation', 'suspended', 'on_leave', 'graduated', 'withdrawn')),
    gpa NUMERIC,
    attendance_percentage NUMERIC,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    course_code TEXT,
    course_name TEXT,
    semester INTEGER,
    academic_year TEXT,
    status TEXT CHECK (status IN ('enrolled', 'dropped', 'completed', 'failed')),
    grade TEXT,
    credits INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_gateways (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT UNIQUE NOT NULL,
    config JSONB DEFAULT '{}'::jsonb NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) NOT NULL,
    fee_structure_id UUID REFERENCES fee_structures(id),
    total_amount NUMERIC NOT NULL,
    paid_amount NUMERIC DEFAULT 0.00,
    pending_amount NUMERIC GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_fee_id UUID REFERENCES student_fees(id),
    student_id UUID REFERENCES users(id),
    amount NUMERIC NOT NULL,
    payment_date TIMESTAMPTZ DEFAULT now(),
    payment_method TEXT CHECK (payment_method IN ('cash', 'cheque', 'bank_transfer', 'online', 'wallet', 'demand_draft')),
    transaction_id TEXT,
    gateway TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    receipt_number TEXT UNIQUE,
    remarks TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    amount NUMERIC NOT NULL,
    status TEXT CHECK (status IN ('pending', 'paid', 'overdue')),
    due_date DATE,
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id) NOT NULL,
    document_type_id UUID REFERENCES document_types(id),
    document_type_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    status TEXT
);

CREATE TABLE IF NOT EXISTS course_prerequisites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id),
    prerequisite_course_id UUID REFERENCES courses(id),
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS registration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    registration_id UUID,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS facilities_documents (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    room_id UUID REFERENCES facilities_rooms(id),
    doc_type TEXT CHECK (doc_type IN ('Layout', 'Photo', 'Certificate', 'Report', 'Other')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS muted_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    chat_type VARCHAR CHECK (chat_type IN ('personal', 'group')),
    chat_id VARCHAR NOT NULL,
    muted_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_reactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR NOT NULL,
    user_id UUID,
    reaction VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_public_keys (
    user_id UUID PRIMARY KEY,
    public_key TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transport_stops (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    route_id UUID REFERENCES transport_routes(id),
    stop_name VARCHAR NOT NULL,
    stop_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('invite', 'information')) NOT NULL,
    fee NUMERIC DEFAULT 0,
    department_id TEXT,
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    facility_id UUID,
    recipient_roles TEXT[],
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES school_events(id),
    student_id UUID,
    status TEXT DEFAULT 'invited',
    payment_status TEXT DEFAULT 'not_required',
    payment_amount NUMERIC DEFAULT 0,
    joined_at TIMESTAMPTZ,
    presence_marked BOOLEAN DEFAULT false,
    presence_marked_at TIMESTAMPTZ
);

-- ============================================================================
-- END OF REGENERATION SCRIPT
-- ============================================================================
