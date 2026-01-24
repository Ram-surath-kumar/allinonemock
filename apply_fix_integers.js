import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Force applying migration transport_v5_fix_integers.sql...');

    try {
        const sqlPath = path.join(__dirname, 'server', 'migrations', 'transport_v5_fix_integers.sql');
        const query = fs.readFileSync(sqlPath, 'utf8');

        // Split into statements if needed, but rpc usually handles block.
        // Let's try executing.
        const { error } = await supabase.rpc('execute_sql', { query_text: query });

        if (error) {
            console.error('Migration failed:', error);
        } else {
            console.log('Migration applied successfully!');

            // Double check
            const { data, error: checkError } = await supabase.rpc('execute_sql', {
                query_text: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transport_registrations' AND column_name IN ('student_id', 'org_id');"
            });
            if (data) console.log('Check result:', data);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
