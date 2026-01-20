import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get Communications for User
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const { data, error } = await supabase
            .from('communications')
            .select('*')
            .eq('recipient_id', userId)
            .order('sent_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch messages');
    }
});

// Send Communication (Mock send, just log to DB)
router.post('/send', async (req, res) => {
    try {
        const { recipient_id, type, subject, content } = req.body;

        // In a real app, logic to send Email/SMS would go here.
        const status = 'sent'; // Mocking success

        const { data, error } = await supabaseAdmin
            .from('communications')
            .insert({
                recipient_id,
                type,
                subject,
                content,
                status
            })
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to send message');
    }
});

// Send Bulk Communication
router.post('/send-bulk', async (req, res) => {
    try {
        const { recipient_type, department_id, type, subject, content } = req.body;

        if (!recipient_type) {
            return sendValidationError(res, 'Recipient type is required');
        }

        let studentQuery = supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'student')
            .eq('status', 'active');

        if (recipient_type === 'department' && department_id) {
            studentQuery = studentQuery.eq('department_id', department_id);
        }

        const { data: students, error: studentError } = await studentQuery;

        if (studentError) throw studentError;
        if (!students || students.length === 0) {
            return sendValidationError(res, 'No eligible students found for the selected recipient group');
        }

        const communications = students.map(student => ({
            recipient_id: student.id,
            type,
            subject,
            content,
            status: 'sent' // Mocking success
        }));

        const { data, error } = await supabaseAdmin
            .from('communications')
            .insert(communications)
            .select();

        if (error) throw error;
        sendSuccess(res, { count: data.length });
    } catch (error) {
        handleError(error, res, 'Failed to send bulk message');
    }
});

export default router;
