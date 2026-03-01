import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("Testing connection to:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await supabase.from('users').select('name, blood_group, aadhar_no, current_city').limit(2);
        if (error) {
            console.error("DB Error:", error.message);
        } else {
            console.log("✅ DB SUCCESS. Found users:", data);
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}
test();
