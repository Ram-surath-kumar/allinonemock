import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get all merit lists
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('merit_lists')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch merit lists');
    }
});

// Generate Merit List
router.post('/generate', async (req, res) => {
    try {
        const { name, academic_year, course_identifier, cut_off_score, round_number, category } = req.body;

        if (!cut_off_score || !course_identifier) {
            return sendValidationError(res, 'Missing cut_off_score or course_identifier');
        }

        // 1. Create Merit List Record
        const { data: meritList, error: listError } = await supabaseAdmin
            .from('merit_lists')
            .insert({
                name,
                academic_year,
                course_identifier,
                cut_off_score,
                round_number,
                category,
                status: 'published',
                publish_date: new Date()
            })
            .select()
            .single();

        if (listError) throw listError;

        // 2. Find eligible active applications
        let query = supabaseAdmin
            .from('admissions')
            .select('id, entrance_exam_score')
            .eq('course_applied', course_identifier) // Assuming exact match for now
            .eq('status', 'verified') // Only verified applicants are eligible
            .gte('entrance_exam_score', cut_off_score);

        if (academic_year) {
            query = query.eq('academic_year', academic_year);
        }

        const { data: eligibleApps, error: queryError } = await query;

        if (queryError) throw queryError;

        // 3. Update status of eligible students
        const eligibleIds = eligibleApps.map(app => app.id);

        if (eligibleIds.length > 0) {
            await supabaseAdmin
                .from('admissions')
                .update({ status: 'merit_listed' })
                .in('id', eligibleIds);
        }

        sendSuccess(res, {
            merit_list: meritList,
            candidates_shortlisted: eligibleIds.length
        });

    } catch (error) {
        handleError(error, res, 'Failed to generate merit list');
    }
});

export default router;
