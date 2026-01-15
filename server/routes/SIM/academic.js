import express from 'express';
import { supabase, handleError, sendSuccess } from '../../common.js';

const router = express.Router();

// Get Academic History for a Student
router.get('/history/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        const { data, error } = await supabase
            .from('student_academic_records')
            .select(`
                *,
                semesters (
                    name,
                    academic_year,
                    start_date,
                    end_date
                )
            `)
            .eq('student_id', student_id)
            .order('semesters(start_date)', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch academic history');
    }
});

// Calculate/Update GPA (Mock/Placeholder for now)
router.post('/calculate', async (req, res) => {
    try {
        const { student_id, semester_id, sgpa, credits_earned } = req.body;

        // In a real system, this would calculate based on 'course_registrations.grade'
        // For now, we allow manual entry or mock updates

        const { data, error } = await supabase
            .from('student_academic_records')
            .upsert({
                student_id,
                semester_id,
                sgpa,
                credits_earned,
                updated_at: new Date().toISOString()
            }, { onConflict: 'student_id, semester_id' })
            .select();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to update academic record');
    }
});

export default router;
