import express from 'express';
import { supabase, handleError, sendSuccess } from '../../common.js';

const router = express.Router();

// Get Graduation Audit for a Student
router.get('/audit/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        // 1. Get Student's Program
        const { data: admissionData, error: admissionError } = await supabase
            .from('admissions')
            .select('program_id, programs(*)')
            .eq('student_id', student_id)
            .single();

        if (admissionError) throw admissionError;

        // If no program assigned, return partial info
        if (!admissionData?.programs) {
            return sendSuccess(res, { message: "No program assigned to student." });
        }

        const program = admissionData.programs;

        // 2. Get Academic Stats (Credits Earned, CGPA)
        const { data: statsData, error: statsError } = await supabase
            .from('student_academic_records')
            .select('credits_earned, cgpa')
            .eq('student_id', student_id)
            .order('updated_at', { ascending: false })
            .limit(1)
            .single();

        // Calculate total earned credits from all semester records if summary is missing
        let totalCreditsEarned = statsData?.credits_earned || 0;
        if (!statsData) {
            const { data: allRecords } = await supabase
                .from('student_academic_records')
                .select('credits_earned')
                .eq('student_id', student_id);
            totalCreditsEarned = allRecords?.reduce((sum, r) => sum + (r.credits_earned || 0), 0) || 0;
        }

        const currentCGPA = statsData?.cgpa || 0;

        // 3. Get Student's Completed Courses
        const { data: completedCourses, error: coursesError } = await supabase
            .from('course_registrations')
            .select('course_offering_id, course_offerings(course_id, courses(code, name, credits))')
            .eq('student_id', student_id)
            .eq('status', 'registered'); // Assuming 'registered' for now, ideally check for 'passed' grade

        if (coursesError) throw coursesError;

        const completedCourseIds = completedCourses.map(c => c.course_offerings?.course_id);

        // 4. Get Program Requirements (Core Courses)
        const { data: coreCourses, error: reqError } = await supabase
            .from('program_core_courses')
            .select('course_id, courses(code, name, credits)')
            .eq('program_id', program.id);

        if (reqError) throw reqError;

        // 5. Audit Logic
        const missingCoreCourses = coreCourses.filter(core => !completedCourseIds.includes(core.course_id));
        const completedCoreCredits = coreCourses
            .filter(core => completedCourseIds.includes(core.course_id))
            .reduce((sum, core) => sum + (core.courses?.credits || 0), 0);

        const isCreditsMet = totalCreditsEarned >= program.total_credits_required;
        const isCGPAMet = currentCGPA >= program.min_cgpa_required;
        const isCoreMet = missingCoreCourses.length === 0;

        const auditResult = {
            program: program.name,
            requirements: {
                total_credits: program.total_credits_required,
                min_cgpa: program.min_cgpa_required,
            },
            status: {
                credits_earned: totalCreditsEarned,
                current_cgpa: currentCGPA,
                credits_progress: Math.min(100, Math.round((totalCreditsEarned / program.total_credits_required) * 100)),
                is_eligible: isCreditsMet && isCGPAMet && isCoreMet
            },
            missing_core_courses: missingCoreCourses.map(c => ({
                code: c.courses?.code,
                name: c.courses?.name,
                credits: c.courses?.credits
            }))
        };

        sendSuccess(res, auditResult);
    } catch (error) {
        handleError(error, res, 'Failed to perform graduation audit');
    }
});

export default router;
