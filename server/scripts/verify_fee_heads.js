
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

const EXPECTED_HEADS = {
    'academic': [
        'Tuition Fee', 'Lab Fee', 'Practical Fee', 'Course Fee', 'Exam Fee',
        'Re-exam Fee', 'Thesis/Project Fee', 'Semester Fee'
    ],
    'residential': [
        'Hostel Fee', 'Mess Fee', 'Room Rent', 'Caution Deposit',
        'Hostel Maintenance', 'Utility Charges'
    ],
    'co_curricular': [
        'Sports Fee', 'Club Membership', 'Event Registration', 'Uniform & Materials',
        'Field Trip', 'Excursion'
    ],
    'support': [
        'Library Fee', 'Student Services Fee', 'Medical Insurance', 'Transportation',
        'Internet & WiFi', 'Alumni Fund'
    ],
    'infrastructure': [
        'Lab Equipment Fee', 'Software License Fee', 'Computer Fee',
        'Building Development', 'Infrastructure Maintenance'
    ],
    'examination': [
        'Internal Assessment', 'Final Exam', 'Practical Exam',
        'Project Evaluation', 'Certification Exam'
    ],
    'special': [
        'Late Fee Submission', 'Duplicate Certificate', 'Transcript Charges',
        'Mark Sheet Charges', 'Conduct Certificate', 'Convocation Fee'
    ],
    'penalty': [
        'Late Fee Payment Penalty', 'Document Submission Late Fee', 'Hostel Violation Fine',
        'Library Fine', 'Discipline Fine', 'Damage Charges'
    ]
};

async function verify() {
    console.log('--- Verifying Fee Heads ---');
    const { data: heads, error } = await supabase.from('fee_heads').select('name, type');

    if (error) {
        console.error('Error fetching heads:', error);
        return;
    }

    const existing = new Set(heads.map(h => h.name));
    let missingCount = 0;

    for (const [type, names] of Object.entries(EXPECTED_HEADS)) {
        console.log(`\nCategory: ${type}`);
        names.forEach(name => {
            if (existing.has(name)) {
                console.log(`  ✅ ${name}`);
            } else {
                console.log(`  ❌ MISSING: ${name}`);
                missingCount++;
            }
        });
    }

    if (missingCount === 0) {
        console.log('\n✅ ALL FEE HEADS FOUND!');
    } else {
        console.log(`\n❌ ${missingCount} FEE HEADS MISSING.`);
    }
}

verify();
