-- Create Transport Vehicles Table
CREATE TABLE IF NOT EXISTS transport_vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vehicle_number VARCHAR(50) NOT NULL UNIQUE,
    vehicle_type VARCHAR(50), -- Bus, Van, etc.
    capacity INTEGER NOT NULL,
    driver_name VARCHAR(100),
    driver_contact VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active', -- active, maintenance, inactive
    org_id INTEGER, -- Optional: link to organization if multi-tenant
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transport Routes Table
CREATE TABLE IF NOT EXISTS transport_routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_name VARCHAR(100) NOT NULL,
    route_code VARCHAR(50) UNIQUE,
    start_point VARCHAR(100),
    end_point VARCHAR(100),
    vehicle_id UUID REFERENCES transport_vehicles(id),
    distance_km DECIMAL(10, 2),
    estimated_time_mins INTEGER,
    status VARCHAR(50) DEFAULT 'active',
    org_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transport Stops Table
CREATE TABLE IF NOT EXISTS transport_stops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    stop_name VARCHAR(100) NOT NULL,
    stop_code VARCHAR(50),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    stop_order INTEGER NOT NULL, -- 1, 2, 3...
    arrival_time TIME,
    price_to_stop DECIMAL(10, 2), -- Optional: specific price for this stop
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Transport Registrations (Student Enrollment) Table
CREATE TABLE IF NOT EXISTS transport_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id INTEGER NOT NULL, -- References users(user_id) or users(id) depending on schema
    route_id UUID REFERENCES transport_routes(id),
    pickup_point_id UUID REFERENCES transport_stops(id),
    drop_point_id UUID REFERENCES transport_stops(id),
    academic_year VARCHAR(20),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- active, cancelled, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_transport_routes_vehicle_id ON transport_routes(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_transport_stops_route_id ON transport_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_transport_registrations_student_id ON transport_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_transport_registrations_route_id ON transport_registrations(route_id);
