import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get all exams
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('entrance_exams')
            .select('*')
            .order('exam_date', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch exams');
    }
});

// Create new exam
router.post('/', async (req, res) => {
    try {
        const { name, exam_code, academic_year, max_score, exam_date } = req.body;

        const { data, error } = await supabaseAdmin
            .from('entrance_exams')
            .insert({
                name,
                exam_code,
                academic_year,
                max_score,
                exam_date
            })
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to create exam');
    }
});

// Submit Exam Score for an Admission
router.post('/scores', async (req, res) => {
    try {
        const { admission_id, exam_id, score, percentile, rank } = req.body;

        if (!admission_id || !exam_id || score === undefined) {
            return sendValidationError(res, 'Missing required fields: admission_id, exam_id, score');
        }

        const { data, error } = await supabaseAdmin
            .from('entrance_exam_scores')
            .upsert({
                admission_id,
                exam_id,
                score,
                percentile,
                rank
            }, { onConflict: 'admission_id, exam_id' })
            .select()
            .single();

        // Also update the main admission record with the primary score (optional, for quick lookup)
        await supabaseAdmin
            .from('admissions')
            .update({ entrance_exam_score: score })
            .eq('id', admission_id);

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to submit score');
    }
});

export default router;
