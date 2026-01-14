
import { createClient } from '@supabase/supabase-js';

// Configuration
const API_BASE = 'http://localhost:3001/api/finance';
const API_ROOT = 'http://localhost:3001/api';

// Standard Chart of Accounts Template
const DEFAULT_ACCOUNTS = [
    { code: '1001', name: 'Cash in Hand', type: 'asset', subtype: 'Current Asset' },
    { code: '1002', name: 'Petty Cash', type: 'asset', subtype: 'Current Asset' },
    { code: '1010', name: 'HDFC Bank - Main', type: 'asset', subtype: 'Bank' },
    { code: '1011', name: 'SBI Bank - Fees', type: 'asset', subtype: 'Bank' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'Current Asset' },
    { code: '2001', name: 'Accounts Payable', type: 'liability', subtype: 'Current Liability' },
    { code: '3001', name: 'Capital Account', type: 'equity', subtype: 'Equity' },
    { code: '4001', name: 'Tuition Fees', type: 'income', subtype: 'Direct Income' },
    { code: '4002', name: 'Transport Fees', type: 'income', subtype: 'Direct Income' },
    { code: '4003', name: 'Hostel Fees', type: 'income', subtype: 'Direct Income' },
    { code: '5001', name: 'Salary Expense', type: 'expense', subtype: 'Indirect Expense' },
    { code: '5002', name: 'Electricity Bill', type: 'expense', subtype: 'Indirect Expense' },
    { code: '5003', name: 'Maintenance', type: 'expense', subtype: 'Indirect Expense' }
];

// Utility logging
const step = (msg) => console.log(`\n[STEP] ${msg}`);
const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg, err) => console.error(`  ❌ ${msg}`, err?.message || err);

async function seedFinance() {
    console.log('🌱 Seeding Finance Module Data...');

    if (typeof fetch === 'undefined') {
        fail('Global fetch API missing. Use Node 18+.');
        return;
    }

    // 1. Seed Chart of Accounts
    step('Seeding Chart of Accounts...');
    try {
        // Check existing
        const res = await fetch(`${API_BASE}/chart-of-accounts`);
        const json = await res.json();

        let existingCodes = new Set();
        if (json.data) {
            existingCodes = new Set(json.data.map(a => a.code));
        }

        let addedCount = 0;
        for (const acct of DEFAULT_ACCOUNTS) {
            if (!existingCodes.has(acct.code)) {
                await fetch(`${API_BASE}/chart-of-accounts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(acct)
                });
                addedCount++;
            }
        }
        pass(`Added ${addedCount} new accounts to Chart of Accounts`);
    } catch (e) { fail('Failed to seed COA', e); }

    // 2. Setup Basic Fee Structure, Assignment, and Transaction (For Reports)
    step('Seeding Fee Structure & Transactions...');
    try {
        // Get a student
        const userRes = await fetch(`${API_ROOT}/users`);
        const userJson = await userRes.json();
        const student = userJson.data?.find(u => u.role === 'student');

        if (!student) {
            console.log('  ⚠️ No student found. Skipping transaction seeding. Create a student user first.');
        } else {
            console.log(`  Found student: ${student.name} (${student.id})`);

            // Create Category
            let catId;
            const catRes = await fetch(`${API_BASE}/fee-categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'General Quota', description: 'Standard fees' })
            });
            const catJson = await catRes.json();
            catId = catJson.data?.id;

            // Create Fee Structure
            let structId;
            if (catId) {
                const structRes = await fetch(`${API_BASE}/structures`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'Grade 10 Annual Fee',
                        batch_year: 2025,
                        semester: 'Annual',
                        category_id: catId,
                        due_date: '2025-12-31',
                        total_amount: 50000,
                        items: [] // Simplified
                    })
                });
                const structJson = await structRes.json();
                structId = structJson.data?.id;
            }

            // Assign Fee
            let assignId;
            if (structId) {
                // Check if already assigned
                const checkRes = await fetch(`${API_BASE}/student/${student.id}/fees`);
                const checkJson = await checkRes.json();

                if (checkJson.data && checkJson.data.length > 0) {
                    assignId = checkJson.data[0].id;
                    console.log('  Student already has assignments.');
                } else {
                    const assignRes = await fetch(`${API_BASE}/assign`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            student_id: student.id,
                            structure_id: structId
                        })
                    });
                    const assignJson = await assignRes.json();
                    assignId = assignJson.data?.id;
                    pass('Assigned Fee Structure to student');
                }
            }

            // Make a Payment (Transaction)
            let txId;
            if (assignId) {
                const payRes = await fetch(`${API_BASE}/pay/manual`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        student_id: student.id,
                        assignment_id: assignId,
                        amount: 25000,
                        payment_method: 'cash',
                        remarks: 'Semi-annual payment',
                        created_by: student.id // Self for demo
                    })
                });
                const payJson = await payRes.json();
                txId = payJson.data?.id;
                if (txId) pass('Recorded a manual payment of 25,000');
            }

            // Create a Refund Request (For Refunds tab)
            if (txId) {
                // Check if refund exists
                const refRes = await fetch(`${API_BASE}/refunds`);
                const refJson = await refRes.json();

                if (!refJson.data || refJson.data.length === 0) {
                    await fetch(`${API_BASE}/refund/request`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transaction_id: txId,
                            student_id: student.id,
                            amount: 5000,
                            reason: 'Overpaid by mistake',
                            requested_by: student.id
                        })
                    });
                    pass('Created a demo Refund Request');
                } else {
                    console.log('  Refund requests already exist.');
                }
            }
        }

    } catch (e) { fail('Failed to seed transactions', e); }

    console.log('\nSeeding Complete.');
}

seedFinance();
