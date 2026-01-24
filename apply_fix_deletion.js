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
    console.log('Applying migration transport_v6_fix_deletion.sql...');

    try {
        const sqlPath = path.join(__dirname, 'server', 'migrations', 'transport_v6_fix_deletion.sql');
        const query = fs.readFileSync(sqlPath, 'utf8');

        const { error } = await supabase.rpc('execute_sql', { query_text: query });

        if (error) {
            console.error('Migration failed:', error);
        } else {
            console.log('Migration applied successfully - cascading delete enabled.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

runMigration();
