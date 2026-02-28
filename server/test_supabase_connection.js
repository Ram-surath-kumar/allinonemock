
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('__dirname:', __dirname);
const envPath = path.join(__dirname, '.env');
console.log('Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });
if (result.error) {
    console.error('Error loading .env:', result.error);
} else {
    console.log('.env loaded successfully');
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', supabaseUrl);
console.log('Service Key (first 10 chars):', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testConnection() {
    try {
        // 1. Try to list users (requires Service Role Key)
        console.log('\n--- Test 1: List Users (Admin Auth) ---');
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });

        if (error) {
            console.error('❌ Failed to list users:', error.message);
            if (error.message.includes('Unexpected token')) {
                console.error('   Possible cause: API returned HTML instead of JSON. Check URL.');
            }
        } else {
            console.log('✅ Successfully listed users. Count:', users.length);
            if (users.length > 0) {
                console.log('   First user email:', users[0].email);
            }
        }

        // 2. Try to query a table
        console.log('\n--- Test 2: Query Table (users) ---');
        const { data: tableData, error: tableError } = await supabase
            .from('users')
            .select('count')
            .limit(1)
            .single();

        if (tableError) {
            // It's possible 'users' table is empty or permission issue (though service key bypasses RLS)
            // or .single() failed because row count is 0
            console.log('⚠️ Database query result:', tableError.message);
        } else {
            console.log('✅ Successfully queried database.');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testConnection();
