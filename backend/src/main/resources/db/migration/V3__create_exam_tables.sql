-- 4.1 Exam Planning
CREATE TABLE IF NOT EXISTS academic_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year VARCHAR(20) NOT NULL,
    term VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    weightage DECIMAL(5,2) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_calendar_id UUID REFERENCES academic_calendar(id),
    exam_type_id UUID REFERENCES exam_types(id),
    name VARCHAR(200) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    programs TEXT[], 
    semesters INTEGER[],
    status VARCHAR(20) DEFAULT 'PLANNED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exam_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS exam_timetable (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    course_id VARCHAR(50) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, course_id)
);

CREATE TABLE IF NOT EXISTS invigilation_duties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_timetable_id UUID REFERENCES exam_timetable(id),
    faculty_id UUID REFERENCES users(id),
    exam_center_id UUID REFERENCES exam_centers(id),
    status VARCHAR(20) DEFAULT 'ASSIGNED',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Exam Administration
CREATE TABLE IF NOT EXISTS hall_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'GENERATED',
    block_reason TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS seating_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_timetable_id UUID REFERENCES exam_timetable(id),
    exam_center_id UUID REFERENCES exam_centers(id),
    room_number VARCHAR(50),
    seat_number VARCHAR(20),
    student_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_timetable_id, seat_number)
);

CREATE TABLE IF NOT EXISTS exam_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_timetable_id UUID REFERENCES exam_timetable(id),
    student_id UUID REFERENCES users(id),
    status VARCHAR(20) NOT NULL,
    remarks TEXT,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(exam_timetable_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    center_id UUID REFERENCES exam_centers(id),
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    logged_by UUID REFERENCES users(id)
);

-- 4.3 Assessment & Evaluation
CREATE TABLE IF NOT EXISTS assessment_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    max_marks DECIMAL(5,2) NOT NULL,
    weightage DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marks_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    assessment_component_id UUID REFERENCES assessment_components(id),
    marks_obtained DECIMAL(5,2) NOT NULL,
    grade VARCHAR(5),
    comments TEXT,
    status VARCHAR(20) DEFAULT 'DRAFT',
    evaluated_by UUID REFERENCES users(id),
    evaluated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, assessment_component_id)
);

-- 4.4 Results & Analytics
CREATE TABLE IF NOT EXISTS grade_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade VARCHAR(5) NOT NULL,
    min_score DECIMAL(5,2) NOT NULL,
    max_score DECIMAL(5,2) NOT NULL,
    grade_point DECIMAL(4,2) NOT NULL,
    description TEXT
);

CREATE TABLE IF NOT EXISTS student_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    student_id UUID REFERENCES users(id),
    course_id VARCHAR(50) NOT NULL,
    total_marks DECIMAL(5,2),
    final_grade VARCHAR(5),
    grade_point DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'PASS',
    published BOOLEAN DEFAULT FALSE,
    UNIQUE(exam_id, student_id, course_id)
);

CREATE TABLE IF NOT EXISTS performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID REFERENCES exams(id),
    course_id VARCHAR(50),
    batch_year VARCHAR(20),
    avg_marks DECIMAL(5,2),
    pass_percentage DECIMAL(5,2),
    highest_score DECIMAL(5,2),
    lowest_score DECIMAL(5,2),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
