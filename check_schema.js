import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log('Checking columns for transport_registrations...');

    // We can't easily SELECT from information_schema via the JS client unless we have a specific RPC or permissive RLS.
    // But we can try to "reload schema" first which is a common fix for PGRST errors.

    console.log('Attempting to reload PostgREST schema cache...');
    const { error: notifyError } = await supabase.rpc('execute_sql', {
        query_text: "NOTIFY pgrst, 'reload schema';"
    });

    if (notifyError) {
        console.error('Failed to notify pgrst:', notifyError);
    } else {
        console.log('Schema reload notification sent.');
    }

    // Now try to run the migration again?
    // Or just try to select * from transport_registrations limit 1 to see the structure?
    const { data, error } = await supabase.from('transport_registrations').select('*').limit(1);

    if (error) {
        console.error('Error selecting:', error);
    } else {
        console.log('Select successful. Data keys:', data && data[0] ? Object.keys(data[0]) : 'No rows');
    }
}

checkColumns();
