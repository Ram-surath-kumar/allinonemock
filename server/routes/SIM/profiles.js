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
          const deptCode = (userData.department || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'GEN');
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

    // Flatten the profile data to match DB columns
    const dbPayload = {
      user_id: userId,
      // Personal Info
      // first_name/last_name are in users table, ignoring for now or mapping if columns exist
      dob: profileData.personal_info?.dob || profileData.dob,
      gender: profileData.personal_info?.gender || profileData.gender,
      blood_group: profileData.personal_info?.blood_group || profileData.blood_group,
      religion: profileData.personal_info?.religion || profileData.religion,
      aadhar_no: profileData.personal_info?.aadhar_no || profileData.aadhar_no,
      nationality: profileData.personal_info?.nationality || profileData.nationality,
      nationality_type: profileData.personal_info?.nationality_type || profileData.nationality_type, // from migration
      study_mode: profileData.personal_info?.enrollment_status || profileData.study_mode,
      bpl_status: profileData.personal_info?.is_bpl || profileData.bpl_status,
      minority_status: profileData.personal_info?.is_minority || profileData.minority_status,
      minority_type: profileData.personal_info?.minority_type || profileData.minority_type,
      pwd_status: profileData.personal_info?.is_pwd || profileData.pwd_status,
      pwd_details: profileData.personal_info?.disability_type || profileData.pwd_details,
      first_gen_learner: profileData.personal_info?.is_first_generation || profileData.first_gen_learner,

      // Address - Mapping to detected columns (assuming permanent_* exist)
      address_current: profileData.address_info?.current?.street,
      // We lack precise current_city etc cols in output, maybe stored as text object or single string? 
      // Debug output showed 'address_current', 'address_permanent'. Suggests composite text.
      // But also 'permanent_city', 'permanent_street'.
      permanent_street: profileData.address_info?.permanent?.street,
      permanent_city: profileData.address_info?.permanent?.city,
      permanent_state: profileData.address_info?.permanent?.state,
      permanent_pincode: profileData.address_info?.permanent?.zip,

      // Guardian
      father_name: profileData.guardian_info?.father?.name,
      father_occupation: profileData.guardian_info?.father?.occupation,
      mother_name: profileData.guardian_info?.mother?.name,
      mother_occupation: profileData.guardian_info?.mother?.occupation,
      guardian_name: profileData.guardian_info?.guardian?.name,
      // guardian_occupation?
      guardian_relation: profileData.guardian_info?.guardian?.relation, // if exists
      guardian_contact: profileData.guardian_info?.guardian?.phone, // inferred

      // Medical
      allergies: profileData.medical_history?.allergies,
      medical_conditions: profileData.medical_history?.chronic_illness,
      // doctor_contact?

      // Preserve generated fields
      student_id_no: profileData.student_id_no,
      college_email: profileData.college_email,
      updated_at: new Date()
    };

    // Remove undefined
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    const { data, error } = await supabaseAdmin
      .from('student_profiles')
      .upsert(dbPayload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'success', data, error: null });
  } catch (error) {
    console.error('[Profile Update Error]:', error);
    console.error('[Profile Data Payload]:', JSON.stringify(req.body, null, 2));
    handleError(error, res, 'Failed to update student profile');
  }
});

export default router;
