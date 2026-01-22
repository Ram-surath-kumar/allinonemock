import express from 'express';
import { supabaseAdmin } from '../../common.js';

const router = express.Router();

// Helper to generate App ID
const generateAppId = () => `APP${new Date().getFullYear()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

// GET all applications
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('admission_applications')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// GET statistics
router.get('/stats', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('admission_applications')
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

        res.json({ status: 'success', data: stats });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// POST new application
router.post('/apply', async (req, res) => {
    try {
        const {
            applicant_name, email, phone, course_applied, dob,
            entrance_exam_details, academic_qualifications,
            // UGC Fields
            gender, category, study_mode, nationality_type,
            bpl_status, pwd_status, minority_status, minority_type
        } = req.body;

        const application_no = generateAppId();

        const { data, error } = await supabaseAdmin
            .from('admission_applications')
            .insert({
                application_no,
                applicant_name,
                email,
                phone,
                course_applied,
                dob,
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
                minority_type,
                address_info: req.body.address_info || {},
                guardian_info: req.body.guardian_info || {},
                medical_history: req.body.medical_history || {},
                documents: req.body.documents || {}
            })
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (error) {
        console.error('Apply error:', error);
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// PATCH Update Status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabaseAdmin
            .from('admission_applications')
            .update({ status })
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// PATCH Update Details (Generic)
// Use this to update exam scores, verification status, fee details, etc.
router.patch('/:id/details', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body; // Expects object with keys like notification_details, fee_payment_details etc.

        const { data, error } = await supabaseAdmin
            .from('admission_applications')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

export default router;
