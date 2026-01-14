
import { secureDb } from './db.js';

export const feeService = {
    /**
     * Automatically assigns fees to a student based on enrollment/admission data
     */
    async autoAssignFees(studentId, context, db = secureDb) {
        try {
            console.log(`[feeService] Starting auto-assign for student: ${studentId}`);

            // 1. Get student admission data
            const { data: admissions, error: admError } = await db.get('admissions', q => q.eq('id', studentId));
            if (admError) console.warn('[feeService] Admission fetch error:', admError);

            // Fallback: If student not in admissions, check users meta or profile
            const { data: students, error: stdError } = await db.get('users', q => q.eq('id', studentId));
            if (stdError) throw stdError;

            if (!students || students.length === 0) throw new Error('Student not found');
            const studentData = students[0];

            const admission = admissions && admissions.length > 0 ? admissions[0] : null;
            const category = admission?.category || (studentData.raw_user_meta_data?.category) || 'General';
            console.log(`[feeService] Resolved category: ${category}`);

            // Check hostel status from hostel_allocations
            const { data: hostelAllocations } = await db.get('hostel_allocations', q =>
                q.eq('user_id', studentId).eq('status', 'active')
            );
            const hostelStatus = hostelAllocations && hostelAllocations.length > 0 ? 'resident' : 'day_scholar';
            console.log(`[feeService] Resolved hostel status: ${hostelStatus}`);

            // 2. Find matching rules
            console.log('[feeService] Fetching assignment rules...');
            const { data: rules, error: rulesError } = await db.get('fee_assignment_rules', q =>
                q.eq('is_active', true)
            );
            if (rulesError) throw rulesError;

            // Filter rules by category and hostel status
            const matchingRule = rules
                .filter(r =>
                    (r.student_category === category || !r.student_category) &&
                    (r.hostel_status === hostelStatus || r.hostel_status === 'any')
                )
                .sort((a, b) => b.priority - a.priority)[0];

            if (!matchingRule) {
                console.warn(`No fee assignment rule found for student ${studentId} (Category: ${category}, Hostel: ${hostelStatus})`);
                return null;
            }

            const structureId = matchingRule.fee_structure_id;
            const { data: structures } = await db.get('fee_structures', q => q.eq('id', structureId));

            if (!structures || structures.length === 0) throw new Error('Matching fee structure not found');
            const structure = structures[0];

            // 2.1 Get structure items to ensure we have all details
            const { data: structureItems } = await db.get('fee_structure_items', q => q.eq('structure_id', structureId));

            // 3. Calculate Amounts
            let totalAmount = structure.total_amount;
            let discountAmount = 0;
            let concessionalAmount = 0;

            // check for scholarships
            const { data: scholarships } = await db.get('scholarships', q => q.eq('is_active', true));


            const netAmount = totalAmount - discountAmount - concessionalAmount;
            const gstAmount = netAmount * 0.18;
            const grandTotal = netAmount + gstAmount;

            // 4. Create Fee Assignment
            const assignment = await db.create('student_fee_assignments', {
                student_id: studentId,
                structure_id: structureId,
                total_amount: totalAmount,
                discount_amount: discountAmount,
                concessional_amount: concessionalAmount,
                net_amount: netAmount,
                gst_amount: gstAmount,
                status: 'pending',
                assigned_by: context.performed_by,
                assigned_date: new Date().toISOString().split('T')[0]
            }, context);

            // 5. Generate Installments based on Rule Config
            const numInstallments = matchingRule.num_installments || 2;
            const intervalMonths = matchingRule.installment_interval_months || 2;

            const installments = [];
            const baseAmountPerInstallment = Math.floor(grandTotal / numInstallments);
            let remainingAmount = grandTotal;

            for (let i = 1; i <= numInstallments; i++) {
                const installmentAmount = (i === numInstallments) ? remainingAmount : baseAmountPerInstallment;

                const dueDate = new Date(structure.due_date);
                dueDate.setMonth(dueDate.getMonth() + (i - 1) * intervalMonths);

                const installment = await db.create('fee_installments', {
                    assignment_id: assignment.id,
                    installment_number: i,
                    amount: installmentAmount,
                    due_date: dueDate.toISOString().split('T')[0],
                    status: 'pending',
                    paid_amount: 0
                }, context);

                installments.push(installment);
                remainingAmount -= installmentAmount;
            }

            return { assignment, installments };
        } catch (error) {
            console.error('Error in autoAssignFees:', error);
            throw error;
        }
    },

    /**
     * Periodically scan and apply late fees
     */
    async applyPenalties(context, db = secureDb) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Get all overdue installments
            const { data: overdue } = await db.get('fee_installments', q =>
                q.eq('status', 'pending').lt('due_date', today)
            );

            if (!overdue || overdue.length === 0) return { checked: 0, applied: 0 };

            let appliedCount = 0;
            for (const inst of overdue) {
                // Check if penalty already applied
                const { data: existingPenalty } = await db.get('fee_adjustments', q =>
                    q.eq('installment_id', inst.id).eq('type', 'penalty')
                );

                if (existingPenalty && existingPenalty.some(p => p.created_at.startsWith(today))) continue;

                // Fetch penalty config
                const { data: configs } = await db.get('fee_penalty_configs', q =>
                    q.eq('is_active', true)
                );

                if (!configs || configs.length === 0) continue;
                const config = configs[0];

                let penaltyAmount = 0;
                if (config.type === 'flat') {
                    penaltyAmount = config.amount;
                } else if (config.type === 'daily_linear') {
                    const daysLate = Math.floor((new Date(today).getTime() - new Date(inst.due_date).getTime()) / (1000 * 3600 * 24));
                    penaltyAmount = config.amount * daysLate;
                }

                if (penaltyAmount > 0) {
                    await db.create('fee_adjustments', {
                        installment_id: inst.id,
                        type: 'penalty',
                        amount: penaltyAmount,
                        reason: `Late fee: ${config.name}`,
                        status: 'applied'
                    }, context);

                    appliedCount++;
                }
            }

            return { checked: overdue.length, applied: appliedCount };
        } catch (error) {
            console.error('Apply Penalties Error:', error);
            throw error;
        }
    }
};
