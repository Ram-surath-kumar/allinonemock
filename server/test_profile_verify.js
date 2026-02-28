
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileAccess() {
    console.log('Testing access to student_profiles table...');

    try {
        // Try to select one row or just check count (head)
        const { count, error } = await supabase
            .from('student_profiles')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('FAIL: Could not access table');
            console.error('Error details:', error.message);
            if (error.message && error.message.includes('schema cache')) {
                console.error('HINT: You likely need to reload the Schema Cache in Supabase Dashboard (Settings -> API -> Reload).');
            }
        } else {
            console.log('SUCCESS: Table student_profiles is accessible.');
            console.log(`Current row count: ${count}`);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testProfileAccess();
