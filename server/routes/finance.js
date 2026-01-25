import express from 'express';
import { supabase } from '../supabaseClient.js';
import { authenticateUser, authorizeRole } from '../middleware/auth.js';
import { secureDb } from '../services/db.js';
import { feeService } from '../services/feeService.js';

const router = express.Router();

// Apply Global Authentication
router.use(authenticateUser);

const getContext = (req, reason) => ({
    user: req.user,
    userProfile: req.userProfile,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    reason
});

// ==========================================
// 3.1 Fee Management Endpoints
// ==========================================

// Auto-Assign Fees to Student
router.post('/auto-assign/:studentId', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { studentId } = req.params;
        const context = getContext(req, 'Auto-Assign Fees');
        const assignment = await feeService.autoAssignFees(studentId, context);
        if (!assignment) {
            return res.status(404).json({ data: null, error: 'No matching fee rules found for student' });
        }
        res.json({ data: assignment, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.1 Fee Management Endpoints
// ==========================================

// Get all Fee Categories
router.get('/fee-categories', async (req, res) => {
    try {

        const data = await secureDb.get('fee_categories', q => q.order('name'));

        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Category
router.post('/fee-categories', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {

        const { name, description } = req.body;
        const context = getContext(req, 'Create Fee Category');
        const data = await secureDb.create('fee_categories', { name, description }, context);

        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get all Fee Heads
router.get('/fee-heads', async (req, res) => {
    try {

        const data = await secureDb.get('fee_heads', q => q.order('name'));

        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Head
// Create Fee Head
router.post('/fee-heads', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const fs = await import('fs');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.appendFileSync('server_debug_log.txt', `[${time}] ${msg}\n`);
        };

        const { name, type, is_refundable } = req.body;
        log(`Create Fee Head request: ${JSON.stringify({ name, type, is_refundable })}`);

        const context = getContext(req, 'Create Fee Head');
        const data = await secureDb.create('fee_heads', { name, type, is_refundable }, context);

        log(`Fee Head created successfully: ${JSON.stringify(data)}`);
        res.status(201).json({ data, error: null });
    } catch (error) {
        const fs = await import('fs');
        const time = new Date().toISOString();
        fs.appendFileSync('server_debug_log.txt', `[${time}] Fee Head Creation Error: ${error.message}\n`);
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get Fee Structures
router.get('/structures', async (req, res) => {
    try {
        const { batch_year, category_id } = req.query;
        const data = await secureDb.get('fee_structures', (query) => {
            let q = query.select(`
                *,
                category:fee_categories!category_id(name),
                items:fee_structure_items!structure_id(
                  id, amount,
                  head:fee_heads!head_id(name, type)
                )
            `).order('created_at', { ascending: false });

            if (batch_year) q = q.eq('batch_year', batch_year);
            if (category_id) q = q.eq('category_id', category_id);
            return q;
        });
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Fee Structure
router.post('/structures', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { name, batch_year, semester, due_date, total_amount, items } = req.body;

        // Create Fee Structure
        const context = getContext(req, 'Create Fee Structure');
        const structure = await secureDb.create('fee_structures', {
            name, batch_year, semester, due_date, total_amount
        }, context);

        // if (structError) throw structError;

        if (items && items.length > 0) {
            const itemsToInsert = items.map(item => ({
                structure_id: structure.id,
                head_id: item.head_id,
                amount: item.amount
            }));

            // Bulk insert is not yet directly supported by secureDb wrappers well for audit of each item?
            // For now, we use standard insert via supabase but we should ideally audit.
            // Or we iterate. Iterating is safer for audit.
            // Let's iterate for security compliance.
            for (const item of itemsToInsert) {
                await secureDb.create('fee_structure_items', item, { ...context, reason: 'Fee Structure Item' });
            }
        }

        res.status(201).json({ data: structure, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Retrieve All Fee Assignments (with search/filters)
router.get('/assignments', async (req, res) => {
    try {
        const fs = await import('fs');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.appendFileSync('server_debug_log.txt', `[${time}] [API-ASSIGNMENTS] ${msg}\n`);
        };

        log(`Request by User: ${req.userProfile?.email} (Role: ${req.userProfile?.role})`);

        const { search, type, status, limit = 50 } = req.query;
        log(`Params: search=${search}, type=${type}, status=${status}`);

        const data = await secureDb.get('student_fee_assignments', (query) => {
            let q = query
                .select(`
                    *,
                    student:users!student_id(name, email, loopid),
                    structure:fee_structures!structure_id(name, batch_year, semester)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (status) q = q.eq('status', status);
            return q;
        });

        log(`Raw Fetch Count: ${data?.length}`);

        // Manual filtering
        let filtered = data || [];

        if (type) {
            filtered = filtered.filter(a => {
                const sName = a.structure?.name;
                if (!sName) return false;
                return sName.toLowerCase().includes(type.toLowerCase());
            });
        }

        if (search) {
            const s = search.toLowerCase();
            filtered = filtered.filter(a => {
                const studentName = a.student?.name?.toLowerCase() || '';
                const studentId = a.student?.loopid?.toLowerCase() || '';
                return studentName.includes(s) || studentId.includes(s);
            });
        }

        log(`Returned Count: ${filtered.length}`);
        if (filtered.length === 0 && data.length > 0) {
            log('Filtering removed all records. Sample structure names: ' + data.map(d => d.structure?.name).join(', '));
        }

        res.json({ data: filtered, error: null });
    } catch (error) {
        // Log error
        const fs = await import('fs');
        fs.appendFileSync('server_debug_log.txt', `[${new Date().toISOString()}] [API-ERROR] ${error.message}\n`);
        res.status(500).json({ data: null, error: error.message });
    }
});

// Retrieve Student's Assigned Fees
router.get('/student/:studentId/fees', async (req, res) => {
    try {
        const { studentId } = req.params;
        const fs = await import('fs');
        const log = (msg) => fs.appendFileSync('server_debug_log.txt', msg + '\n');

        log(`[DEBUG] Request for Student: ${studentId}`);

        const data = await secureDb.get('student_fee_assignments', q => q
            .select(`
                *,
                structure:fee_structures(*),
                installments:fee_installments(*),
                transactions:transactions(*),
                adjustments:adjustments(*)
            `)
            .eq('student_id', studentId)
            .order('created_at', { ascending: false })
        );

        // if (error) handled by catch block

        log(`[DEBUG] Found ${data?.length || 0} assignments.`);
        if (data && data.length > 0) {
            log(`[DEBUG] First Data: ${JSON.stringify(data[0])}`);
        } else {
            log(`[DEBUG] Data is empty!`);
        }

        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Assign Fee Structure to Student
router.post('/assign', authorizeRole(['admin', 'finance', 'registrar']), async (req, res) => {
    try {
        const { student_id, structure_id, scholarship_id } = req.body;

        const structure = await secureDb.get('fee_structures', q => q.eq('id', structure_id).single());
        // if (sErr) throw sErr; // Handled by secureDb throw

        let discount = 0;
        if (scholarship_id) {
            const scholarship = await secureDb.get('scholarships', q => q.eq('id', scholarship_id).single());

            if (scholarship) {
                if (scholarship.type === 'percentage') {
                    discount = (structure.total_amount * scholarship.value) / 100;
                } else {
                    discount = scholarship.value;
                }
            }
        }

        const net_amount = structure.total_amount - discount;
        const context = getContext(req, 'Assign Fee Structure');

        const data = await secureDb.create('student_fee_assignments', {
            student_id,
            structure_id,
            scholarship_id,
            total_amount: structure.total_amount,
            discount_amount: discount,
            net_amount: net_amount,
            status: 'pending'
        }, context);

        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Update Fee Assignment Status (Manual Override)
router.patch('/assignments/:id/status', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paid_amount, notes } = req.body;
        const context = getContext(req, 'Manual Status Update');

        const updateData = { status, updated_at: new Date() };
        if (paid_amount !== undefined) updateData.paid_amount = paid_amount;

        // If status is paid, ensure paid_amount = net_amount if not provided?
        // Let's trust the frontend or user input for now to be flexible (e.g. waiving off)

        const data = await secureDb.update('student_fee_assignments', id, updateData, context);

        // Log to debug
        const fs = await import('fs');
        const time = new Date().toISOString();
        fs.appendFileSync('server_debug_log.txt', `[${time}] [FEE-UPDATE] Updated ${id} to ${status} (Paid: ${paid_amount})\n`);

        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Bulk Assign Fee Structure
router.post('/assign-bulk', authorizeRole(['admin', 'finance', 'registrar']), async (req, res) => {
    try {
        const { student_ids, structure_id, scholarship_id } = req.body;
        // student_ids is an array of strings

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ data: null, error: 'No students selected' });
        }

        const structure = await secureDb.get('fee_structures', q => q.eq('id', structure_id).single());
        if (!structure) throw new Error('Fee Structure not found');

        let discount = 0;
        if (scholarship_id) {
            const scholarship = await secureDb.get('scholarships', q => q.eq('id', scholarship_id).single());
            if (scholarship) {
                if (scholarship.type === 'percentage') {
                    discount = (structure.total_amount * scholarship.value) / 100;
                } else {
                    discount = scholarship.value;
                }
            }
        }

        const net_amount = structure.total_amount - discount;
        const context = getContext(req, 'Bulk Assign Fee Structure');

        // Iterate and create assignments
        // Using Promise.all for parallel execution but handling errors individually might be better?
        // Let's do parallel for speed.

        const assignments = student_ids.map(student_id => ({
            student_id,
            structure_id,
            scholarship_id,
            total_amount: structure.total_amount,
            discount_amount: discount,
            net_amount: net_amount,
            status: 'pending'
        }));

        const results = [];
        // Insert one by one to ensure individual failures don't block all (or use bulk insert if secureDb supports it)
        // secureDb.create usually takes one object.
        // We will loop.

        for (const item of assignments) {
            try {
                const data = await secureDb.create('student_fee_assignments', item, context);
                results.push({ student_id: item.student_id, status: 'success', id: data.id });
            } catch (e) {
                results.push({ student_id: item.student_id, status: 'failed', error: e.message });
            }
        }

        res.status(201).json({ data: results, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});


// Manage Fee Assignment Rules
router.get('/assignment-rules', async (req, res) => {
    try {
        const data = await secureDb.get('fee_assignment_rules', q => q.order('priority', { ascending: false }));
        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/assignment-rules', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const context = getContext(req, 'Create Fee Assignment Rule');
        const data = await secureDb.create('fee_assignment_rules', req.body, context);
        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Manage Penalty Configs
router.get('/penalty-configs', async (req, res) => {
    try {
        const data = await secureDb.get('fee_penalty_configs', q => q.order('created_at'));
        // if (error) throw error;
        res.json({ data, error: null });
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

        const context = getContext(req, 'Create Installments');

        // Loop for audit
        for (const item of items) {
            await secureDb.create('fee_installments', item, context);
        }

        // Return success (data might be last item or null for now, or fetch all)
        // For simplicity, just return success
        res.status(201).json({ data: items, error: null });

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
        const context = getContext(req, 'Fee Adjustment');
        const data = await secureDb.create('adjustments', {
            student_id, assignment_id, type, amount, reason, created_by
        }, context);

        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Scholarships
router.get('/scholarships', async (req, res) => {
    try {
        const data = await secureDb.get('scholarships', q => q.select('*').eq('is_active', true));
        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/scholarships', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { name, type, value, criteria, rules } = req.body;
        const context = getContext(req, 'Create Scholarship');
        const data = await secureDb.create('scholarships', { name, type, value, criteria, rules }, context);
        // if (error) throw error;
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
        const context = getContext(req, 'Manual Payment');

        const transaction = await secureDb.create('transactions', {
            student_id,
            assignment_id,
            amount,
            payment_method, // cash, cheque, etc.
            remarks,
            created_by,
            status: 'success',
            receipt_number: `REC-${Date.now()}` // Simple generator
        }, context);

        // if (txError) throw txError;

        // 2. Update Fee Assignment (Paid Amount & Status)
        const assignment = await secureDb.get('student_fee_assignments', q => q
            .select('paid_amount, net_amount')
            .eq('id', assignment_id)
            .single()
        );

        if (assignment) {
            const newPaid = (assignment.paid_amount || 0) + parseFloat(amount);
            const newStatus = newPaid >= assignment.net_amount ? 'paid' : 'partial';

            await secureDb.update('student_fee_assignments', assignment_id, {
                paid_amount: newPaid, status: newStatus
            }, { ...context, reason: 'Update Payment Status' });
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
        const context = getContext(req, 'Online Payment Mock');

        // 1. Create Transaction
        const transaction = await secureDb.create('transactions', {
            student_id,
            assignment_id,
            amount,
            payment_method: 'online',
            transaction_id: transactionId,
            status: 'success',
            receipt_number: `REC-ONL-${Date.now()}`,
            remarks: `Paid via ${gateway_provider} (Mock)`
        }, context);

        // 2. Update Fee Assignment
        const assignment = await secureDb.get('student_fee_assignments', q => q
            .select('paid_amount, net_amount')
            .eq('id', assignment_id)
            .single()
        );

        if (assignment) {
            const newPaid = (assignment.paid_amount || 0) + parseFloat(amount);
            const newStatus = newPaid >= assignment.net_amount ? 'paid' : 'partial';

            await secureDb.update('student_fee_assignments', assignment_id, {
                paid_amount: newPaid, status: newStatus
            }, { ...context, reason: 'Update Payment Status' });
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
        const data = await secureDb.get('transactions', q => q
            .select(`
                *,
                student:users(name, email, loopid),
                assignment:student_fee_assignments(
                    structure:fee_structures(name, semester, batch_year)
                )
            `)
            .eq('id', id)
            .single()
        );

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
        const context = getContext(req, 'Refund Request');
        const data = await secureDb.create('refund_requests', {
            transaction_id, student_id, amount, reason, requested_by, status: 'requested'
        }, context);

        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.put('/refund/approve/:id', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by, status } = req.body; // status: approved/rejected

        const fs = await import('fs');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.appendFileSync('server_debug_log.txt', `[${time}] [REFUND-APPROVE] ${msg}\n`);
        };
        log(`Request to update Refund ${id} to ${status} by ${approved_by}`);

        const context = getContext(req, 'Approve Refund');

        const data = await secureDb.update('refund_requests', id, {
            status, approved_by, processed_date: new Date()
        }, context);

        log(`Success: Updated Refund ${id}`);
        // if (error) throw error;
        res.status(200).json({ data, error: null });
    } catch (error) {
        const fs = await import('fs');
        fs.appendFileSync('server_debug_log.txt', `[${new Date().toISOString()}] [REFUND-ERROR] ${error.message}\n${error.stack}\n`);
        console.error('REFUND ERROR:', error);
        res.status(500).json({ data: null, error: error.message });
    }
});

// Get All Refund Requests
router.get('/refunds', async (req, res) => {
    try {
        const data = await secureDb.get('refund_requests', q => q
            .select(`
                *,
                student:users!student_id(name, email, loopid)
            `)
            .order('created_at', { ascending: false })
        );

        res.status(200).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Financial Statements Report
router.get('/reports/financial-statements', async (req, res) => {
    try {
        // 1. Income (Total Fees Paid)
        const fees = await secureDb.get('student_fee_assignments', q => q.select('paid_amount, net_amount'));

        // if (feeErr) throw feeErr;

        const totalIncome = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
        const totalReceivables = fees.reduce((sum, f) => sum + (f.net_amount - (f.paid_amount || 0)), 0);

        // 2. Expenses (Refunds Approved)
        const refunds = await secureDb.get('refund_requests', q => q
            .select('amount')
            .eq('status', 'approved')
        );

        // if (refErr) throw refErr;
        const totalExpense = refunds.reduce((sum, r) => sum + (r.amount || 0), 0);

        // 3. Assets (Bank Balances)
        const banks = await secureDb.get('bank_accounts', q => q.select('*'));

        const totalBankBalance = banks.reduce((sum, b) => sum + (b.opening_balance || 0), 0);

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
        const data = await secureDb.get('chart_of_accounts', q => q.order('code'));
        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Journal Entry
router.post('/journal', async (req, res) => {
    try {
        const { date, description, lines, created_by } = req.body; // lines: [{ account_id, debit, credit, description }]

        // 1. Create Header
        const context = getContext(req, 'Create Journal Entry');
        const entry = await secureDb.create('journal_entries', {
            date, description, created_by, status: 'posted'
        }, context);

        // if (entryErr) throw entryErr;

        // 2. Create Lines
        if (lines && lines.length > 0) {
            for (const line of lines) {
                await secureDb.create('journal_lines', {
                    journal_entry_id: entry.id,
                    account_id: line.account_id,
                    debit: line.debit || 0,
                    credit: line.credit || 0,
                    description: line.description || ''
                }, context);
            }
        }

        res.status(201).json({ data: entry, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Create Chart of Account
router.post('/chart-of-accounts', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { code, name, type, subtype } = req.body;

        const context = getContext(req, 'Create Chart of Account');
        const data = await secureDb.create('chart_of_accounts', { code, name, type, subtype }, context);

        // if (error) throw error;
        res.status(201).json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.5 Bank & 3.6 Tax (Basic)
// ==========================================

router.get('/bank-accounts', async (req, res) => {
    try {
        const data = await secureDb.get('bank_accounts', q => q.select('*'));
        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/bank-accounts', async (req, res) => {
    try {
        const { bank_name, account_number, branch_name, ifsc_code, opening_balance } = req.body;
        const context = getContext(req, 'Create Bank Account');
        const data = await secureDb.create('bank_accounts', {
            bank_name,
            account_number,
            branch_name,
            ifsc_code,
            opening_balance,
            current_balance: opening_balance // Init current balance
        }, context);

        // if (error) throw error;
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
        const { data, error } = await secureDb.get('bank_transactions', q => q
            .select('*')
            .eq('bank_id', bankId)
            .order('date', { ascending: false })
        );
        if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.get('/tax-settings', async (req, res) => {
    try {
        // Use tax_config instead of tax_settings
        const [data] = await secureDb.get('tax_config', q => q.select('*').limit(1));
        // If no config exists, return default
        if (!data) return res.json({ data: { gst_rate: 18, tds_rate: 10 }, error: null });
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.6 Refunds (Refactored above)
// ==========================================

// ==========================================
// 3.7 Tax & Reconciliation
// ==========================================

router.post('/tax/config', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const { gst_rate, tds_rate, gst_no } = req.body;
        const context = getContext(req, 'Update Tax Config');

        const [existing] = await secureDb.get('tax_config', q => q.select('id').limit(1));

        let result;
        if (existing) {
            // For update, we need SecureDb.update
            await secureDb.update('tax_config', existing.id, { gst_rate, tds_rate, gst_no, updated_at: new Date() }, context);
            result = { data: { ...existing, gst_rate, tds_rate, gst_no }, error: null }; // Mock return since secureDb.update doesn't return data yet usually? Or it does?
            // secureDb.update returns void currently? Let's check db.js.
            // No, secureDb.update has no return in my implementation?
            // Let me check db.js implementation memory...
            // It does return result of supabaseAdmin.from()...update().
        } else {
            result = await secureDb.create('tax_config', { gst_rate, tds_rate, gst_no }, context);
        }

        res.json({ data: result?.data || result, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Alias for api.ts call /finance/tax/config
router.get('/tax/config', async (req, res) => {
    // reuse logic
    try {
        const [data] = await secureDb.get('tax_config', q => q.select('*').limit(1));
        if (!data) return res.json({ data: { gst_rate: 18, tds_rate: 10 }, error: null });
        res.json({ data: data || { gst_rate: 18, tds_rate: 10 }, error: null });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/reports/collection', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        const data = await secureDb.get('transactions', (query) => {
            let q = query.select('amount, payment_method, transaction_date').eq('status', 'success');
            if (start_date) q = q.gte('transaction_date', start_date);
            if (end_date) q = q.lte('transaction_date', end_date);
            return q;
        });


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
        const data = await secureDb.get('student_fee_assignments', q => q
            .select(`
                *,
                student:users(name, email, loopid),
                structure:fee_structures(name)
            `)
            .neq('status', 'paid')
        );

        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// Scholarship Usage Report
router.get('/reports/scholarship-usage', async (req, res) => {
    try {
        const data = await secureDb.get('student_fee_assignments', q => q
            .select(`
                *,
                student:users(name, email, loopid),
                scholarship:scholarships(name)
            `)
            .not('scholarship_id', 'is', null)
        );

        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

// ==========================================
// 3.6 Refunds
// ==========================================



// Reconciliation
router.get('/reconciliation/unmatched', async (req, res) => {
    try {
        // 1. Get all reconciled IDs
        const reconciled = await secureDb.get('reconciliations', q => q.select('transaction_id, bank_transaction_id'));
        // if (rErr) throw rErr;

        const reconciledTxIds = reconciled.map(r => r.transaction_id).filter(id => id);
        const reconciledBankIds = reconciled.map(r => r.bank_transaction_id).filter(id => id);

        // 2. Get Unmatched System Transactions
        const system = await secureDb.get('transactions', (query) => {
            let q = query.select('*').eq('status', 'success');
            if (reconciledTxIds.length > 0) {
                q = q.not('id', 'in', `(${reconciledTxIds.join(',')})`);
            }
            return q;
        });
        // if (sErr) throw sErr;

        // 3. Get Unmatched Bank Transactions
        const bank = await secureDb.get('bank_transactions', (query) => {
            let q = query.select('*');
            if (reconciledBankIds.length > 0) {
                q = q.not('id', 'in', `(${reconciledBankIds.join(',')})`);
            }
            return q;
        });
        // if (bErr) throw bErr;


        res.json({ data: { system, bank }, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

router.post('/reconciliation/match', async (req, res) => {
    try {
        const { transaction_id, bank_transaction_id } = req.body;
        const context = getContext(req, 'Reconciliation Match');
        const data = await secureDb.create('reconciliations', { transaction_id, bank_transaction_id }, context);

        // if (error) throw error;
        res.json({ data, error: null });
    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});







// ==========================================
// 3.8 Repair & Utilities
// ==========================================

// Repair Hostel Fees (Backfill missing assignments)
router.post('/repair-hostel-fees', authorizeRole(['admin', 'finance']), async (req, res) => {
    try {
        const fs = await import('fs');
        const log = (msg) => {
            const time = new Date().toISOString();
            fs.appendFileSync('server_debug_log.txt', `[${time}] [REPAIR-HOSTEL] ${msg}\n`);
        };

        log(`Starting Hostel Fee Repair... requested by ${req.user.email}`);

        // 1. Get all active hostel allocations
        const allocations = await secureDb.get('hostel_allocations', q =>
            q.eq('status', 'active')
        );

        if (!allocations || allocations.length === 0) {
            log("No active hostel allocations found.");
            return res.json({ message: "No active allocations found.", processed: 0 });
        }

        log(`Found ${allocations.length} active allocations. Processing...`);

        const results = {
            total: allocations.length,
            success: 0,
            skipped: 0,
            failed: 0,
            details: []
        };

        const context = getContext(req, 'Repair Hostel Fees');

        for (const alloc of allocations) {
            try {
                // Call assignHostelFee for each
                // Note: assignHostelFee handles "already exists" checks internally
                const assignment = await feeService.assignHostelFee(alloc.user_id, alloc.room_id, context, secureDb);

                if (assignment) {
                    results.success++;
                    results.details.push({ user_id: alloc.user_id, status: 'processed', id: assignment.id });
                } else {
                    results.failed++;
                    results.details.push({ user_id: alloc.user_id, status: 'failed', reason: 'Service returned null' });
                }
            } catch (err) {
                results.failed++;
                results.details.push({ user_id: alloc.user_id, status: 'error', message: err.message });
                log(`Error processing user ${alloc.user_id}: ${err.message}`);
            }
        }

        log(`Repair Completed. Success: ${results.success}, Failed: ${results.failed}`);
        res.json({ data: results, error: null });

    } catch (error) {
        res.status(500).json({ data: null, error: error.message });
    }
});

export default router;
