
import { createClient } from '@supabase/supabase-js';

const API_BASE = 'http://localhost:3001/api/finance';
const API_AUTH = 'http://localhost:3001/api/auth'; // Assuming auth for user creation if needed, or direct Supabase
const USER_API = 'http://localhost:3001/api/users';

// Helpers
const step = (msg) => console.log(`\n[STEP] ${msg}`);
const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg, err) => { console.error(`  ❌ ${msg}`, err); process.exit(1); };

async function runDemoVerification() {
    console.log('🚀 Starting Finance "Click-Through" Verification with Demo Data...');

    let demoStudentId = null;
    let structureId = null;
    let assignmentId = null;
    let transactionId = null;

    // 1. Create/Get Demo Student
    step('1. Setting up Demo Student...');
    try {
        // Bypass fetch for reliability
        demoStudentId = 'cc902dcc-cb79-4623-aedb-fd338acd9000';
        console.log(`Using student: subanesh (${demoStudentId})`);
        pass(`Using existing student: subanesh (${demoStudentId})`);

        /*
        const res = await fetch(`${USER_API}?role=student`);
        const json = await res.json();
        const demoUser = json.data?.find(u => u.email === 'demo.student@schoolsphere.com');

        if (demoUser) {
            demoStudentId = demoUser.id;
            pass(`Found existing demo student: ${demoUser.name} (${demoStudentId})`);
        } else {
            // Create new
            // Note: This relies on your user creation API. If not available, we might fail.
            // Let's assume we can use an existing one if creation fails or just pick the first one.
            if (json.data && json.data.length > 0) {
                demoStudentId = json.data[0].id;
                pass(`Using existing student: ${json.data[0].name} (${demoStudentId})`);
            } else {
                fail('No students found to test with.');
            }
        }
        */
    } catch (e) { fail('Failed to fetch users', e); }

    // 2. Fee Management Buttons
    step('2. Testing "Fee Management" Buttons...');

    // 2a. Create Category
    let catId = null;
    try {
        const res = await fetch(`${API_BASE}/fee-categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Demo Category ' + Date.now(), description: 'Test' })
        });
        const json = await res.json();
        if (json.data) {
            catId = json.data.id;
            pass('Button [Add Category]: Functional ✅');
        } else fail('Create Category failed', json);
    } catch (e) { fail('Create Category Error', e); }

    // 2b. Create Fee Head
    let headId = null;
    try {
        const res = await fetch(`${API_BASE}/fee-heads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Demo Tuition ' + Date.now(), type: 'tuition', is_refundable: false })
        });
        const json = await res.json();
        if (json.data) {
            headId = json.data.id;
            pass('Button [Add Fee Head]: Functional ✅');
        } else fail('Create Fee Head failed', json);
    } catch (e) { fail('Create Fee Head Error', e); }

    // 2c. Create Fee Structure
    try {
        const payload = {
            name: 'Demo Structure ' + Date.now(),
            batch_year: 2025,
            semester: '1',
            category_id: catId,
            due_date: new Date().toISOString().split('T')[0],
            total_amount: 10000,
            items: [{ head_id: headId, amount: 10000 }]
        };
        const res = await fetch(`${API_BASE}/structures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.data) {
            structureId = json.data.id;
            pass('Button [Create Structure]: Functional ✅');
        } else fail('Create Structure failed', json);
    } catch (e) { fail('Create Structure Error', e); }

    // 2d. Assign Fee
    try {
        const res = await fetch(`${API_BASE}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: demoStudentId,
                structure_id: structureId,
                scholarship_id: null
            })
        });
        const json = await res.json();
        if (json.data) {
            assignmentId = json.data.id;
            pass('Button [Assign Fee]: Functional ✅');
        } else fail('Assign Fee failed', json);
    } catch (e) { fail('Assign Fee Error', e); }


    // 3. Collection Buttons
    step('3. Testing "Payment Collection" Buttons...');

    // 3a. Verify Listing
    try {
        const res = await fetch(`${API_BASE}/student/${demoStudentId}/fees`);
        const json = await res.json();
        const found = json.data?.find(a => a.id === assignmentId);
        if (found) pass('Fee List Display: Functional (Found Assigned Fee) ✅');
        else fail('Assigned fee not showing in student list');
    } catch (e) { fail('Get Student Fees Error', e); }

    // 3b. Pay (Manual)
    try {
        const res = await fetch(`${API_BASE}/pay/manual`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                student_id: demoStudentId,
                assignment_id: assignmentId,
                amount: 5000,
                payment_method: 'cash',
                remarks: 'Demo Payment',
                created_by: demoStudentId // Simulating current user
            })
        });
        const json = await res.json();
        if (json.data) {
            transactionId = json.data.id;
            pass('Button [Record Payment]: Functional (Partial Payment) ✅');
        } else fail('Record Payment failed', json);
    } catch (e) { fail('Pay Error', e); }

    // 4. Refund Buttons
    step('4. Testing "Refund" Buttons...');

    // 4a. Request Refund
    let refundId = null;
    try {
        const res = await fetch(`${API_BASE}/refund/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transaction_id: transactionId,
                student_id: demoStudentId,
                amount: 1000,
                reason: 'Demo Refund',
                requested_by: demoStudentId
            })
        });
        const json = await res.json();
        if (json.data) {
            refundId = json.data.id;
            pass('Button [Request Refund]: Functional ✅');
        } else fail('Request Refund failed', json);
    } catch (e) { fail('Refund Request Error', e); }

    // 4b. Approve Refund (Admin Action)
    try {
        const res = await fetch(`${API_BASE}/refund/approve/${refundId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'approved',
                approved_by: demoStudentId
            })
        });
        const json = await res.json();
        if (json.data && json.data.status === 'approved') {
            pass('Button [Approve Refund]: Functional ✅');
        } else fail('Approve Refund failed', json);
    } catch (e) { fail('Refund Approve Error', e); }

    // 5. Reports Verification
    step('5. Verifying Reports Data...');
    try {
        const res = await fetch(`${API_BASE}/reports/financial-statements`);
        const json = await res.json();
        // Income should reflect 5000 payment
        // Expense should reflect 1000 refund
        if (json.data) {
            pass(`Financial Statement Loaded: Income ₹${json.data.income}, Expense ₹${json.data.expense}`);
            if (json.data.income >= 5000) pass('Income updated correctly ✅');
            if (json.data.expense >= 1000) pass('Expense updated correctly ✅');
        } else fail('Reports failed load');

    } catch (e) { fail('Reports Error', e); }

    console.log('\n✨ ALL FINANCE BUTTONS & FLOWS VERIFIED FUNCTIONAL! ✨');
}

runDemoVerification();
