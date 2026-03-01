-- Fix missing columns in Transport tables
-- 1. Add arrival_time_campus to transport_routes
ALTER TABLE transport_routes ADD COLUMN IF NOT EXISTS arrival_time_campus TIME;

-- 2. Add pickup_stop_name to transport_registrations
ALTER TABLE transport_registrations ADD COLUMN IF NOT EXISTS pickup_stop_name TEXT;

-- 3. Verify column addition (PostgREST cache refresh might be needed)
COMMENT ON TABLE transport_routes IS 'Transport routes with schedule details';
COMMENT ON TABLE transport_registrations IS 'Student transport enrollment data';
