import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get Available Course Offerings for a Semester
router.get('/offerings/:semester_id', async (req, res) => {
    try {
        const { semester_id } = req.params;
        const { department_id } = req.query;

        const query = supabase
            .from('course_offerings')
            .select(`
                id,
                room_number,
                slot_code,
                capacity,
                enrolled_count,
                faculty_name,
                courses (
                    id,
                    name,
                    course_code,
                    credits,
                    type,
                    department_id,
                    prerequisites
                )
            `)
            .eq('semester_id', semester_id);

        if (department_id) {
            // This filtering is tricky with nested joins, might need a clearer structure
            // For now, fetching all and filtering in memory or improving query structure
            // Assuming courses have department_id
        }

        const { data, error } = await query;
        if (error) throw error;

        // Filter by department if needed (client side filtering is also an option for smaller datasets)
        let filteredData = data;
        if (department_id) {
            filteredData = data.filter(item => item.courses?.department_id === department_id);
        }

        sendSuccess(res, filteredData);
    } catch (error) {
        handleError(error, res, 'Failed to fetch course offerings');
    }
});

// Register for Courses (Enhanced)
router.post('/enroll', async (req, res) => {
    try {
        const { student_id, semester_id, registrations } = req.body;
        // registrations: [{ course_offering_id, type: 'credit'|'audit', is_waiver_requested, waiver_reason }]

        if (!student_id || !registrations || !Array.isArray(registrations)) {
            return sendValidationError(res, 'Invalid request data');
        }

        // 1. Validate Semester Add/Drop Dates
        const { data: semester, error: semError } = await supabase
            .from('semesters')
            .select('add_drop_start_date, add_drop_end_date')
            .eq('id', semester_id)
            .single();

        if (semError) throw semError;

        const now = new Date();
        const start = semester.add_drop_start_date ? new Date(semester.add_drop_start_date) : null;
        const end = semester.add_drop_end_date ? new Date(semester.add_drop_end_date) : null;

        if (start && now < start) return sendValidationError(res, 'Registration period has not started');
        if (end && now > end) return sendValidationError(res, 'Registration period has ended');

        // 2. Fetch Offering Details (Credits, Capacity)
        const offeringIds = registrations.map(r => r.course_offering_id);
        const { data: offerings, error: offerError } = await supabase
            .from('course_offerings')
            .select('id, capacity, enrolled_count, courses(id, credits, prerequisites)')
            .in('id', offeringIds);

        if (offerError) throw offerError;

        // 3. Validation Loop
        let totalCredits = 0;
        const recordsToInsert = [];

        for (const reg of registrations) {
            const offering = offerings.find(o => o.id === reg.course_offering_id);
            if (!offering) continue;

            // Capacity Check
            if (offering.enrolled_count >= offering.capacity) {
                return sendValidationError(res, `Course full: ${offering.courses.course_code}`);
            }

            // Prerequisite Check (Mock - assume passed unless waiver requested)
            // In real app, check 'student_transcripts' table
            if (offering.courses.prerequisites?.length > 0 && !reg.is_waiver_requested) {
                // Check if prereqs met (TODO: Implement transcript check)
                // For now, if no waiver requested and has prereqs, warn? 
                // Allowing through for Dev/Demo unless strictly enforced
            }

            // Audit Logic (0 credits)
            const credits = reg.type === 'audit' ? 0 : offering.courses.credits;
            totalCredits += credits;

            recordsToInsert.push({
                student_id,
                semester_id,
                course_id: offering.courses.id,
                course_offering_id: offering.id,
                registration_type: reg.type || 'credit',
                is_waiver_requested: reg.is_waiver_requested || false,
                waiver_reason: reg.waiver_reason,
                status: 'registered'
            });
        }

        if (totalCredits > 25) {
            return sendValidationError(res, `Credit limit exceeded (${totalCredits}/25). Audit courses do not count.`);
        }

        // 4. Perform Insert
        const { data, error } = await supabaseAdmin
            .from('course_registrations')
            .upsert(recordsToInsert, { onConflict: 'student_id, semester_id, course_id' }) // Prevent duplicates
            .select();

        if (error) throw error;
        sendSuccess(res, { registered: data.length });

    } catch (error) {
        handleError(error, res, 'Enrollment failed');
    }
});

// Drop a Course
router.post('/drop', async (req, res) => {
    try {
        const { registration_id, reason } = req.body;

        const { data, error } = await supabaseAdmin
            .from('course_registrations')
            .update({
                status: 'dropped',
                dropped_at: new Date().toISOString()
            })
            .eq('id', registration_id)
            .select();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to drop course');
    }
});

// Get My Registrations (Enhanced details)
router.get('/my-courses/:student_id', async (req, res) => {
    try {
        const { student_id } = req.params;
        const { data, error } = await supabase
            .from('course_registrations')
            .select(`
                *,
                courses (
                    name,
                    course_code,
                    credits,
                    type
                ),
                course_offerings (
                    room_number,
                    slot_code,
                    faculty_name
                )
            `)
            .eq('student_id', student_id)
        // .eq('status', 'registered'); // Removed to show history (dropped, etc.)

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch registrations');
    }
});

export default router;
