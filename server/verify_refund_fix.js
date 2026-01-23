
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const API_BASE = 'http://localhost:3001/api/finance';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Verifying Refund Fix via API ---');

    try {
        // 1. Setup Auth User
        const email = `test_admin_${Date.now()}@loop.com`;
        const password = 'Password@123';

        console.log(`Creating Admin User: ${email}`);

        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: 'Test Admin' }
        });

        if (createError) throw createError;
        const userId = userData.user.id;

        // Assign Role in public.users
        const { data: existingProfile } = await supabase.from('users').select('*').eq('id', userId).single();
        if (!existingProfile) {
            await supabase.from('users').insert({ id: userId, email, name: 'Test Admin', role: 'admin', status: 'active' });
        } else {
            await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
        }

        // 2. Sign In to get Token
        const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) throw loginError;
        const token = sessionData.session.access_token;
        console.log('Got Auth Token');

        // 3. Setup Data (Refund Request) - SKIPPING, USING EXISTING ID
        const refundId = '1cf556f7-37e4-4768-8371-dda74f62af80';
        console.log(`Using existing Refund Request: ${refundId}`);

        // 4. CALL API TO APPROVE
        console.log(`Sending PUT to ${API_BASE}/refund/approve/${refundId}`);

        const res = await fetch(`${API_BASE}/refund/approve/${refundId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: 'approved',
                approved_by: userId
            })
        });

        const json = await res.json();
        console.log('Response Status:', res.status);
        console.log('Response Body:', JSON.stringify(json, null, 2));

        if (res.status === 200 && json.error === null) {
            console.log('✅ SUCCESS: Refund Approved via API.');
        } else {
            console.log('❌ FAILURE: API Call failed.');
        }

        // Cleanup User
        await supabase.auth.admin.deleteUser(userId);

    } catch (e) {
        console.error('CRITICAL ERROR:', e);
    }
}

run();
