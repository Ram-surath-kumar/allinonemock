import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    const { data, error } = await supabase.from('student_profiles').select('*').limit(1);
    if (data && data.length > 0) {
        const cols = Object.keys(data[0]).sort();
        console.log(JSON.stringify(cols, null, 2));
    } else {
        // If no data, try inserting a dummy row with just user_id to see what error or default cols we get?
        // No, that's dangerous.
        console.log('No data found to infer columns.');

        // Check if we can select 'dob' explicitly
        const { error: dobError } = await supabase.from('student_profiles').select('dob').limit(1);
        if (dobError) console.log('DOB Error:', dobError.message);
        else console.log('DOB column exists!');

        const { error: dob2Error } = await supabase.from('student_profiles').select('date_of_birth').limit(1);
        if (dob2Error) console.log('Date_of_birth Error:', dob2Error.message);
        else console.log('Date_of_birth column exists!');
    }
}

inspectSchema();
