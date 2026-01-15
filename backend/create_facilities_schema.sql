-- Facilities Management Schema

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Buildings Table
CREATE TABLE IF NOT EXISTS facilities_buildings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    campus_location TEXT,
    floors INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS facilities_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID REFERENCES facilities_buildings(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    room_name TEXT,
    floor_number INTEGER NOT NULL,
    room_type TEXT CHECK (room_type IN ('Classroom', 'Lab', 'Seminar Hall', 'Office', 'Auditorium', 'Canteen', 'Other')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'In Use', 'Closed', 'Under Renovation')),
    capacity INTEGER,
    
    -- JSONB Columns for structured data
    physical_specs JSONB DEFAULT '{}'::jsonb, 
    -- { "carpet_area": 500, "built_up_area": 600, "height": 10, "flooring": "Tile", "ceiling": "Concrete", "windows": "Glass" }
    
    accessibility JSONB DEFAULT '{}'::jsonb,
    -- { "wheelchair": true, "ramps": true, "braille": false, "hearing_loop": false, "accessible_toilet": true }
    
    maintenance JSONB DEFAULT '{}'::jsonb,
    -- { "cleanliness_score": 8, "last_cleaned": "2024-01-01", "last_serviced": "2024-01-01", "pending_repairs": [], "next_schedule": "2024-02-01" }

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Equipment Table
CREATE TABLE IF NOT EXISTS facilities_equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES facilities_rooms(id) ON DELETE CASCADE,
    category TEXT CHECK (category IN ('Furniture', 'Technology', 'Utilities', 'Specialized', 'Other')),
    item_name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    
    details JSONB DEFAULT '{}'::jsonb,
    -- { "model": "X123", "serial": "SN001", "purchase_date": "2023-01-01", "warranty_expiry": "2025-01-01", "specs": "..." }

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS facilities_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES facilities_rooms(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    organizer TEXT, -- Could be a user_id or text name
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rooms_building ON facilities_rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_equipment_room ON facilities_equipment(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON facilities_bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON facilities_bookings(start_time, end_time);

-- RLS Policies
ALTER TABLE facilities_buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities_bookings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access for authenticated users" ON facilities_buildings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON facilities_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON facilities_equipment FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access for authenticated users" ON facilities_bookings FOR SELECT TO authenticated USING (true);

-- Allow write access to Admins/Staff (Simplified: Allow all authenticated for demo, restrict in prod)
CREATE POLICY "Allow write access for authenticated users" ON facilities_buildings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow write access for authenticated users" ON facilities_rooms FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow write access for authenticated users" ON facilities_equipment FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow write access for authenticated users" ON facilities_bookings FOR ALL TO authenticated USING (true);


-- SEED DATA
INSERT INTO facilities_buildings (name, code, campus_location, floors) 
VALUES 
('Main Academic Block', 'MAB', 'North Campus', 4),
('Science & Research Center', 'SRC', 'East Campus', 3)
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
    bld_main UUID;
    bld_sci UUID;
    room_101 UUID;
BEGIN
    SELECT id INTO bld_main FROM facilities_buildings WHERE code = 'MAB';
    SELECT id INTO bld_sci FROM facilities_buildings WHERE code = 'SRC';

    -- Rooms for Main Block
    IF bld_main IS NOT NULL THEN
        INSERT INTO facilities_rooms (building_id, room_number, room_name, floor_number, room_type, capacity, physical_specs, accessibility, maintenance)
        VALUES 
        (bld_main, '101', 'Lecture Hall A', 1, 'Classroom', 60, 
         '{"carpet_area": 800, "flooring": "Tile", "ac_units": 2}', 
         '{"wheelchair": true, "ramps": true}',
         '{"cleanliness_score": 9, "last_cleaned": "2024-01-14"}'
        ) RETURNING id INTO room_101;

        INSERT INTO facilities_rooms (building_id, room_number, room_name, floor_number, room_type, capacity)
        VALUES (bld_main, '205', 'Computer Lab', 2, 'Lab', 30);
    END IF;

    -- Equipment for Room 101
    IF room_101 IS NOT NULL THEN
        INSERT INTO facilities_equipment (room_id, category, item_name, quantity, details)
        VALUES 
        (room_101, 'Furniture', 'Student Desks', 60, '{}'),
        (room_101, 'Technology', 'Projector', 1, '{"model": "Epson X50", "status": "Working"}');
    END IF;

END $$;
