-- Transport Module V2 Enhancements

-- 1. Create Junction Table for Route-Vehicles (Many-to-Many)
CREATE TABLE IF NOT EXISTS transport_route_vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID REFERENCES transport_routes(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(route_id, vehicle_id)
);

-- 2. Add vehicle_id to transport_registrations for specific allocation
ALTER TABLE transport_registrations 
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL;

-- 3. Migrate existing vehicle assignments (if any)
-- This tries to move data from the old 1:1 vehicle_id column in transport_routes to the new junction table
INSERT INTO transport_route_vehicles (route_id, vehicle_id)
SELECT id, vehicle_id FROM transport_routes 
WHERE vehicle_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Ensure transport_stops has necessary columns (idempotent)
ALTER TABLE transport_stops ADD COLUMN IF NOT EXISTS stop_duration_mins INTEGER DEFAULT 1;
ALTER TABLE transport_stops ADD COLUMN IF NOT EXISTS avg_boarding_count INTEGER DEFAULT 0;
ALTER TABLE transport_stops ADD COLUMN IF NOT EXISTS address TEXT;

-- 5. Drop the old column from transport_routes (Optional, keeping for safety for now)
-- ALTER TABLE transport_routes DROP COLUMN vehicle_id;
