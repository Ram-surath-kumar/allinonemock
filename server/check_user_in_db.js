import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser(identifier) {
    console.log(`--- Checking User: ${identifier} ---`);

    // Check by email
    const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', identifier)
        .maybeSingle();

    if (emailData) {
        console.log('✅ Found by email:');
        console.log(JSON.stringify(emailData, null, 2));
    } else if (emailError) {
        console.error('❌ Error checking by email:', emailError.message);
    } else {
        console.log('ℹ️ Not found by email.');
    }

    // Check by loopid
    const { data: loopidData, error: loopidError } = await supabase
        .from('users')
        .select('*')
        .eq('loopid', identifier)
        .maybeSingle();

    if (loopidData) {
        console.log('✅ Found by loopid:');
        console.log(JSON.stringify(loopidData, null, 2));
    } else if (loopidError) {
        console.error('❌ Error checking by loopid:', loopidError.message);
    } else {
        console.log('ℹ️ Not found by loopid.');
    }
}

const identifier = process.argv[2] || '1000120002@loopverse.in';
checkUser(identifier).then(() => {
    if (process.argv[2] !== '1000120002') {
        checkUser('1000120002');
    }
});
