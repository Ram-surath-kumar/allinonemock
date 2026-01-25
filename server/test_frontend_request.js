
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. We need a valid USER TOKEN to simulate the frontend.
// Since we have the Service Key, we can sign in a dummy user or just use the service key as the bearer?
// No, the middleware `authenticateUser` uses `supabase.auth.getUser(token)`.
// Passing the Service Key as a Bearer token *might* works if Supabase allows it, but usually it expects a User JWT.

// Let's create a real user session using the Admin Client.
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFrontend() {
    console.log('Testing Frontend Request Flow...');

    // 1. Get a valid user token (Sign In)
    // We need a known user email/password.
    // OR we can create a fake user?
    // Let's try to get a session for a new user.
    const email = `test_admin_${Date.now()}@test.com`;
    const password = 'check123check123';

    // Create user
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (createError) {
        console.error('Failed to create test user:', createError.message);
        return;
    }

    const userId = userData.user.id;
    console.log(`Created test user: ${userId}`);

    // Sign in to get token
    const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (loginError) {
        console.error('Login Failed:', loginError.message);
        return;
    }

    const token = sessionData.session.access_token;
    console.log('Got Access Token');

    // 2. Make Request to Backend
    try {
        const url = 'http://localhost:3001/api/finance/assignments?type=Hostel';
        console.log(`Fetching: ${url}`);

        const res = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('Response Status:', res.status);
        if (res.data.data) {
            console.log(`Records Found: ${res.data.data.length}`);
            if (res.data.data.length > 0) {
                console.log('First Record Structure Name:', res.data.data[0].structure?.name);
            }
        } else {
            console.log('Unexpected Response Format:', res.data);
        }

    } catch (apiError) {
        if (apiError.response) {
            console.error('API Error:', apiError.response.status, apiError.response.data);
        } else {
            console.error('Network/Client Error:', apiError.message);
        }
    } finally {
        // Cleanup User
        await supabase.auth.admin.deleteUser(userId);
        console.log('Cleaned up test user');
    }
}

testFrontend();
