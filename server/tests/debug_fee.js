
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load .env from server root
const envPath = path.resolve(__dirname, '../../server/.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Credentials missing. Exiting.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runTest() {
    console.log('--- Connecting to Supabase ---');

    // 1. Direct Table Access
    try {
        const { data, error } = await supabase.from('fee_heads').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Direct Select Failed:', error.message);
        } else {
            console.log('Direct Connection Success. Fee Heads Count:', data);
        }
    } catch (e) {
        console.error('Direct Select Threw:', e);
    }

    // 2. Test Insert
    try {
        console.log('Attempting Insert...');
        const { data, error } = await supabase.from('fee_heads').insert([
            { name: `Debug Head ${Date.now()}`, category: 'General', is_active: true }
        ]).select();

        if (error) {
            console.error('Insert Failed:', error.message);
        } else {
            console.log('Insert Success:', data[0].id);
            // Cleanup
            await supabase.from('fee_heads').delete().eq('id', data[0].id);
            console.log('Cleanup Success');
        }
    } catch (e) {
        console.error('Insert Threw:', e);
    }
}

runTest();
