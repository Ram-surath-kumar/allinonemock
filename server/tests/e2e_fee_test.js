
import { feeService } from '../services/feeService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars explicitly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../server/.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

// Create LOCAL client (known to work from debug_fee.js)
// Disable persistence to avoid async issues
const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

// MOCK SECURE DB
// This mimics the signature of secureDb but uses our local client and skips encryption/audit
const mockSecureDb = {
    get: async (table, queryCallback) => {
        let query = supabase.from(table).select('*');
        if (queryCallback) query = queryCallback(query);
        const { data, error } = await query;
        return { data, error };
    },
    create: async (table, data, context) => {
        const { data: inserted, error } = await supabase.from(table).insert(data).select().single();
        return { data: inserted, error };
    }
};

const context = {
    performed_by: 'test-admin',
    user_role: 'admin',
    ip_address: '127.0.0.1',
    user_agent: 'Test Script',
    user: { id: '00000000-0000-0000-0000-000000000000', email: 'test@admin.com' }
};

async function runTest() {
    console.log('--- Starting Fee Auto-Assignment E2E Test (Mocked DB) ---');

    try {
        // 1. Create a Test Fee Head
        console.log('1. Creating Test Fee Head...');
        const timestamp = Date.now();
        const { data: head, error: headError } = await mockSecureDb.create('fee_heads', {
            name: `Test Tuition Fee ${timestamp}`,
            category: 'Academic',
            is_active: true
        }, context);
        if (headError) throw new Error(`Fee Head Error: ${headError.message}`);
        console.log('   Fee Head Created:', head.id);

        // 2. Create a Test Fee Structure
        console.log('2. Creating Test Fee Structure...');
        const { data: structure, error: structError } = await mockSecureDb.create('fee_structures', {
            name: `Test Structure ${timestamp}`,
            academic_year: '2025-2026',
            due_date: '2025-09-01',
            total_amount: 50000,
            description: 'Test Structure for Auto-Assignment',
            is_active: true
        }, context);
        if (structError) throw new Error(`Structure Error: ${structError.message}`);
        console.log('   Fee Structure Created:', structure.id);

        // Link Head to Structure
        await mockSecureDb.create('fee_structure_items', {
            structure_id: structure.id,
            head_id: head.id,
            amount: 50000,
            is_mandatory: true
        }, context);

        // 3. Create a Test Assignment Rule
        console.log('3. Creating Test Assignment Rule...');
        const { data: rule, error: ruleError } = await mockSecureDb.create('fee_assignment_rules', {
            fee_structure_id: structure.id,
            student_category: 'General',
            hostel_status: 'day_scholar',
            priority: 10,
            num_installments: 4,
            installment_interval_months: 1,
            auto_apply_late_fee: true,
            is_active: true
        }, context);
        if (ruleError) throw new Error(`Rule Error: ${ruleError.message}`);
        console.log('   Assignment Rule Created:', rule.id);

        // 4. Create a Dummy Student
        console.log('4. Creating Dummy Student Record...');
        const studentId = crypto.randomUUID();
        const { data: admission, error: admError } = await mockSecureDb.create('admissions', {
            id: studentId,
            admission_number: `TEST-${timestamp}`,
            student_name: 'Test Student Auto',
            class_id: '10A',
            category: 'General',
            status: 'active'
        }, context);

        let actualStudentId = studentId;
        // Fallback or retry logic if needed (omitted for brevity as we trust mockDb)
        if (admError) {
            console.warn('   Create Admission Failed:', admError.message);
            // Attempt without explicit ID if that was the issue?
            // Usually supbase auto-gens if omitted.
        } else {
            actualStudentId = admission?.id || studentId;
        }

        console.log('   Student Created:', actualStudentId);

        // 5. Test Auto-Assignment Logic using MOCK DB
        console.log('5. Testing autoAssignFees Service Method...');

        // PASS mockSecureDb as the 3rd argument!
        const result = await feeService.autoAssignFees(actualStudentId, context, mockSecureDb);

        if (!result) throw new Error('Result is null - No assignment created');
        console.log('   Auto-Assign Result:', result.assignment ? 'Success' : 'Failed');
        if (result.assignment) {
            console.log('   Assignment ID:', result.assignment.id);
            console.log('   Installments Generated:', result.installments.length);

            // 6. Verification
            if (result.installments.length !== 4) {
                console.error(`❌ FAILED: Expected 4 installments, got ${result.installments.length}`);
                process.exit(1);
            } else {
                console.log('✅ VERIFICATION PASSED: Installments count matches rule (4).');
            }

            // Clean up? (Optional)
        }

    } catch (err) {
        console.error('❌ TEST FAILED:', err);
        process.exit(1);
    } finally {
        console.log('--- Test Finished ---');
        // Explicitly close nothing, just exit
        process.exit(0);
    }
}

runTest();
