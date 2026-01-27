import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // Load environment variables

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env relative to this script
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const MIGRATION_FILE = path.join(__dirname, 'migrations', 'exam_features.sql');

async function runMigration() {
    try {
        const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
        console.log('Applying migration:', MIGRATION_FILE);

        // Split by semicolons strictly at end of lines to avoid splitting inside strings/procs if simple
        // A better approach is usually sending the whole block if using pg-driver, 
        // but supabase-js rpc might want a function. 
        // However, supabase-js admin usually exposes SQL execution if enabled, 
        // BUT common supabase-js client doesn't support raw SQL query execution easily without a stored procedure.
        // Wait, the user has 'supabaseAdmin' in common.js. Let's see if we can use a custom RPC or if we have postgres connection.
        // The previous 'check_schema.js' likely used something similar? 
        // Wait, 'check_schema.js' is in the root. Let's see how it connects.

        // Actually, often these projects use a direct PG connection or a specific RPC 'exec_sql'.
        // If not, we can try to create a function via RPC if one exists?
        // OR we can just hope there is an 'exec' or 'query' method exposed or we can create a text-based function.

        // FALLBACK: Since I can't confirm 'exec_sql' exists, I will assume we CANNOT define new tables via normal supabase-js client 
        // UNLESS we have a specific RPC setup. 
        // BUT, many setups have a 'exec_sql' function for this purpose.
        // Let's try calling an rpc 'exec_sql'. If it fails, I'll need user help or another approach.

        const { error } = await supabase.rpc('exec_sql', { query: sql });

        if (error) {
            // If RPC not found, we might try direct connection if pg package is installed?
            // 'package.json' does NOT list 'pg'.
            // Only 'supabase-js'.
            // This likely means we can't run DDL unless we have that RPC or use the Dashboard.
            // However, let's try to run it. If it fails, I will notify the user.
            console.error('Migration failed (RPC exec_sql):', error);
        } else {
            console.log('Migration applied successfully!');
        }

    } catch (err) {
        console.error('Migration script error:', err);
    }
}

runMigration();
