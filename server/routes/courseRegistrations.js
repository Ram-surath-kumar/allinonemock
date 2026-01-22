import express from 'express';
import { supabaseAdmin, handleError, sendSuccess, sendValidationError } from '../common.js';

const router = express.Router();

// --- HELPERS ---

const logAction = async (student_id, registration_id, action, details, performed_by) => {
    return supabaseAdmin
        .from('registration_logs')
        .insert({
            student_id,
            registration_id,
            action,
            details,
            performed_by
        });
};

// --- OFFERINGS & COURSES ---

router.get('/offerings', async (req, res) => {
    try {
        const { semester_id } = req.query;
        let query = supabaseAdmin
            .from('course_offerings')
            .select(`
                *,
                course:courses(*),
                semester:semesters(*)
            `);

        if (semester_id) {
            query = query.eq('semester_id', semester_id);
        } else {
            const { data: currentSem } = await supabaseAdmin
                .from('semesters')
                .select('id')
                .eq('is_current', true)
                .single();
            if (currentSem) query = query.eq('semester_id', currentSem.id);
        }

        const { data, error } = await query;
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch course offerings');
    }
});

router.post('/offerings', async (req, res) => {
    try {
        const { course_id, semester_id, faculty_id, faculty_name, slot_code, room_number, capacity } = req.body;
        const { data, error } = await supabaseAdmin
            .from('course_offerings')
            .insert({ course_id, semester_id, faculty_id, faculty_name, slot_code, room_number, capacity })
            .select()
            .single();
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to create course offering');
    }
});

// --- REGISTRATIONS & TIMELINE ---

router.get('/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { semesterId } = req.query;

        let query = supabaseAdmin
            .from('course_registrations')
            .select(`
                *,
                offering:course_offerings(
                    *,
                    course:courses(*),
                    semester:semesters(*)
                ),
                approver:users!approved_by_id(name)
            `);

        if (studentId !== 'all') query = query.eq('student_id', studentId);

        const { data, error } = await query.order('registration_date', { ascending: false });
        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch registrations');
    }
});

router.get('/logs', async (req, res) => {
    try {
        const { student_id } = req.query;
        let query = supabaseAdmin
            .from('registration_logs')
            .select(`
                *,
                student:users!student_id(name, loopid),
                performer:users!performed_by(name)
            `)
            .order('created_at', { ascending: false });

        if (student_id) query = query.eq('student_id', student_id);

        const { data, error } = await query;
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch logs');
    }
});

router.post('/register', async (req, res) => {
    try {
        const {
            student_id,
            course_offering_id,
            registration_mode = 'Regular',
            exemption_reason,
            approved_by_id,
            prerequisite_met = true,
            performed_by
        } = req.body;

        // 1. Fetch Offering & Semester Info
        const { data: offering, error: offError } = await supabaseAdmin
            .from('course_offerings')
            .select('*, course:courses(*), semester:semesters(*)')
            .eq('id', course_offering_id)
            .single();
        if (offError) throw offError;

        // 2. Check Add/Drop Period (Institutional Logic)
        const now = new Date();
        const start = new Date(offering.semester.add_drop_start_date);
        const end = new Date(offering.semester.add_drop_end_date);
        const withinPeriod = now >= start && now <= end;

        // 3. Slot Conflict Check
        const { data: existingRegs } = await supabaseAdmin
            .from('course_registrations')
            .select('offering:course_offerings(slot_code)')
            .eq('student_id', student_id)
            .eq('status', 'Registered');

        const hasConflict = existingRegs?.some(r => r.offering?.slot_code === offering.slot_code);
        if (hasConflict) {
            return sendValidationError(res, `Slot Conflict: Student already has a course at ${offering.slot_code}`);
        }

        // 4. Credit Limit Check (Assume 21 credits max)
        const totalCredits = existingRegs?.reduce((sum, r) => sum + (r.offering?.course?.credits || 0), 0) || 0;
        if (totalCredits + offering.course.credits > 21) {
            return sendValidationError(res, `Credit Limit Exceeded: Max 21 credits allowed. Current: ${totalCredits}`);
        }

        // 5. Perform Registration
        const { data, error } = await supabaseAdmin
            .from('course_registrations')
            .insert({
                student_id,
                course_id: offering.course_id,
                course_offering_id,
                registration_mode,
                status: 'Registered',
                registration_date: now.toISOString(),
                prerequisite_met,
                exemption_reason,
                approved_by_id,
                approved_at: prerequisite_met ? now.toISOString() : null
            })
            .select()
            .single();

        if (error) throw error;

        // 6. Log Action
        await logAction(
            student_id,
            data.id,
            registration_mode === 'Audit' ? 'Audit Enrolled' : 'Registered',
            {
                course_code: offering.course.course_code,
                course_name: offering.course.name,
                is_override: !withinPeriod
            },
            performed_by || student_id
        );

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Registration failed');
    }
});

router.patch('/registration/:registrationId', async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { status, attendance_percentage, exemption_reason, approved_by_id, performed_by, course_offering_id } = req.body;
        const now = new Date().toISOString();

        // Fetch current state for logging
        const { data: currentReg } = await supabaseAdmin
            .from('course_registrations')
            .select('*, offering:course_offerings(course:courses(name))')
            .eq('id', registrationId)
            .single();

        const updateData = { updated_at: now };
        let action = 'Updated';

        if (status) {
            updateData.status = status;
            action = status;
            if (status === 'Dropped') updateData.drop_date = now;
        }

        if (course_offering_id) {
            updateData.course_offering_id = course_offering_id;
            action = 'Reassigned Offering';
        }

        if (attendance_percentage !== undefined) updateData.attendance_percentage = attendance_percentage;

        if (exemption_reason !== undefined) {
            updateData.exemption_reason = exemption_reason;
            updateData.prerequisite_met = true;
            updateData.approved_by_id = approved_by_id;
            updateData.approved_at = now;
            action = 'Waiver Approved';
        }

        const { data, error } = await supabaseAdmin
            .from('course_registrations')
            .update(updateData)
            .eq('id', registrationId)
            .select()
            .single();

        if (error) throw error;

        // Log Action
        await logAction(
            currentReg.student_id,
            registrationId,
            action,
            { course_name: currentReg.offering?.course?.name, ...req.body },
            performed_by || approved_by_id
        );

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Update failed');
    }
});

// --- SEMESTERS & PERIODS ---

router.get('/periods', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('semesters').select('*').order('start_date', { ascending: false });
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch periods');
    }
});

router.patch('/periods/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('semesters')
            .update(req.body)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Update failed');
    }
});

// --- PREREQUISITES ---

router.get('/prerequisites', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('course_prerequisites')
            .select(`
                *,
                main_course:courses!course_id(*),
                prerequisite:courses!prerequisite_course_id(*)
            `);
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch prerequisites');
    }
});

// --- HELPERS ---

router.get('/courses', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin.from('courses').select('*').eq('is_active', true);
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch courses');
    }
});

router.get('/faculty', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email')
            .in('role', ['teacher', 'admin', 'vice_head']);
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch faculty');
    }
});

router.get('/students', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('users')
            .select('id, name, email, loopid')
            .eq('role', 'student');
        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch students');
    }
});

export default router;
