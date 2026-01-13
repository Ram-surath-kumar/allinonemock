import express from 'express';
import { supabase } from '../supabaseClient.js';

const router = express.Router();

// ==========================================
// 3.1 Fee Management Endpoints
// ==========================================

// Get all Fee Categories
router.get('/fee-categories', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('fee_categories')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Category
router.post('/fee-categories', async (req, res) => {
    try {
        const { name, description } = req.body;
        const { data, error } = await supabase
            .from('fee_categories')
            .insert([{ name, description }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get all Fee Heads
router.get('/fee-heads', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('fee_heads')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Head
router.post('/fee-heads', async (req, res) => {
    try {
        const { name, type, is_refundable } = req.body;
        const { data, error } = await supabase
            .from('fee_heads')
            .insert([{ name, type, is_refundable }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get Fee Structures
router.get('/structures', async (req, res) => {
    try {
        const { batch_year, category_id } = req.query;
        let query = supabase
            .from('fee_structures')
            .select(`
        *,
        category:fee_categories!category_id(name),
        items:fee_structure_items!structure_id(
          id, amount,
          head:fee_heads!head_id(name, type)
        )
      `)
            .order('created_at', { ascending: false });

        if (batch_year) query = query.eq('batch_year', batch_year);
        if (category_id) query = query.eq('category_id', category_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Structure
router.post('/structures', async (req, res) => {
    try {
        const { name, batch_year, semester, category_id, due_date, total_amount, items } = req.body;

        const { data: structure, error: structError } = await supabase
            .from('fee_structures')
            .insert([{ name, batch_year, semester, category_id, due_date, total_amount }])
            .select()
            .single();

        if (structError) throw structError;

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                structure_id: structure.id,
                head_id: item.head_id,
                amount: item.amount
            }));

            const { error: itemsError } = await supabase
                .from('fee_structure_items')
                .insert(itemsToInsert);

            if (itemsError) throw itemsError;
        }

        res.status(201).json({ data: structure, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Retrieve Student's Assigned Fees
router.get('/student/:studentId/fees', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { data, error } = await supabase
            .from('student_fee_assignments')
            .select(`
        *,
        structure:fee_structures(name, due_date, semester, batch_year),
        installments:fee_installments(*),
        transactions:transactions(*),
        adjustments:adjustments(*)
      `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Assign Fee Structure to Student
router.post('/assign', async (req, res) => {
    try {
        const { student_id, structure_id, scholarship_id } = req.body;

        const { data: structure, error: sErr } = await supabase
            .from('fee_structures')
            .select('*')
            .eq('id', structure_id)
            .single();

        if (sErr) throw sErr;

        let discount = 0;
        if (scholarship_id) {
            const { data: scholarship } = await supabase
                .from('scholarships')
                .select('*')
                .eq('id', scholarship_id)
                .single();
            if (scholarship) {
                if (scholarship.type === 'percentage') {
                    discount = (structure.total_amount * scholarship.value) / 100;
                } else {
                    discount = scholarship.value;
                }
            }
        }

        const net_amount = structure.total_amount - discount;

        const { data, error } = await supabase
            .from('student_fee_assignments')
            .insert([{
                student_id,
                structure_id,
                scholarship_id,
                total_amount: structure.total_amount,
                discount_amount: discount,
                net_amount: net_amount,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Installments
router.post('/assignments/:id/installments', async (req, res) => {
    try {
        const { id } = req.params;
        const { installments } = req.body; // array of { amount, due_date, installment_number }

        const items = installments.map(i => ({
            assignment_id: id,
            ...i,
            status: 'pending'
        }));

        const { data, error } = await supabase
            .from('fee_installments')
            .insert(items)
            .select();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Adjustments (Penalty/Discount)
router.post('/adjustments', async (req, res) => {
    try {
        const { student_id, assignment_id, type, amount, reason, created_by } = req.body;

        const { data, error } = await supabase
            .from('adjustments')
            .insert([{ student_id, assignment_id, type, amount, reason, created_by }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Scholarships
router.get('/scholarships', async (req, res) => {
    try {
        const { data, error } = await supabase.from('scholarships').select('*').eq('is_active', true);
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/scholarships', async (req, res) => {
    try {
        const { name, type, value, criteria } = req.body;
        const { data, error } = await supabase
            .from('scholarships')
            .insert([{ name, type, value, criteria }])
            .select()
            .single();
        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.2 Collections & Payments
// ==========================================

// Process Payment (Manual/Cash)
router.post('/pay/manual', async (req, res) => {
    try {
        const { student_id, assignment_id, amount, payment_method, remarks, created_by } = req.body;

        // 1. Create Transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                student_id,
                assignment_id,
                amount,
                payment_method, // cash, cheque, etc.
                remarks,
                created_by,
                status: 'success',
                receipt_number: `REC-${Date.now()}` // Simple generator
            }])
            .select()
            .single();

        if (txError) throw txError;

        // 2. Update Fee Assignment (Paid Amount & Status)
        const { data: assignment, error: assignErr } = await supabase
            .from('student_fee_assignments')
            .select('paid_amount, net_amount')
            .eq('id', assignment_id)
            .single();

        if (!assignErr) {
            const newPaid = (assignment.paid_amount || 0) + parseFloat(amount);
            const newStatus = newPaid >= assignment.net_amount ? 'paid' : 'partial';

            await supabase.from('student_fee_assignments')
                .update({ paid_amount: newPaid, status: newStatus })
                .eq('id', assignment_id);
        }

        res.status(201).json({ data: transaction, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Mock Online Payment
router.post('/pay/online-mock', async (req, res) => {
    try {
        const { student_id, assignment_id, amount, gateway_provider } = req.body;
        const transactionId = `txn_${gateway_provider}_${Date.now()}`;

        // 1. Create Transaction
        const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert([{
                student_id,
                assignment_id,
                amount,
                payment_method: 'online',
                transaction_id: transactionId,
                status: 'success',
                receipt_number: `REC-ONL-${Date.now()}`,
                remarks: `Paid via ${gateway_provider} (Mock)`
            }])
            .select()
            .single();

        if (txError) throw txError;

        // 2. Update Fee Assignment
        const { data: assignment, error: assignErr } = await supabase
            .from('student_fee_assignments')
            .select('paid_amount, net_amount')
            .eq('id', assignment_id)
            .single();

        if (!assignErr) {
            const newPaid = (assignment.paid_amount || 0) + parseFloat(amount);
            const newStatus = newPaid >= assignment.net_amount ? 'paid' : 'partial';

            await supabase.from('student_fee_assignments')
                .update({ paid_amount: newPaid, status: newStatus })
                .eq('id', assignment_id);
        }

        res.status(201).json({ data: transaction, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get Payment Receipt
router.get('/receipt/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('transactions')
            .select(`
        *,
        student:users(name, email, loopid),
        assignment:student_fee_assignments(
          structure:fee_structures(name, semester, batch_year)
        )
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.3 Refund & Adjustments
// ==========================================

router.post('/refund/request', async (req, res) => {
    try {
        const { transaction_id, student_id, amount, reason, requested_by } = req.body;
        const { data, error } = await supabase
            .from('refund_requests')
            .insert([{ transaction_id, student_id, amount, reason, requested_by, status: 'requested' }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.put('/refund/approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by, status } = req.body; // status: approved/rejected
        const { data, error } = await supabase
            .from('refund_requests')
            .update({ status, approved_by, processed_date: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.status(200).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get All Refund Requests
router.get('/refunds', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('refund_requests')
            .select(`
                *,
                student:users(name, email, loopid),
                transaction:transactions(amount, payment_method, id)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.status(200).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Financial Statements Report
router.get('/reports/financial-statements', async (req, res) => {
    try {
        // 1. Income (Total Fees Paid)
        const { data: fees, error: feeErr } = await supabase
            .from('student_fee_assignments')
            .select('paid_amount, net_amount');

        if (feeErr) throw feeErr;

        const totalIncome = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
        const totalReceivables = fees.reduce((sum, f) => sum + (f.net_amount - (f.paid_amount || 0)), 0);

        // 2. Expenses (Refunds Approved)
        const { data: refunds, error: refErr } = await supabase
            .from('refund_requests')
            .select('amount')
            .eq('status', 'approved');

        if (refErr) throw refErr;
        const totalExpense = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);

        // 3. Assets (Bank Balances)
        const { data: banks, error: bankErr } = await supabase
            .from('bank_accounts')
            .select('current_balance');

        if (bankErr) throw bankErr;
        const totalBankBalance = banks.reduce((sum, b) => sum + (b.current_balance || 0), 0);

        const data = {
            income: totalIncome,
            expense: totalExpense,
            asset: totalBankBalance + totalReceivables, // Cash + Receivables
            liability: 0, // Placeholder
            equity: totalBankBalance + totalReceivables // Assets - Liabilities
        };

        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.4 General Accounting
// ==========================================

// Get Chart of Accounts
router.get('/chart-of-accounts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('chart_of_accounts')
            .select('*')
            .order('code');
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Journal Entry
router.post('/journal', async (req, res) => {
    try {
        const { date, description, lines, created_by } = req.body; // lines: [{ account_id, debit, credit }]

        const { data: entry, error: entryErr } = await supabase
            .from('journal_entries')
            .insert([{ date, description, created_by, status: 'posted' }])
            .select()
            .single();

        if (entryErr) throw entryErr;

        if (lines && lines.length > 0) {
            const linesToInsert = lines.map(line => ({
                journal_entry_id: entry.id,
                account_id: line.account_id,
                debit: line.debit || 0,
                credit: line.credit || 0
            }));

            const { error: linesErr } = await supabase
                .from('journal_lines')
                .insert(linesToInsert);

            if (linesErr) throw linesErr;
        }

        res.status(201).json({ data: entry, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.5 Bank & 3.6 Tax (Basic)
// ==========================================

router.get('/bank-accounts', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bank_accounts')
            .select('*');
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/bank-accounts', async (req, res) => {
    try {
        const { bank_name, account_number, branch_name, ifsc_code, opening_balance } = req.body;
        const { data, error } = await supabase
            .from('bank_accounts')
            .insert([{
                bank_name,
                account_number,
                branch_name,
                ifsc_code,
                opening_balance,
                current_balance: opening_balance // Init current balance
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/bank-transactions', async (req, res) => {
    try {
        const { bank_id, type, amount, description, reference_id } = req.body;

        // 1. Record Transaction
        const { data: transaction, error: txError } = await supabase
            .from('bank_transactions')
            .insert([{ bank_id, type, amount, description, reference_id, date: new Date() }])
            .select()
            .single();

        if (txError) throw txError;

        // 2. Update Bank Balance
        const { data: account, error: accError } = await supabase
            .from('bank_accounts')
            .select('current_balance')
            .eq('id', bank_id)
            .single();

        if (!accError) {
            let newBalance = account.current_balance;
            if (type === 'deposit') newBalance += parseFloat(amount);
            else if (type === 'withdrawal') newBalance -= parseFloat(amount);

            await supabase
                .from('bank_accounts')
                .update({ current_balance: newBalance })
                .eq('id', bank_id);
        }

        res.status(201).json({ data: transaction, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.get('/bank-transactions/:bankId', async (req, res) => {
    try {
        const { bankId } = req.params;
        const { data, error } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('bank_id', bankId)
            .order('date', { ascending: false });
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.get('/tax-settings', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tax_settings')
            .select('*');
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.7 Reports
// ==========================================

router.get('/reports/collection', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        let query = supabase
            .from('transactions')
            .select('amount, payment_method, transaction_date')
            .eq('status', 'success');

        if (start_date) query = query.gte('transaction_date', start_date);
        if (end_date) query = query.lte('transaction_date', end_date);

        const { data, error } = await query;
        if (error) throw error;

        // Aggregate by method
        const summary = data.reduce((acc, curr) => {
            acc.total += curr.amount;
            acc[curr.payment_method] = (acc[curr.payment_method] || 0) + curr.amount;
            return acc;
        }, { total: 0 });

        res.json({ data: summary, transactions: data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Outstanding Fees Report
router.get('/reports/outstanding', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('student_fee_assignments')
            .select(`
                *,
                student:users(name, email, loopid),
                structure:fee_structures(name)
            `)
            .neq('status', 'paid');

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Scholarship Usage Report
router.get('/reports/scholarship-usage', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('student_fee_assignments')
            .select(`
                *,
                student:users(name, email, loopid),
                scholarship:scholarships(name)
            `)
            .not('scholarship_id', 'is', null);

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.6 Refunds
// ==========================================


// ==========================================
// 3.6 Refunds
// ==========================================

router.get('/refunds', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('refund_requests')
            .select(`
                *,
                student:users!student_id(name, email, loopid)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ... (existing refund routes) ...

// ==========================================
// 3.7 Tax & Reconciliation
// ==========================================

// Fix: Use 'tax_config' table
router.get('/tax-settings', async (req, res) => {
    try {
        const { data, error } = await supabase.from('tax_config').select('*').single();
        // If no config exists, return default
        if (!data && !error) return res.json({ data: { gst_rate: 18, tds_rate: 10 }, error: null });
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows
        res.json({ data: data || { gst_rate: 18, tds_rate: 10 }, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Alias for api.ts call /finance/tax/config
router.get('/tax/config', async (req, res) => {
    try {
        const { data, error } = await supabase.from('tax_config').select('*').single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json({ data: data || { gst_rate: 18, tds_rate: 10 }, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/tax/config', async (req, res) => {
    try {
        const { gst_rate, tds_rate, gst_no } = req.body;
        // Upsert (assuming single row with id=1, or just always update)
        // Let's check if we have one
        const { data: existing } = await supabase.from('tax_config').select('id').single();

        let result;
        if (existing) {
            result = await supabase.from('tax_config').update({ gst_rate, tds_rate, gst_no, updated_at: new Date() }).eq('id', existing.id).select().single();
        } else {
            result = await supabase.from('tax_config').insert([{ gst_rate, tds_rate, gst_no }]).select().single();
        }

        if (result.error) throw result.error;
        res.json({ data: result.data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Reconciliation
router.get('/reconciliation/unmatched', async (req, res) => {
    try {
        // 1. Get all reconciled IDs
        const { data: reconciled, error: rErr } = await supabase.from('reconciliations').select('transaction_id, bank_transaction_id');
        if (rErr) throw rErr;

        const reconciledTxIds = reconciled.map(r => r.transaction_id).filter(id => id);
        const reconciledBankIds = reconciled.map(r => r.bank_transaction_id).filter(id => id);

        // 2. Get Unmatched System Transactions
        let systemQuery = supabase.from('transactions').select('*').eq('status', 'success');
        if (reconciledTxIds.length > 0) {
            systemQuery = systemQuery.not('id', 'in', `(${reconciledTxIds.join(',')})`);
        }
        const { data: system, error: sErr } = await systemQuery;
        if (sErr) throw sErr;

        // 3. Get Unmatched Bank Transactions
        let bankQuery = supabase.from('bank_transactions').select('*');
        if (reconciledBankIds.length > 0) {
            bankQuery = bankQuery.not('id', 'in', `(${reconciledBankIds.join(',')})`);
        }
        const { data: bank, error: bErr } = await bankQuery;
        if (bErr) throw bErr;

        res.json({ data: { system, bank }, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/reconciliation/match', async (req, res) => {
    try {
        const { transaction_id, bank_transaction_id } = req.body;
        const { data, error } = await supabase
            .from('reconciliations')
            .insert([{ transaction_id, bank_transaction_id }])
            .select()
            .single();

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});


router.post('/refund/request', async (req, res) => {
    try {
        const { student_id, payment_id, amount, reason, requested_by } = req.body;
        const { data, error } = await supabase
            .from('refund_requests')
            .insert([{
                student_id,
                payment_id,
                amount,
                reason,
                status: 'requested',
                created_at: new Date()
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.put('/refund/approve/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, approved_by } = req.body; // 'approved' or 'rejected'

        const { data, error } = await supabase
            .from('refund_requests')
            .update({ status, approved_by, updated_at: new Date() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});



export default router;
