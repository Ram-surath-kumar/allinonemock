
import express from 'express';
import { supabaseAdmin, handleError, sendSuccess } from '../common.js';

const router = express.Router();

// Get All Reports
router.get('/reports', async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('mis_submissions')
            .select('*, created_by(name, role)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to fetch reports');
    }
});

// Generate Report (Mock Aggregation)
router.post('/generate', async (req, res) => {
    try {
        const { report_type, academic_year } = req.body;

        // 1. Fetch Aggregated Data based on report type
        // This is where we would join users, programs, comparisons etc.
        // For now, let's create a simulated snapshot.

        // Fetch counts
        const { count: studentCount } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student')
            .eq('status', 'active');

        const { count: facultyCount } = await supabaseAdmin
            .from('users')
            .select('*', { count: 'exact', head: true })
            .in('role', ['teacher', 'vice_head'])
            .eq('status', 'active');

        const snapshot = {
            generatedAt: new Date().toISOString(),
            academicYear: academic_year,
            metrics: {
                totalStudents: studentCount || 0,
                totalFaculty: facultyCount || 0,
                placements: 0, // Placeholder
            },
            // Mock compliance checklist
            compliance: [
                { item: 'Faculty Ratio', status: 'Compliant', value: '1:15' },
                { item: 'Infrastructure', status: 'Compliant', value: 'Verified' }
            ]
        };

        // 2. Create Submission Record
        const { data, error } = await supabaseAdmin
            .from('mis_submissions')
            .insert({
                report_type,
                academic_year,
                status: 'Generated', // Skip Draft for MVP
                data_snapshot: snapshot,
                // created_by: req.user.id // Middleware auth needed
            })
            .select()
            .single();

        if (error) throw error;
        sendSuccess(res, data);
    } catch (error) {
        handleError(error, res, 'Failed to generate report');
    }
});

export default router;
