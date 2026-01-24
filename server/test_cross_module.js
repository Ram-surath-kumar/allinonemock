
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load env vars from root
dotenv.config({ path: resolve(process.cwd(), '.env') });

import { feeService } from './services/feeService.js';
import { secureDb } from './services/db.js';

async function testHostelLogic() {
    console.log('\n--- Testing Hostel Fee Assignment ---');
    try {
        // 1. Setup: Ensure we have a student and a room
        const users = await secureDb.get('users', q => q.limit(1));
        if (!users.length) throw new Error('No users found');
        const studentId = users[0].id; // Use existing user

        const rooms = await secureDb.get('hostel_rooms', q => q.limit(1));
        let roomId;
        if (!rooms || rooms.length === 0) {
            console.warn('No hostel rooms found. Skipping Hostel Test.');
            return;
        } else {
            roomId = rooms[0].id;
        }

        // 2. Initial State: Check existing assignments
        const initialAssignments = await secureDb.get('student_fee_assignments', q => q.eq('student_id', studentId));
        const initialCount = initialAssignments ? initialAssignments.length : 0;
        console.log(`Initial Fee Assignments: ${initialCount}`);

        // 3. Execute: Call feeService directly (simulating the route call)
        const context = { user: { id: 'test_script' }, reason: 'Test Hostel Fee' };
        const result = await feeService.assignHostelFee(studentId, roomId, context);

        if (result) {
            console.log('✅ Hostel Fee Assigned Successfully:', result.id);
            console.log('Amount:', result.total_amount);
        } else {
            console.log('⚠️ Hostel Fee NOT Assigned (maybe duplicate?)');
        }

    } catch (e) {
        console.error('❌ Hostel Test Failed:', e);
    }
}

async function testLibraryLogic() {
    console.log('\n--- Testing Library Fine Assessment ---');
    try {
        // 1. Setup: Create a mock overdue issue
        const users = await secureDb.get('users', q => q.limit(1));
        if (!users.length) return;
        const studentId = users[0].id;

        // Create a dummy book copy if needed or just mock the issue
        // We need a valid copy_id for FK usually, let's see if we have copies
        const copies = await secureDb.get('book_copies', q => q.limit(1));
        if (!copies.length) {
            console.warn('No book copies found. Skipping Library Test.');
            return;
        }
        const copyId = copies[0].id;

        // Create a PAST DUE issue directly in DB
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 20); // 20 days ago
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() - 5); // Due 5 days ago (so 5 days late)

        const issue = await secureDb.create('book_issues', {
            member_id: studentId, // Assuming user is member
            copy_id: copyId,
            issue_date: pastDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
            status: 'issued'
        }, { user: { id: 'test' } });

        console.log(`Created Test Issue: ${issue.id}, Due: ${issue.due_date}`);

        // 2. Execute: Assess Fine (simulating return today)
        const context = { user: { id: 'test_script' }, reason: 'Test Library Fine' };
        await feeService.assessLibraryFine(issue.id, new Date().toISOString().split('T')[0], context);

        // 3. Verify: Check for Fee Adjustment
        // We know logical flow attaches to *some* assignment. Let's list recent adjustments.
        const adjustments = await secureDb.get('fee_adjustments', q =>
            q.eq('type', 'fine').order('created_at', { ascending: false }).limit(1)
        );

        if (adjustments && adjustments.length > 0) {
            const adj = adjustments[0];
            console.log('✅ Fine Adjustment Found:', adj);
            console.log('Amount:', adj.amount);
            console.log('Reason:', adj.reason);
        } else {
            console.error('❌ No Fine Adjustment Found.');
        }

        // Cleanup: Return the book or delete issue to verify return
        // (Optional, just testing logic)

    } catch (e) {
        console.error('❌ Library Test Failed:', e);
    }
}

async function runTests() {
    await testHostelLogic();
    await testLibraryLogic();
    await testExamLogic();
    process.exit(0);
}

async function testExamLogic() {
    console.log('\n--- Testing Exam Fee Assignment ---');
    try {
        // 1. Setup: Ensure Exam exists
        const exams = await secureDb.get('exams', q => q.limit(1));
        let examId;
        if (!exams.length) {
            const newExam = await secureDb.create('exams', {
                title: 'Test Exam',
                start_date: new Date().toISOString().split('T')[0],
                fee_amount: 750 // Explicit fee
            }, { user: { id: 'test' } });
            examId = newExam.id;
        } else {
            examId = exams[0].id;
        }

        const users = await secureDb.get('users', q => q.limit(1));
        if (!users.length) return;
        const studentId = users[0].id;

        // 2. Execute: Assign Fee (Simulating /register)
        const context = { user: { id: 'test_script' }, reason: 'Test Exam Fee' };
        // We call the service directly
        const assignment = await feeService.assignExamFee(studentId, examId, context);

        // 3. Verify
        if (assignment) {
            console.log('✅ Exam Fee Assigned:', assignment.id);
            console.log('Amount:', assignment.total_amount);
        } else {
            console.log('⚠️ Exam Fee NOT Assigned (check logs)');
        }

    } catch (e) {
        console.error('❌ Exam Test Failed:', e);
    }
}

runTests();
