import express from 'express';
import { supabase, handleError, sendSuccess } from '../../common.js';

const router = express.Router();

// Get Attendance Summary (Percentage per Course)
router.get('/summary/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;

        // 1. Get List of Registered Courses
        const { data: registrations, error: regError } = await supabase
            .from('course_registrations')
            .select('course_offering_id, course_offerings(course_id, courses(code, name))')
            .eq('student_id', student_id)
            .eq('status', 'registered');

        if (regError) throw regError;

        if (!registrations || registrations.length === 0) {
            return sendSuccess(res, []);
        }

        const stats = [];

        // 2. Calculate Attendance for each course
        // Using a loop for simplicity, could be optimized with a single complex query or view
        for (const reg of registrations) {
            const courseOfferingId = reg.course_offering_id;
            const courseName = reg.course_offerings?.courses?.name;
            const courseCode = reg.course_offerings?.courses?.code;

            const { data: attendance, error: attError } = await supabase
                .from('student_course_attendance')
                .select('status')
                .eq('student_id', student_id)
                .eq('course_offering_id', courseOfferingId);

            if (attError) continue;

            const totalClasses = attendance.length;
            const presentClasses = attendance.filter(a => a.status === 'Present' || a.status === 'Late').length; // Late counts as present often
            const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0; // Default to 0% if no classes recorded (or 100? usually 0/0 is N/A but let's show 0)

            // To make it look realistic for the demo if no data exists, we might want to return 'N/A' or 0
            // But let's stick to real data logic.

            stats.push({
                course_offering_id: courseOfferingId,
                course_code: courseCode,
                course_name: courseName,
                total: totalClasses,
                present: presentClasses,
                percentage: totalClasses === 0 ? 100 : percentage // Default 100% if no classes yet? Use 100 for optimism.
            });
        }

        sendSuccess(res, stats);
    } catch (error) {
        handleError(error, res, 'Failed to fetch attendance summary');
    }
});

export default router;
