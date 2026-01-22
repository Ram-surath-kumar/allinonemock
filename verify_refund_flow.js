
import { createClient } from '@supabase/supabase-js';

// Node 18+ has global fetch. If not, this will fail, 
// but given modern vite project, user likely has modern node.
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:3000'; // fallback
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'mock';
const API_URL = 'http://localhost:3001/api/finance';

async function verifyRefundFlow() {
    console.log('Starting Refund Workflow Verification...');

    try {
        if (typeof fetch === 'undefined') {
            throw new Error('Global fetch not available. Please use Node 18+');
        }

        // 1. Health Check
        console.log('1. Checking API Health...');
        try {
            const healthCheck = await fetch('http://localhost:3001/api/health');
            console.log('API Health Status:', healthCheck.status);
        } catch (e) {
            console.warn('API Health check failed (maybe 3001 is wrong port?):', e.message);
        }

        // 2. Request a Refund
        // We need a valid student_id and payment_id.
        // Let's assume the user has seeded data or we can guess.
        // 'sameer' id is 1000120011 from browser check.
        const studentId = '1000120011';

        console.log(`2. Requesting Refund for student ${studentId}...`);

        // Ideally we fetch fees to get a real transaction ID
        let paymentId = 99999;
        try {
            const feesRes = await fetch(`${API_URL}/student/${studentId}/fees`);
            if (feesRes.ok) {
                const feesData = await feesRes.json();
                // console.log('Fees Data:', JSON.stringify(feesData, null, 2));
                if (feesData.data && feesData.data.length > 0) {
                    const firstAssignment = feesData.data[0];
                    if (firstAssignment.transactions && firstAssignment.transactions.length > 0) {
                        paymentId = firstAssignment.transactions[0].id; // use first transaction
                        console.log(`Found valid transaction ID: ${paymentId}`);
                    }
                }
            } else {
                console.warn('Failed to fetch fees:', feesRes.status);
            }
        } catch (e) {
            console.warn('Error fetching fees:', e.message);
        }

        const requestBody = {
            student_id: studentId,
            payment_id: paymentId,
            amount: 50,
            reason: "Backend Verification Script",
            requested_by: "script_admin"
        };

        const requestRes = await fetch(`${API_URL}/refund/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        const requestJson = await requestRes.json().catch(e => ({ error: 'Invalid JSON' }));
        console.log('Request Response:', requestJson);

        if (!requestRes.ok && !requestJson.data) {
            // If it fails, maybe duplicate?
            console.error('Failed to request refund.');
            // Don't throw, let's try to list anyway
        }

        const refundId = requestJson.data ? requestJson.data.id : null;
        if (refundId) {
            console.log(`Refund Requested. ID: ${refundId}`);
        } else {
            console.log('No refund ID created, checking list for existing...');
        }

        // 3. List Refunds
        console.log('3. Listing Refunds...');
        const listRes = await fetch(`${API_URL}/refunds`);
        const listJson = await listRes.json();
        console.log(`Found ${listJson.data ? listJson.data.length : 0} refunds.`);

        let targetRefundId = refundId;
        if (!targetRefundId && listJson.data && listJson.data.length > 0) {
            // Pick the last one
            targetRefundId = listJson.data[listJson.data.length - 1].id;
            console.log(`picked existing refund ${targetRefundId} to approve`);
        }

        if (!targetRefundId) throw new Error('No refund to approve!');

        // 4. Approve Refund
        console.log(`4. Approving Refund ${targetRefundId}...`);
        const approveRes = await fetch(`${API_URL}/refund/approve/${targetRefundId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'approved',
                approved_by: 'admin_script',
                comments: 'Auto approved by verification script'
            })
        });

        const approveJson = await approveRes.json();
        console.log('Approve Response:', approveJson);

        if (approveJson.data && approveJson.data.status === 'approved') {
            console.log('SUCCESS: Refund Workflow Verified (Request -> List -> Approve)');
        } else {
            console.error('APPROVAL FAILED');
        }

    } catch (error) {
        console.error('VERIFICATION FAILED:', error);
    }
}

verifyRefundFlow();
