
import 'dotenv/config'; // Load env vars
import { secureDb } from './services/db.js';
import { feeService } from './services/feeService.js';
import fs from 'fs';

// Mock Context
const context = {
    user: { id: 'verif_admin', role: 'admin' },
    reason: 'Verification Script'
};

const runVerification = async () => {
    let logBuffer = '--- Starting Scholarship Verification ---\n';
    const log = (msg) => {
        console.log(msg);
        logBuffer += msg + '\n';
    };

    try {
        log('0. Cleaning environment (Deactivating rogue scholarships)...');
        // Deactivate ANY scholarship with value > 100 and type percentage (invalid data)
        try {
            const rogues = await secureDb.get('scholarships', q => q.eq('type', 'percentage').gt('value', 100).eq('is_active', true));
            if (rogues && rogues.length > 0) {
                for (const r of rogues) {
                    await secureDb.update('scholarships', r.id, { is_active: false }, context);
                    log(`   -> Deactivated rogue ${r.name} (${r.id})`);
                }
            }
        } catch (e) { log(`   -> Clean error: ${e.message}`); }

        log('1. Creating Test Student...');
        const testStudentEmail = `test_scholarship_${Date.now()}@example.com`;

        // secureDb.create returns the object directly, and throws on error
        const student = await secureDb.create('users', {
            email: testStudentEmail,
            name: 'Scholarship Tester',
            role: 'student',
            status: 'active',
            gender: 'female',
            category: 'OBC',
            is_bpl: true,
            marks_12th_pct: 95.5
        }, context);

        log(`   -> Created Student: ${student.id} (${student.gender}, ${student.category})`);

        // 2. Create Fee Category & Head & Structure
        log('2. Creating Fee Components...');
        const cat = await secureDb.create('fee_categories', { name: 'Verif Cat' }, context);
        const struct = await secureDb.create('fee_structures', {
            name: 'Verif Structure',
            category_id: cat.id,
            total_amount: 100000,
            due_date: new Date().toISOString()
        }, context);
        log(`   -> Created Fee Structure: ${struct.id} (100,000)`);

        // 3. Create Assignment Rule
        log('3. Creating Assignment Rule...');
        await secureDb.create('fee_assignment_rules', {
            name: 'Verif Rule',
            student_category: 'OBC',
            fee_structure_id: struct.id,
            hostel_status: 'any',
            priority: 999
        }, context);
        log(`   -> Created Assignment Rule for OBC`);

        // 4. Create Scholarship with Rules
        log('4. Creating Scholarships...');
        // Target: Female + >90% Marks = 50% Off
        const rule1 = {
            gender: 'female',
            min_marks_12th: 90
        };
        const schol1 = await secureDb.create('scholarships', {
            name: 'Verif Merit Female',
            type: 'percentage',
            value: 50,
            rules: rule1
        }, context);
        log(`   -> Created Scholarship 1: 50% Off (Rules: Female, >90% 12th)`);

        // Target: BPL = 10000 Flat Off
        const rule2 = {
            is_bpl: true
        };
        const schol2 = await secureDb.create('scholarships', {
            name: 'Verif BPL',
            type: 'fixed_amount',
            value: 10000,
            rules: rule2
        }, context);
        log(`   -> Created Scholarship 2: 10,000 Off (Rules: BPL)`);

        // 5. Run Auto-Assign
        log(`\n... Running autoAssignFees for student ...`);
        const result = await feeService.autoAssignFees(student.id, context, secureDb);

        if (!result) {
            throw new Error('Auto-assign returned null!');
        }

        const { assignment } = result;
        log(`\n6. Assignment Result:`);
        log(`   Total: ${assignment.total_amount}`);
        log(`   Discount: ${assignment.discount_amount}`);
        log(`   Net: ${assignment.net_amount}`);
        log(`   Scholarship ID: ${assignment.scholarship_id}`);

        if (assignment.scholarship_id) {
            try {
                const s = await secureDb.get('scholarships', q => q.eq('id', assignment.scholarship_id));
                const applied = s[0];
                log(`   -> Applied Name: ${applied.name}`);
                log(`   -> Applied Type: ${applied.type}`);
                log(`   -> Applied Value: ${applied.value}`);
            } catch (e) { log(`   -> Error fetching scholarship details: ${e.message}`); }
        }

        // 6. Assertions
        // Expecting 50% off (50,000) to be chosen over 10,000 flat
        if (Math.abs(assignment.discount_amount - 50000) < 1 && assignment.scholarship_id === schol1.id) {
            log(`\n✅ SUCCCESS: Correct scholarship applied (50% of 100k = 50k)`);
        } else {
            log(`\n❌ FAILURE: Expected directory 50000, got ${assignment.discount_amount}`);
            log(`            Expected Scholarship ID ${schol1.id}, got ${assignment.scholarship_id}`);
        }

    } catch (error) {
        log(`\n❌ Verification Failed: ${error.message}`);
        console.error(error);
    }

    log('\n--- End Verification ---');
    fs.writeFileSync('verify_log.txt', logBuffer);
    process.exit(0);
};

runVerification();
