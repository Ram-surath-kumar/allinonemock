
import { secureDb } from './db.js';

export const feeService = {
    /**
     * Automatically assigns fees to a student based on enrollment/admission data
     */
    async autoAssignFees(studentId, context, db = secureDb) {
        try {
            console.log(`[feeService] Starting auto-assign for student: ${studentId}`);

            // 1. Get student admission data & extended profile
            let users;
            try { users = await db.get('users', q => q.eq('id', studentId)); } catch (e) { throw e; }
            if (!users || users.length === 0) throw new Error('Student not found');
            const student = users[0];

            let admissions;
            try { admissions = await db.get('admissions', q => q.eq('id', studentId)); } catch (e) { console.warn(e); }
            const admission = admissions && admissions.length > 0 ? admissions[0] : null;

            // Resolve attributes for rules
            const category = student.category || admission?.category || 'General';
            const gender = student.gender || 'any';
            const marks12 = parseFloat(student.marks_12th_pct || 0);
            const marks10 = parseFloat(student.marks_10th_pct || 0);
            const isBPL = student.is_bpl === true;
            const isPWD = student.is_pwd === true;
            const isMinority = student.minority_community === true;
            const isFirstGraduate = student.is_first_graduate === true || admission?.is_first_graduate === true;

            console.log(`[feeService] Student Profile for Rules:`, { category, gender, marks12, marks10, isBPL, isFirstGraduate });

            // Check hostel status from hostel_allocations
            let hostelAllocations = [];
            try {
                hostelAllocations = await db.get('hostel_allocations', q =>
                    q.eq('user_id', studentId).eq('status', 'active')
                );
            } catch (e) { console.warn(e); }

            const hostelStatus = hostelAllocations && hostelAllocations.length > 0 ? 'resident' : 'day_scholar';

            // 2. Find matching rules
            console.log('[feeService] Fetching assignment rules...');
            const rulesData = await db.get('fee_assignment_rules', q => q.eq('is_active', true));
            const rules = Array.isArray(rulesData) ? rulesData : [];

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
            const structures = await db.get('fee_structures', q => q.eq('id', structureId));

            if (!structures || structures.length === 0) throw new Error('Matching fee structure not found');
            const structure = structures[0];

            // 3. Calculate Amounts
            let totalAmount = structure.total_amount;
            let discountAmount = 0;
            let concessionalAmount = 0;
            let appliedScholarshipId = null;

            // check for scholarships with Rule Engine
            const scholarshipsData = await db.get('scholarships', q => q.eq('is_active', true));
            const scholarships = Array.isArray(scholarshipsData) ? scholarshipsData : [];

            if (scholarships.length > 0) {
                // Sort by highest value (greedy approach: apply best scholarship)
                let maxDiscount = 0;
                let bestScholarship = null;

                for (const sch of scholarships) {
                    let eligible = true;
                    const rules = sch.rules || {};

                    // Rule: Gender
                    if (rules.gender && rules.gender !== 'any' && rules.gender.toLowerCase() !== gender.toLowerCase()) eligible = false;

                    // Rule: Category
                    if (eligible && rules.category && rules.category !== 'any' && rules.category !== category) eligible = false;

                    // Rule: Marks
                    if (eligible && rules.min_marks_12th && marks12 < rules.min_marks_12th) eligible = false;
                    if (eligible && rules.min_marks_10th && marks10 < rules.min_marks_10th) eligible = false;

                    // Rule: Status flags
                    if (eligible && rules.is_bpl && !isBPL) eligible = false;
                    if (eligible && rules.is_pwd && !isPWD) eligible = false;
                    if (eligible && rules.minority_community && !isMinority) eligible = false;
                    if (eligible && rules.is_first_graduate && !isFirstGraduate) eligible = false;

                    if (eligible) {
                        let d = 0;
                        if (sch.type === 'percentage') {
                            d = (totalAmount * sch.value) / 100;
                        } else {
                            d = sch.value;
                        }

                        if (d > maxDiscount) {
                            maxDiscount = d;
                            bestScholarship = sch;
                        }
                    }
                }

                if (bestScholarship) {
                    console.log(`[feeService] Applied Scholarship: ${bestScholarship.name} (-${maxDiscount})`);
                    discountAmount = maxDiscount;
                    appliedScholarshipId = bestScholarship.id;
                }
            }


            const netAmount = totalAmount - discountAmount - concessionalAmount;
            const gstAmount = netAmount * 0.18;
            const grandTotal = netAmount + gstAmount;

            // 4. Create Fee Assignment
            const assignment = await db.create('student_fee_assignments', {
                student_id: studentId,
                structure_id: structureId,
                scholarship_id: appliedScholarshipId,
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
            const overdue = await db.get('fee_installments', q =>
                q.eq('status', 'pending').lt('due_date', today)
            );

            if (!overdue || overdue.length === 0) return { checked: 0, applied: 0 };

            let appliedCount = 0;
            for (const inst of overdue) {
                // Check if penalty already applied
                const existingPenalty = await db.get('fee_adjustments', q =>
                    q.eq('installment_id', inst.id).eq('type', 'penalty')
                );

                if (existingPenalty && existingPenalty.some(p => p.created_at.startsWith(today))) continue;

                // Fetch penalty config
                const configs = await db.get('fee_penalty_configs', q =>
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
    },

    /**
     * Assigns a hostel fee structure to a student upon room allocation
     */
    async assignHostelFee(studentId, roomId, context, db = secureDb) {
        console.log(`[feeService] Assigning Hostel Fee for Student: ${studentId}, Room: ${roomId}`);
        try {
            // 1. Get Room Details
            const rooms = await db.get('hostel_rooms', q => q.eq('id', roomId));
            if (!rooms || rooms.length === 0) throw new Error('Room not found');
            const room = rooms[0];

            // 2. Find or Create Hostel Fee Structure
            let structures = await db.get('fee_structures', q =>
                q.ilike('name', `%Hostel%`).eq('batch_year', new Date().getFullYear())
            );

            let structure;
            if (structures && structures.length > 0) {
                structure = structures[0];
            } else {
                // Fallback: Create a default Hostel Fee Structure
                console.log('[feeService] No existing Hostel Fee Structure found. Creating default.');
                structure = await db.create('fee_structures', {
                    name: `Hostel Fee - ${new Date().getFullYear()}`,
                    batch_year: new Date().getFullYear(),
                    semester: 'Annual',
                    due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                    total_amount: 50000,
                    items: []
                }, context);
            }

            // 3. Prevent Duplicates
            const existingAssignments = await db.get('student_fee_assignments', q =>
                q.eq('student_id', studentId).eq('structure_id', structure.id)
            );

            if (existingAssignments && existingAssignments.length > 0) {
                console.log('[feeService] Student already has this hostel fee assigned.');
                return existingAssignments[0];
            }

            const assignment = await db.create('student_fee_assignments', {
                student_id: studentId,
                structure_id: structure.id,
                total_amount: structure.total_amount,
                net_amount: structure.total_amount,
                status: 'pending',
                assigned_by: context.user?.id || 'system',
                assigned_date: new Date().toISOString().split('T')[0]
            }, context);

            console.log(`[feeService] Hostel Fee Assigned: ${assignment.id}`);
            return assignment;

        } catch (error) {
            console.error('[feeService] Failed to assign hostel fee:', error);
            return null;
        }
    },

    /**
     * Assesses library fine for late returns
     */
    async assessLibraryFine(issueId, returnDate, context, db = secureDb) {
        console.log(`[feeService] Assessing Library Fine for Issue: ${issueId}`);
        try {
            const issues = await db.get('book_issues', q => q.eq('id', issueId));
            if (!issues || issues.length === 0) throw new Error('Issue record not found');
            const issue = issues[0];

            const dueDate = new Date(issue.due_date);
            const actualReturnDate = new Date(returnDate);

            if (actualReturnDate <= dueDate) {
                console.log('[feeService] Book returned on time. No fine.');
                return null;
            }

            // Calculate Fine
            const diffTime = Math.abs(actualReturnDate - dueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const finePerDay = 10;
            const fineAmount = diffDays * finePerDay;

            console.log(`[feeService] Book Overdue by ${diffDays} days. Fine: ${fineAmount}`);

            // SIMPLIFICATION: Look for most recent pending fee assignment OR Create a standalone Invoice
            const assignments = await db.get('student_fee_assignments', q =>
                q.eq('student_id', issue.member_id).eq('status', 'pending').order('created_at', { ascending: false })
            );

            if (assignments && assignments.length > 0) {
                const assignment = assignments[0];
                // Try to find an installment
                const installments = await db.get('fee_installments', q =>
                    q.eq('assignment_id', assignment.id).eq('status', 'pending')
                );

                if (installments && installments.length > 0) {
                    await db.create('fee_adjustments', {
                        installment_id: installments[0].id,
                        type: 'fine',
                        amount: fineAmount,
                        reason: `Library Late Fine (${diffDays} days)`,
                        status: 'applied'
                    }, context);
                    console.log('[feeService] Fine applied to existing installment.');
                    return;
                }
            }

            // If no pending assignment/installment, create a specific "Library Dues" invoice
            console.log('[feeService] Creating standalone Library Fine Invoice.');

            // Checks if a Library Fine structure exists
            let fineStructs = await db.get('fee_structures', q => q.eq('name', 'Library Fines').eq('batch_year', new Date().getFullYear()));
            let fineStruct;

            if (fineStructs && fineStructs.length > 0) {
                fineStruct = fineStructs[0];
            } else {
                fineStruct = await db.create('fee_structures', {
                    name: 'Library Fines',
                    batch_year: new Date().getFullYear(),
                    semester: 'Adhoc',
                    due_date: new Date().toISOString().split('T')[0], // Immediate
                    total_amount: 0, // Placeholder
                    items: []
                }, context);
            }

            // Create assignment with exact fine amount
            const invoice = await db.create('student_fee_assignments', {
                student_id: issue.member_id,
                structure_id: fineStruct.id,
                total_amount: fineAmount,
                net_amount: fineAmount,
                status: 'pending',
                assigned_by: context.user?.id || 'system',
                assigned_date: new Date().toISOString().split('T')[0]
            }, context);

            // Create single installment
            await db.create('fee_installments', {
                assignment_id: invoice.id,
                installment_number: 1,
                amount: fineAmount,
                due_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                paid_amount: 0
            }, context);

            console.log(`[feeService] Created Library Invoice: ${invoice.id}`);

        } catch (error) {
            console.error('[feeService] Failed to assess library fine:', error);
        }
    },

    /**
     * Assigns Transport Fee
     */
    async assignTransportFee(studentId, registrationId, context, db = secureDb) {
        console.log(`[feeService] Assigning Transport Fee: Student ${studentId}`);
        try {
            // Get Registration for fee details
            const regs = await db.get('transport_registrations', q => q.eq('id', registrationId));
            if (!regs || regs.length === 0) throw new Error('Transport Registration not found');
            const reg = regs[0];

            const amount = reg.fee_annual || 0;
            if (amount <= 0) return null;

            // Find/Create Transport Structure
            let structs = await db.get('fee_structures', q =>
                q.ilike('name', `%Transport Fee%`).eq('batch_year', new Date().getFullYear())
            );

            let structure;
            if (structs && structs.length > 0) {
                structure = structs[0];
            } else {
                structure = await db.create('fee_structures', {
                    name: `Transport Fee - ${new Date().getFullYear()}`,
                    batch_year: new Date().getFullYear(),
                    semester: 'Annual',
                    due_date: new Date().toISOString().split('T')[0],
                    total_amount: 0, // Dynamic
                    items: []
                }, context);
            }

            // Create Assignment
            const assignment = await db.create('student_fee_assignments', {
                student_id: studentId,
                structure_id: structure.id,
                total_amount: amount,
                net_amount: amount,
                status: 'pending',
                assigned_by: context.user?.id || 'system',
                assigned_date: new Date().toISOString().split('T')[0]
            }, context);

            // Create 2 Installments (Standard Transport Practice)
            const inst1 = amount / 2;
            const inst2 = amount - inst1;

            await db.create('fee_installments', {
                assignment_id: assignment.id,
                installment_number: 1,
                amount: inst1,
                due_date: new Date().toISOString().split('T')[0], // Immediate
                status: 'pending',
                paid_amount: 0
            }, context);

            const date2 = new Date();
            date2.setMonth(date2.getMonth() + 6);

            await db.create('fee_installments', {
                assignment_id: assignment.id,
                installment_number: 2,
                amount: inst2,
                due_date: date2.toISOString().split('T')[0],
                status: 'pending',
                paid_amount: 0
            }, context);

            console.log(`[feeService] Transport Fee Assigned: ${assignment.id}`);
            return assignment;

        } catch (error) {
            console.error('[feeService] Failed to assign transport fee:', error);
            throw error;
        }
    },

    /**
     * Assigns Exam Fee
     */
    async assignExamFee(studentId, examId, context, db = secureDb) {
        console.log(`[feeService] Assigning Exam Fee: Student ${studentId}, Exam ${examId}`);
        try {
            const exams = await db.get('exams', q => q.eq('id', examId));
            if (!exams || exams.length === 0) throw new Error('Exam not found');
            // const exam = exams[0]; // Not used yet, maybe for name

            const feeAmount = 500; // Standard Exam Fee (Should be configurable per exam)

            // Find/Create Exam Structure
            let structs = await db.get('fee_structures', q => q.eq('name', 'Exam Fees'));
            let structure;
            if (structs && structs.length > 0) {
                structure = structs[0];
            } else {
                structure = await db.create('fee_structures', {
                    name: 'Exam Fees',
                    batch_year: new Date().getFullYear(),
                    semester: 'Adhoc',
                    due_date: new Date().toISOString().split('T')[0],
                    total_amount: 0,
                    items: []
                }, context);
            }

            // Create Assignment
            const assignment = await db.create('student_fee_assignments', {
                student_id: studentId,
                structure_id: structure.id,
                total_amount: feeAmount,
                net_amount: feeAmount,
                status: 'pending',
                assigned_by: context.user?.id || 'system',
                assigned_date: new Date().toISOString().split('T')[0]
            }, context);

            // Single Installment
            await db.create('fee_installments', {
                assignment_id: assignment.id,
                installment_number: 1,
                amount: feeAmount,
                due_date: new Date().toISOString().split('T')[0],
                status: 'pending',
                paid_amount: 0
            }, context);

            console.log(`[feeService] Exam Fee Assigned: ${assignment.id}`);
            return assignment;

        } catch (error) {
            console.error('[feeService] Failed to assign exam fee:', error);
            // Don't throw to avoid blocking registration, just log
        }
    }
};
