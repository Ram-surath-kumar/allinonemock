
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

async function verifyData() {
    console.log('Verifying Fee Assignments...');

    // 1. Fetch Assignments
    const { data: assignments, error } = await supabase
        .from('student_fee_assignments')
        .select(`
            id,
            total_amount,
            status,
            student_id,
            structure_id,
            structure:fee_structures(id, name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching assignments:', error);
        return;
    }

    console.log(`Total Assignments Found: ${assignments.length}`);

    // Filter manual check for 'Hostel'
    const hostelFees = assignments.filter(a => a.structure?.name?.toLowerCase().includes('hostel'));
    console.log(`Hostel Fees Found (JS Filter): ${hostelFees.length}`);

    if (hostelFees.length > 0) {
        console.log('Sample Hostel Fee:', JSON.stringify(hostelFees[0], null, 2));
    } else {
        console.log('No Hostel Fees found via JS filter. Dumping first 3 assignments:');
        console.log(JSON.stringify(assignments.slice(0, 3), null, 2));
    }

    // Check fee structures
    const { data: structures } = await supabase.from('fee_structures').select('*');
    console.log(`Total Fee Structures: ${structures.length}`);
    console.log('Structures:', structures.map(s => s.name));
}

verifyData();
