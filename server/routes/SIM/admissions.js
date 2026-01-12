import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get all admissions (with filters)
router.get('/', async (req, res) => {
    try {
        const { status, academic_year } = req.query;

        let query = supabase.from('admissions').select('*');

        if (status) query = query.eq('status', status);
        if (academic_year) query = query.eq('academic_year', academic_year);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch admissions');
    }
});

// Submit Application
router.post('/apply', async (req, res) => {
    try {
        const applicationData = req.body;

        // Generate simple application number if not provided
        if (!applicationData.application_no) {
            applicationData.application_no = 'APP-' + Date.now();
        }

        applicationData.status = 'applied';

        const { data, error } = await supabaseAdmin
            .from('admissions')
            .insert(applicationData)
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to submit application');
    }
});

// Update Application Status (Merit List, Admit, Reject)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, entrance_exam_score } = req.body;

        const updateData = { status };
        if (entrance_exam_score !== undefined) updateData.entrance_exam_score = entrance_exam_score;

        const { data, error } = await supabaseAdmin
            .from('admissions')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // If status is 'admitted', we might want to auto-create a user record effectively
        // But for now, we leave that as a separate manual step or next implementation phase

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to update admission status');
    }
});

export default router;
