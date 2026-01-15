import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get profile by user_id
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

    sendSuccess(res, data || {}); // Return empty object if no profile exists yet
  } catch (error) {
    handleError(error, res, 'Failed to fetch student profile');
  }
});

// Create or Update profile
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // Ensure user_id is set
    profileData.user_id = userId;

    // --- SIS Logic: Auto-generate Student ID & College Email ---
    if (!profileData.student_id_no || !profileData.college_email) {
      // 1. Fetch User Details for Name & Department
      // We need to query the 'users' table. Note: 'users' table access might require admin privileges if RLS is on.
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('name, department')
        .eq('id', userId)
        .single();

      if (userData && !userError) {
        const admissionYear = new Date().getFullYear(); // Or usage enrollment_date if available

        // Generate Student ID (YYYY_DEPT_SECTION_SEQUENTIAL)
        if (!profileData.student_id_no && userData.department) {
          const deptCode = userData.department.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'GEN');
          const section = profileData.section || 'A';
          const yearPrefix = `${admissionYear}_${deptCode}_${section}`;

          // Count existing students with this prefix to determine sequence
          // Note: This is a simple implementation. For high concurrency, use a DB sequence or atomic increment.
          const { count, error: countError } = await supabaseAdmin
            .from('student_profiles')
            .select('student_id_no', { count: 'exact', head: true })
            .ilike('student_id_no', `${yearPrefix}_%`);

          if (!countError) {
            const sequenceWithPadding = String((count || 0) + 1).padStart(3, '0');
            profileData.student_id_no = `${yearPrefix}_${sequenceWithPadding}`;
          }
        }

        // Generate College Email (firstname.year@college.ac.in)
        if (!profileData.college_email && userData.name) {
          const firstName = userData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          profileData.college_email = `${firstName}.${admissionYear}@college.ac.in`;
        }
      }
    }
    // -----------------------------------------------------------

    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert(profileData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'success', data, error: null });
  } catch (error) {
    handleError(error, res, 'Failed to update student profile');
  }
});

export default router;
