import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vzkbyzpqnojhlazwopvz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjIxOTYxMywiZXhwIjoyMDgxNzk1NjEzfQ.2UVCI8c1psk_lM8Kx5bvTFjgLTElWDLWmsr_aKbap-E';

const supabase = createClient(supabaseUrl, supabaseKey);

const payload = {
    vehicle_id: 'VEH-DIRECT-' + Date.now(),
    vehicle_type: 'Bus',
    registration_number: 'MH01DIR' + Date.now().toString().slice(-4),
    status: 'Active'
};

async function test() {
    console.log('Testing RPC call directly...');
    const { data, error } = await supabase.rpc('create_vehicle', { vehicle_data: payload });

    if (error) {
        console.error('RPC Error:', error);
    } else {
        console.log('RPC Success:', data);
    }
}

test();
