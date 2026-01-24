-- Add pickup_stop_name to transport_registrations
ALTER TABLE transport_registrations ADD COLUMN IF NOT EXISTS pickup_stop_name TEXT;
