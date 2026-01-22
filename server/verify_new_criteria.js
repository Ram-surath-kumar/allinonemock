
import { secureDb } from './services/db.js';
import { feeService } from './services/feeService.js';
import fs from 'fs';

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('verify_new_log.txt', msg + '\n');
};
fs.writeFileSync('verify_new_log.txt', ''); // Clear file on start

async function runVerification() {
    log('--- Starting New Criteria Verification (First Graduate & Transgender) ---');
    const context = { performed_by: '00000000-0000-0000-0000-000000000000' };

    try {
        // 0. Cleanup (Deactivate rogue scholarships to avoid interference)
        try {
            const rogues = await secureDb.get('scholarships', q => q.eq('is_active', true));
            if (rogues && rogues.length > 0) {
                for (const r of rogues) {
                    if (r.name.startsWith('Verif')) {
                        await secureDb.update('scholarships', r.id, { is_active: false }, context);
                    }
                }
            }
        } catch (e) { log(`   -> Cleanup warning: ${e.message}`); }

        // 1. Create Test User (Transgender, First Graduate)
        log('1. Creating Test Student...');
        const uniqueId = Date.now();
        const email = `test_new_crit_${uniqueId}@example.com`;

        // Using secureDb.create to avoid password_hash issues
        const student = await secureDb.create('users', {
            email,
            role: 'student',
            name: 'Test Student New Crit',
            // New fields
            gender: 'Transgender',
            is_first_graduate: true,
            category: 'General',
            marks_12th_pct: 80,
            is_bpl: false
        }, context);

        log(`   -> Created Student: ${student.id} (${student.gender}, FirstGrad: ${student.is_first_graduate})`);

        // Update context to use a valid user ID (the student itself) to satisfy FK constraints on 'assigned_by' or 'created_by'
        context.performed_by = student.id;

        // 2. Create Fee Structure
        log('2. Creating Fee Components...');
        const cat = await secureDb.create('fee_categories', { name: `Verif Cat ${uniqueId}` }, context);
        const struct = await secureDb.create('fee_structures', {
            name: `Verif Structure ${uniqueId}`,
            category_id: cat.id,
            total_amount: 100000,
            due_date: '2024-06-01'
        }, context);

        // 3. Create Assignment Rule
        await secureDb.create('fee_assignment_rules', {
            name: 'Verif Rule General',
            student_category: 'General',
            fee_structure_id: struct.id,
            hostel_status: 'any',
            priority: 999
        }, context);

        // 4. Create Scholarships with New Rules
        log('4. Creating Scholarships...');

        // Scholarship A: Transgender Rule (Flat 25k)
        const scholTrans = await secureDb.create('scholarships', {
            name: 'Verif Trans Support',
            type: 'fixed_amount',
            value: 25000,
            is_active: true,
            rules: { gender: 'Transgender' }
        }, context);
        log(`   -> Created Transgender Scholarship (25k)`);

        // Scholarship B: First Graduate Rule (Flat 30k)
        const scholFG = await secureDb.create('scholarships', {
            name: 'Verif First Grad',
            type: 'fixed_amount',
            value: 30000,
            is_active: true,
            rules: { is_first_graduate: true }
        }, context);
        log(`   -> Created First Graduate Scholarship (30k)`);

        // 5. Run Auto-Assign
        log('\n... Running autoAssignFees ...');
        // Passing student.id as expected
        const result = await feeService.autoAssignFees(student.id, context, secureDb);

        if (!result) {
            log('❌ Verification Failed: Auto-assign returned null!');
            return;
        }

        const { assignment } = result;
        log(`\n6. Assignment Result:`);
        log(`   Total: ${assignment.total_amount}`);
        log(`   Discount: ${assignment.discount_amount}`);
        log(`   Scholarship ID: ${assignment.scholarship_id}`);

        // 6. Verify Correct Scholarship Picked
        // Should pick First Graduate (30k) over Transgender (25k) because 30k > 25k
        if (assignment.scholarship_id === scholFG.id && assignment.discount_amount === 30000) {
            log(`\n✅ SUCCESS: Correct scholarship applied (First Graduate - 30k)`);
        } else if (assignment.scholarship_id === scholTrans.id) {
            log(`\n⚠️ PARTIAL: Applied Transgender scholarship (25k). Expected First Grad (30k). Check logic.`);
        } else {
            log(`\n❌ FAILURE: Unexpected result. Discount: ${assignment.discount_amount}`);
        }

    } catch (error) {
        log(`\n❌ CRITICAL FAILURE: ${error.message}`);
        console.error(error);
    }

    log('\n--- End Verification ---');
    process.exit(0);
}

runVerification();
