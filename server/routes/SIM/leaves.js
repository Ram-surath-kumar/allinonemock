import express from 'express';
import { supabase, handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get Leave History for a Student
router.get('/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        const { data, error } = await supabase
            .from('student_leaves')
            .select('*')
            .eq('student_id', student_id)
            .order('applied_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch leave history');
    }
});

// Apply for Leave
router.post('/apply', async (req, res) => {
    try {
        const { student_id, leave_type, start_date, end_date, reason } = req.body;

        if (!student_id || !leave_type || !start_date || !end_date) {
            return sendValidationError(res, "Missing required fields");
        }

        const { data, error } = await supabase
            .from('student_leaves')
            .insert({
                student_id,
                leave_type,
                start_date,
                end_date,
                reason,
                status: 'Pending'
            })
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to apply for leave');
    }
});

export default router;
