import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('Applying migration...');

    const queries = [
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dob date",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS date_of_birth date",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS guardian_relation text",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS guardian_contact text",
        "ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS doctor_contact text"
    ];

    for (const query of queries) {
        const { error } = await supabase.rpc('execute_sql', { query_text: query });
        if (error) {
            // If RPC not available, this might fail.
            // Try direct raw query if supabase-js supports it? No, it doesn't usually.
            // But maybe I can use the MCP tool again? It failed before.
            // Let's try to assume RPC 'input_query' or similar exists if this is a standard setup.
            // If not, I am stuck without SQL access.
            console.error('Migration failed for query:', query, error);
        } else {
            console.log('Success:', query);
        }
    }
}

// Alternative: Use the admin API if available to run raw SQL?
// Supabase-js doesn't expose raw SQL execution easily without a stored procedure.
// I will try to use the MCP tool AGAIN, maybe the disruption was temporary.
