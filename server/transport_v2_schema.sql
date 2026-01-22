-- Drop existing tables to rebuild with new structure
DROP TABLE IF EXISTS transport_registrations CASCADE;
DROP TABLE IF EXISTS transport_stops CASCADE;
DROP TABLE IF EXISTS transport_routes CASCADE;
DROP TABLE IF EXISTS transport_vehicles CASCADE;

-- 1. Vehicle Table
CREATE TABLE transport_vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE, -- VEH-BUS-001
    vehicle_type VARCHAR(50), -- Bus, Van
    capacity INTEGER NOT NULL, -- 50
    driver_name VARCHAR(100),
    driver_contact VARCHAR(50),
    driver_license_no VARCHAR(50),
    helper_name VARCHAR(100),
    helper_contact VARCHAR(50),
    insurance_expiry DATE,
    fitness_expiry DATE,
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive
    org_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Route Table (Detailed)
CREATE TABLE transport_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_id VARCHAR(50) UNIQUE, -- RT-001
    route_name VARCHAR(100) NOT NULL, -- Bandra to Campus
    route_code VARCHAR(50),
    vehicle_id UUID REFERENCES transport_vehicles(id),
    
    -- Coverage & Type
    route_type VARCHAR(50), -- Morning, Evening, Both
    start_point VARCHAR(100),
    end_point VARCHAR(100),
    distance_km DECIMAL(10, 2),
    est_travel_time_mins INTEGER,
    peak_hour_delay_mins INTEGER,

    -- Schedule
    departure_time_start TIME, -- 5:30 AM
    arrival_time_campus TIME, -- 6:30 AM
    departure_time_campus TIME, -- 17:00
    arrival_time_end TIME, -- 18:00
    frequency VARCHAR(50), -- Daily, Mon-Fri
    operating_days VARCHAR(50), -- Mon,Tue,Wed,Thu,Fri

    -- Efficiency & Cost
    avg_cost_per_student DECIMAL(10, 2), -- 800
    cost_per_km DECIMAL(10, 2), -- 20
    cost_per_trip DECIMAL(10,2), -- 500

    -- Safety & Maintenance
    emergency_assembly_point VARCHAR(100),
    hospital_nearby_name VARCHAR(100),
    hospital_nearby_contact VARCHAR(50),
    police_station_contact VARCHAR(50),
    last_road_survey_date DATE,
    road_hazards_note TEXT,
    
    status VARCHAR(50) DEFAULT 'active',
    org_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Stops Table
CREATE TABLE transport_stops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_id VARCHAR(50), -- STOP-001
    stop_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    stop_order INTEGER NOT NULL,
    arrival_time TIME,
    stop_duration_mins INTEGER DEFAULT 1,
    avg_boarding_count INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Risks & Alerts (JSONB for flexibility or separate table)
-- We will add a JSONB column to routes for flexible risk assessment
ALTER TABLE transport_routes ADD COLUMN risk_assessment JSONB; 
-- Structure: { "high_risk_areas": [], "traffic_prone": [], "night_safety": "", "mitigation": "" }

-- 5. Registrations (Enrollment)
CREATE TABLE transport_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    reg_id VARCHAR(50) UNIQUE, -- TSREG-2024-12345
    student_id INTEGER NOT NULL, -- References user_id
    academic_year VARCHAR(20), -- 2024-2025
    semester VARCHAR(20),
    
    -- Route Selection
    route_id UUID REFERENCES transport_routes(id),
    trip_type VARCHAR(50), -- Morning, Evening, Both
    boarding_stop_id UUID REFERENCES transport_stops(id),
    alighting_stop_id UUID REFERENCES transport_stops(id),
    reg_date DATE DEFAULT CURRENT_DATE,
    
    -- Passenger Info
    seat_number VARCHAR(20), -- A-25
    preferred_seating VARCHAR(50), -- Window, Aisle
    special_needs TEXT,
    medical_conditions TEXT,
    medications TEXT,
    allergies TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(50),

    -- Fees (Snapshot)
    fee_monthly DECIMAL(10, 2), -- 800
    fee_annual DECIMAL(10, 2), -- 9600
    fee_semester DECIMAL(10, 2), -- 4800
    payment_status VARCHAR(50) DEFAULT 'Pending', -- Paid, Pending, Partial

    status VARCHAR(50) DEFAULT 'active', -- Active, Suspended
    org_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Transport Fee Transactions (Simple Tracker)
CREATE TABLE transport_fee_payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    registration_id UUID REFERENCES transport_registrations(id),
    installment_no INTEGER, -- 1, 2
    amount_due DECIMAL(10, 2),
    amount_paid DECIMAL(10, 2) DEFAULT 0,
    due_date DATE,
    paid_date DATE,
    status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tr_routes_vehicle ON transport_routes(vehicle_id);
CREATE INDEX idx_tr_stops_route ON transport_stops(route_id);
CREATE INDEX idx_tr_reg_student ON transport_registrations(student_id);
CREATE INDEX idx_tr_reg_route ON transport_registrations(route_id);
