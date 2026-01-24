-- Force fix transport_registrations columns to UUID
-- We drop and recreate columns if casting is problematic, or use text casting.
-- Since this is a dev environment, we want to be aggressive to fix the "integer" error.

-- 1. Fix student_id
ALTER TABLE transport_registrations ALTER COLUMN student_id TYPE UUID USING student_id::text::uuid;

-- 2. Fix org_id (if it needs to be UUID). Users usually have UUID org_ids in Supabase.
ALTER TABLE transport_registrations ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;

-- 3. Fix vehicle_id (just in case)
ALTER TABLE transport_registrations ALTER COLUMN vehicle_id TYPE UUID USING vehicle_id::text::uuid;

-- 4. Reload schema cache again
NOTIFY pgrst, 'reload schema';
