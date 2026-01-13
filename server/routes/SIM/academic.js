import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get Academic Record for Student
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch current semester status
        const { data: record, error: recordError } = await supabase
            .from('academic_records')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Fetch current enrollments
        const { data: enrollments, error: enrollError } = await supabase
            .from('enrollments')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'enrolled');

        if (recordError && recordError.code !== 'PGRST116') throw recordError;
        if (enrollError) throw enrollError;

        res.json({
            status: 'success',
            data: {
                academic_record: record || {},
                enrollments: enrollments || []
            },
            error: null
        });
    } catch (error) {
        handleError(error, res, 'Failed to fetch academic details');
    }
});

// Register for Semester (Create/Update Academic Record)
router.post('/:userId/register-semester', async (req, res) => {
    try {
        const { userId } = req.params;
        const { semester, academic_year } = req.body;

        const { data, error } = await supabaseAdmin
            .from('academic_records')
            .insert({
                user_id: userId,
                semester,
                academic_year,
                status: 'active'
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data, error: null });
    } catch (error) {
        handleError(error, res, 'Failed to register semester');
    }
});

// Enroll in Course
router.post('/:userId/courses', async (req, res) => {
    try {
        const { userId } = req.params;
        const { course_code, course_name, credits, semester, academic_year } = req.body;

        const { data, error } = await supabaseAdmin
            .from('enrollments')
            .insert({
                user_id: userId,
                course_code,
                course_name,
                credits,
                semester,
                academic_year,
                status: 'enrolled'
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data, error: null });
    } catch (error) {
        handleError(error, res, 'Failed to enroll in course');
    }
});

export default router;
