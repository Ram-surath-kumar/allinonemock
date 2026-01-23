-- Create RPC function to handle vehicle creation securely and bypass schema cache issues
CREATE OR REPLACE FUNCTION create_vehicle(vehicle_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_vehicle vehicles;
BEGIN
  INSERT INTO vehicles (
    vehicle_id,
    vehicle_type,
    registration_number,
    registration_date,
    renewal_date,
    expiry_date,
    make_model,
    year_of_manufacture,
    engine_type,
    seating_capacity,
    chassis_number,
    engine_number,
    color,
    current_odometer_reading,
    fuel_tank_capacity,
    owner_name,
    ownership_type,
    status,
    purchase_date,
    purchase_cost,
    monthly_lease_cost
  )
  SELECT
    (vehicle_data->>'vehicle_id')::varchar,
    (vehicle_data->>'vehicle_type')::varchar,
    (vehicle_data->>'registration_number')::varchar,
    (vehicle_data->>'registration_date')::date,
    (vehicle_data->>'renewal_date')::date,
    (vehicle_data->>'expiry_date')::date,
    (vehicle_data->>'make_model')::text,
    (vehicle_data->>'year_of_manufacture')::integer,
    (vehicle_data->>'engine_type')::varchar,
    (vehicle_data->>'seating_capacity')::integer,
    (vehicle_data->>'chassis_number')::varchar,
    (vehicle_data->>'engine_number')::varchar,
    (vehicle_data->>'color')::varchar,
    (vehicle_data->>'current_odometer_reading')::numeric,
    (vehicle_data->>'fuel_tank_capacity')::numeric,
    (vehicle_data->>'owner_name')::text,
    (vehicle_data->>'ownership_type')::varchar,
    (vehicle_data->>'status')::varchar,
    (vehicle_data->>'purchase_date')::date,
    (vehicle_data->>'purchase_cost')::numeric,
    (vehicle_data->>'monthly_lease_cost')::numeric
  RETURNING * INTO new_vehicle;

  RETURN to_jsonb(new_vehicle);
END;
$$;
