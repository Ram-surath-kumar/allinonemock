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

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY is required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Applying migration transport_v4_fix_student_id.sql...');

    try {
        const sqlPath = path.join(__dirname, 'server', 'migrations', 'transport_v4_fix_student_id.sql');
        const query = fs.readFileSync(sqlPath, 'utf8');

        console.log('Query:', query);

        const { error } = await supabase.rpc('execute_sql', { query_text: query });

        if (error) {
            console.error('Migration failed:', error);
            // Fallback: Try MCP if RPC fails (though I am running this locally)
        } else {
            console.log('Migration applied successfully!');
        }

    } catch (err) {
        console.error('Error reading or executing migration:', err);
    }
}

runMigration();
