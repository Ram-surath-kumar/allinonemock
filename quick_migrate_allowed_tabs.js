// Quick script to apply the allowed_tabs migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('Applying allowed_tabs migration...');

    const sql = fs.readFileSync('./server/db/migrations/add_allowed_tabs_to_organizations.sql', 'utf-8');

    // Split by semicolon and execute each statement
    const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

    for (const statement of statements) {
        if (!statement) continue;

        console.log(`Executing: ${statement.substring(0, 50)}...`);

        const { data, error } = await supabase.rpc('exec_sql', {
            sql_query: statement + ';'
        });

        if (error) {
            // Try direct execution via postgrest
            console.log('RPC failed, trying alternative method...');
            console.log('Please run this SQL in Supabase SQL Editor:');
            console.log('---');
            console.log(sql);
            console.log('---');
            process.exit(1);
        }
    }

    console.log('✅ Migration completed successfully!');
}

applyMigration().catch(err => {
    console.error('Migration failed:', err.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:');
    const sql = fs.readFileSync('./server/db/migrations/add_allowed_tabs_to_organizations.sql', 'utf-8');
    console.log('---');
    console.log(sql);
    console.log('---');
});
