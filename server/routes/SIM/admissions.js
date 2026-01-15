import express from 'express';
import { supabaseAdmin, handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Helper to generate App ID (Backup)
const generateAppId = () => `APP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

// GET all applications
router.get('/', async (req, res) => {
    try {
        const { status, academic_year, course } = req.query;

        let query = supabaseAdmin.from('admissions').select(`
            *,
            entrance_exam_scores (
                score,
                percentile,
                exam_id
            )
        `);

        if (status) query = query.eq('status', status);
        if (academic_year) query = query.eq('academic_year', academic_year);
        if (course) query = query.eq('course_applied', course);

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch admissions');
    }
});

// Get single admission details
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabaseAdmin
            .from('admissions')
            .select(`
                *,
                entrance_exam_scores (*, entrance_exams(name))
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch admission details');
    }
});

// GET statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('admissions')
            .select('status, course_applied');

        if (error) throw error;

        const stats = {
            total: data.length,
            status: {},
            courses: {}
        };

        data.forEach(app => {
            stats.status[app.status] = (stats.status[app.status] || 0) + 1;
            stats.courses[app.course_applied] = (stats.courses[app.course_applied] || 0) + 1;
        });

        sendSuccess(res, stats);
    } catch (error) {
        handleError(error, res, 'Failed to fetch admission stats');
    }
});

// POST new application
router.post('/apply', async (req, res) => {
    try {
        const applicationData = req.body;
        const {
            applicant_name, email, phone, course_applied, dob,
            entrance_exam_details, academic_qualifications,
            // UGC Fields
            gender, category, study_mode, nationality_type,
            bpl_status, pwd_status, minority_status, minority_type
        } = applicationData;

        // Basic validation
        if (!applicant_name || !email || !course_applied) {
            return sendValidationError(res, 'Missing required fields');
        }

        // Generate application number: APP-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const application_no = `APP-${dateStr}-${randomSuffix}`;

        const status = 'applied';
        const created_at = new Date().toISOString();

        const { data, error } = await supabaseAdmin
            .from('admissions') // Using admissions table consistent with GET
            .insert({
                application_no,
                applicant_name,
                email,
                phone,
                course_applied,
                dob,
                status,
                created_at,
                entrance_exam_details: entrance_exam_details || {},
                academic_qualifications: academic_qualifications || {},
                // UGC Fields
                gender,
                category,
                study_mode,
                nationality_type,
                is_bpl: bpl_status,
                is_pwd: pwd_status,
                is_minority: minority_status,
                minority_type
            })
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Apply error');
    }
});

// Update Application Status (Workflow)
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['applied', 'verified', 'shortlisted', 'merit_listed', 'admitted', 'rejected', 'withdrawn'].includes(status)) {
            return sendValidationError(res, 'Invalid status');
        }

        const { data: currentApp, error: fetchError } = await supabaseAdmin
            .from('admissions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // Auto-create student user if status is 'admitted'
        if (status === 'admitted' && currentApp.status !== 'admitted') {
            // 1. Create User Account
            const tempPassword = Math.random().toString(36).slice(-8);
            const { data: newUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
                email: currentApp.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { name: currentApp.applicant_name, role: 'student' }
            });

            if (userError) {
                console.error("Failed to create auth user", userError);
                // Proceed only if not duplicate (or handle gracefully)
            } else if (newUser) {
                // 2. Create Public User Record
                await supabaseAdmin.from('users').insert({
                    id: newUser.user.id,
                    email: currentApp.email,
                    name: currentApp.applicant_name,
                    role: 'student',
                    status: 'active',
                    department: currentApp.course_applied // Temporary mapping
                });

                // 3. Create Student Enrollment Record
                await supabaseAdmin.from('student_enrollments').insert({
                    student_id: newUser.user.id,
                    program_name: currentApp.course_applied,
                    batch_year: currentApp.academic_year || new Date().getFullYear().toString(),
                    admission_reference_id: id,
                    status: 'active'
                });
            }
        }

        const { data, error } = await supabaseAdmin
            .from('admissions')
            .update({ status: status, updated_at: new Date() })
            .eq('id', id)
            .select();

        if (error) throw error;

        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to update status');
    }
});

// PATCH Update Details (Generic)
router.patch('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabaseAdmin
            .from('admissions')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to update details');
    }
});

export default router;
