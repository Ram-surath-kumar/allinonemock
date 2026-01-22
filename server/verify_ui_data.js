
import { secureDb } from './services/db.js';
import { feeService } from './services/feeService.js';
import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    // Append to text log
    fs.appendFileSync('verify_ui_log.txt', typeof msg === 'string' ? msg + '\n' : JSON.stringify(msg, null, 2) + '\n');
};
fs.writeFileSync('verify_ui_log.txt', '');

async function runVerification() {
    log('--- Starting UI Data Verification ---');
    // Using a dummy UUID for performed_by to simulate valid context
    const context = { performed_by: '00000000-0000-0000-0000-000000000000' };

    try {
        // 1. Create Test Student
        const uniqueId = Date.now();
        const email = `ui_test_${uniqueId}@example.com`;

        const student = await secureDb.create('users', {
            email,
            role: 'student',
            name: `UI Test User ${uniqueId}`,
            // Full Attributes
            gender: 'Transgender',
            is_first_graduate: true,
            category: 'General',
            marks_12th_pct: 90,
            is_bpl: false
        }, context);

        // Update context to use valid student ID (self-action for setup)
        context.performed_by = student.id;

        log(`1. Created Student: ${student.name} (${student.id})`);

        // 2. Create Fee Components
        const cat = await secureDb.create('fee_categories', { name: `UI Test Cat ${uniqueId}` }, context);
        const struct = await secureDb.create('fee_structures', {
            name: `UI Test Structure ${uniqueId}`,
            category_id: cat.id,
            total_amount: 50000,
            due_date: '2024-09-01'
        }, context);

        // Create Assignment Rule
        await secureDb.create('fee_assignment_rules', {
            name: `UI Test Rule ${uniqueId}`,
            student_category: 'General',
            fee_structure_id: struct.id,
            hostel_status: 'any',
            priority: 1000
        }, context);

        log(`2. Created Fee Structure: ${struct.name} (50k)`);

        // 3. Create Scholarship
        const schol = await secureDb.create('scholarships', {
            name: `UI Test Schol ${uniqueId}`,
            type: 'fixed_amount',
            value: 10000,
            is_active: true,
            rules: { is_first_graduate: true }
        }, context);
        log(`3. Created Scholarship: ${schol.name} (10k)`);

        // 4. Auto Assign
        log('\n4. Running Auto-Assign...');
        const result = await feeService.autoAssignFees(student.id, context, secureDb);
        if (!result) throw new Error("Auto-assign returned null");

        log(`   -> Assigned Fee ID: ${result.assignment.id}`);
        log(`   -> Net Amount: ${result.assignment.net_amount}`);

        // 5. Simulate API Response (The Critical Check)
        log('\n5. Simulating API Fetch (getStudentFees)...');

        // EXACT QUERY FROM finance.js (Simulated Fix)
        const data = await secureDb.get('student_fee_assignments', q => q
            .select(`
                *,
                structure:fee_structures(*),
                installments:fee_installments(*),
                transactions:transactions(*),
                adjustments:adjustments(*)
            `)
            .eq('student_id', student.id)
            .order('created_at', { ascending: false })
        );

        // if (error) throw error; // secureDb throws automatically

        log(`   -> API would return ${data.length} records.`);
        if (data.length > 0) {
            const record = data[0];
            log('   -> Inspecting first record keys:');
            log(Object.keys(record).join(', '));

            // Validation Checks
            const checks = {
                hasStructure: !!record.structure,
                hasInstallments: Array.isArray(record.installments),
                hasTransactions: Array.isArray(record.transactions),
                netAmountMatches: record.net_amount === 40000 // 50k - 10k
            };
            log('   -> Validation Checks:');
            log(checks);

            if (checks.hasStructure && checks.netAmountMatches) {
                log('\n✅ SUCCESS: Data seems complete and correct for UI.');
            } else {
                log('\n❌ FAILURE: Data incomplete or incorrect value.');
            }
        } else {
            log('\n❌ FAILURE: No data found via API query.');
        }

    } catch (e) {
        log(`\n❌ CRITICAL ERROR: ${e.message}`);
        console.error(e);
    }

    process.exit(0);
}

runVerification();
