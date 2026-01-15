
import { supabaseAdmin } from '../common.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const email = '1000120001@loopverse.in';

async function checkUser() {
    console.log(`Checking for user: ${email}...`);

    const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .or(`email.eq.${email}`);

    if (error) {
        console.error('Error fetching user:', error);
    } else {
        console.log('User found in DB:', data.length);
        if (data.length > 0) {
            console.log('User Details:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('❌ User does NOT exist in public.users table.');
        }
    }
}

checkUser();
