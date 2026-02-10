
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProfileUpsert() {
    console.log('Testing student_profiles UPSERT...');

    try {
        // 1. Get a valid user ID (any user)
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, email')
            .limit(1);

        if (userError || !users || users.length === 0) {
            console.error('FAIL: Could not fetch a user to test with.');
            return;
        }

        const testUser = users[0];
        console.log(`Testing with user: ${testUser.email} (${testUser.id})`);

        // 2. Attempt UPSERT on student_profiles
        // We only update 'updated_at' to be safe and minimally invasive
        const payload = {
            user_id: testUser.id,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('student_profiles')
            .upsert(payload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('FAIL: UPSERT failed.');
            console.error('Error:', error.message);
            if (error.message.includes('unique or exclusion constraint')) {
                console.error('DIAGNOSIS: The UNIQUE constraint on user_id is still missing.');
            }
        } else {
            console.log('SUCCESS: UPSERT successful!');
            console.log('Profile updated/created:', data.id);
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

testProfileUpsert();
