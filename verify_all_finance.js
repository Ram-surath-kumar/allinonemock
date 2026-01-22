
import { createClient } from '@supabase/supabase-js';

// Configuration
const API_BASE = 'http://localhost:3001/api/finance';

// Utility logging
const step = (msg) => console.log(`\n[STEP] ${msg}`);
const pass = (msg) => console.log(`  ✅ ${msg}`);
const fail = (msg, err) => console.error(`  ❌ ${msg}`, err.message || err);

async function verifyAllModules() {
    console.log('🚀 Starting Final Finance System Verification...');

    if (typeof fetch === 'undefined') {
        fail('Global fetch API missing. Use Node 18+.');
        return;
    }

    // 1. Fee Management
    step('Checking Fee Management...');
    try {
        const res = await fetch(`${API_BASE}/structures`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || res.statusText);
        pass(`Fee Structures listed: ${json.data ? json.data.length : 0} found`);
    } catch (e) { fail('Fee Management Check Failed', e); }

    // 2. Bank Management
    step('Checking Bank Management...');
    let bankId = null;
    let bankTxId = null;
    try {
        // List Accounts
        const res = await fetch(`${API_BASE}/bank-accounts`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || res.statusText);
        pass(`Bank Accounts listed: ${json.data ? json.data.length : 0} found`);

        if (json.data && json.data.length > 0) {
            bankId = json.data[0].id;
        } else {
            // Create One
            const createRes = await fetch(`${API_BASE}/bank-accounts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_name: 'Verify Bank',
                    account_number: `VB-${Date.now()}`,
                    branch_name: 'Main',
                    ifsc_code: 'VERI0001',
                    opening_balance: 50000
                })
            });
            const createJson = await createRes.json();
            if (createJson.data) {
                bankId = createJson.data.id;
                pass('Created new test bank account');
            }
        }
    } catch (e) { fail('Bank Management Listings Failed', e); }

    if (bankId) {
        try {
            const txRes = await fetch(`${API_BASE}/bank-transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_id: bankId,
                    type: 'deposit',
                    amount: 1000,
                    description: 'Verification Deposit',
                    reference_id: `DEP-${Date.now()}`
                })
            });
            const txJson = await txRes.json();
            if (!txRes.ok) throw new Error('Transaction failed');
            bankTxId = txJson.data?.id || (txJson.data && txJson.data[0]?.id); // Handle single or array return
            pass('Bank Transaction (Deposit) recorded successfully');
        } catch (e) { fail('Bank Transaction Failed', e); }
    }

    // 3. Refunds
    step('Checking Refunds...');
    try {
        const res = await fetch(`${API_BASE}/refunds`);
        if (!res.ok) throw new Error(res.statusText);
        pass('Refunds List endpoint accessible');
    } catch (e) { fail('Refunds Check Failed', e); }

    // 4. Accounting (Journal)
    step('Checking Accounting (Journal Entries)...');
    try {
        const res = await fetch(`${API_BASE}/chart-of-accounts`);
        const json = await res.json();
        pass(`Chart of Accounts listed: ${json.data ? json.data.length : 0} items`);
    } catch (e) { fail('Accounting COA Check Failed', e); }

    // 5. Tax Compliance
    step('Checking Tax Compliance...');
    try {
        // GET
        const res = await fetch(`${API_BASE}/tax/config`);
        if (res.ok) {
            const json = await res.json();
            pass(`Tax Settings retrieved (GST: ${json.data.gst_rate}%)`);

            // POST (Update)
            const updateRes = await fetch(`${API_BASE}/tax/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gst_rate: 18, tds_rate: 10, gst_no: 'VERIFY-GST-123' })
            });
            if (updateRes.ok) pass('Tax Settings updated successfully');
            else fail('Tax Update Failed', await updateRes.json());

        } else {
            fail(`Tax Settings endpoint returned ${res.status}`);
        }
    } catch (e) { fail('Tax Check Failed', e); }

    // 6. Reconciliation
    step('Checking Reconciliation...');
    try {
        const res = await fetch(`${API_BASE}/reconciliation/unmatched`);
        if (res.ok) {
            const json = await res.json();
            pass(`Reconciliation endpoint accessible. Unmatched System: ${json.data?.system?.length}, Bank: ${json.data?.bank?.length}`);

            // Try to match if we have both IDs
            // We need a system transaction ID. Let's list transactions to find one.
            // (Assuming we have one, or skip match test if empty)
            if (bankTxId && json.data?.system?.length > 0) {
                const sysTxId = json.data.system[0].id;
                step(`Attempting to match System Tx ${sysTxId} with Bank Tx ${bankTxId}...`);

                const matchRes = await fetch(`${API_BASE}/reconciliation/match`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transaction_id: sysTxId, bank_transaction_id: bankTxId })
                });

                if (matchRes.ok) pass('Transaction Matched Successfully');
                else fail('Match Failed', await matchRes.json());
            }

        } else {
            fail(`Reconciliation endpoint returned ${res.status} (Likely NOT IMPLEMENTED)`);
        }
    } catch (e) { fail('Reconciliation Check Failed', e); }

    console.log('\nVerification Complete.');
}

verifyAllModules();
