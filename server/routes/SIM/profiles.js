import express from 'express';
import { supabase, supabaseAdmin } from '../../common.js';
import { handleError, sendSuccess, sendValidationError } from '../../common.js';

const router = express.Router();

// Get profile by user_id
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    sendSuccess(res, data || {});
  } catch (error) {
    handleError(error, res, 'Failed to fetch student profile');
  }
});

// Create or Update profile (Updates the users table)
router.post('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const profileData = req.body;

    // --- SIS Logic: Auto-generate Student ID & College Email ---
    if (!profileData.student_id_no || !profileData.college_email) {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('name, department, student_id_no, college_email')
        .eq('id', userId)
        .single();

      if (userData && !userError) {
        const admissionYear = new Date().getFullYear();

        // Generate Student ID
        if (!profileData.student_id_no && !userData.student_id_no && userData.department) {
          const deptCode = (userData.department || 'GEN').substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'GEN');
          const section = profileData.section || 'A';
          const yearPrefix = `${admissionYear}_${deptCode}_${section}`;

          const { count, error: countError } = await supabaseAdmin
            .from('users')
            .select('student_id_no', { count: 'exact', head: true })
            .ilike('student_id_no', `${yearPrefix}_%`);

          if (!countError) {
            const sequenceWithPadding = String((count || 0) + 1).padStart(3, '0');
            profileData.student_id_no = `${yearPrefix}_${sequenceWithPadding}`;
          }
        } else if (userData.student_id_no) {
          profileData.student_id_no = userData.student_id_no;
        }

        // Generate College Email
        if (!profileData.college_email && !userData.college_email && userData.name) {
          const firstName = userData.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
          profileData.college_email = `${firstName}.${admissionYear}@college.ac.in`;
        } else if (userData.college_email) {
          profileData.college_email = userData.college_email;
        }
      }
    }

    // Mapping profileData to users table columns
    const dbPayload = {
      // Personal Info
      dob: profileData.personal_info?.dob || profileData.dob,
      gender: profileData.personal_info?.gender || profileData.gender,
      blood_group: profileData.personal_info?.blood_group || profileData.blood_group,
      religion: profileData.personal_info?.religion || profileData.religion,
      aadhar_no: profileData.personal_info?.aadhar_no || profileData.aadhar_no,
      nationality: profileData.personal_info?.nationality || profileData.nationality,
      nationality_type: profileData.personal_info?.nationality_type || profileData.nationality_type,
      study_mode: profileData.personal_info?.enrollment_status || profileData.study_mode,
      is_bpl: profileData.personal_info?.is_bpl ?? profileData.bpl_status,
      minority_community: profileData.personal_info?.is_minority ?? profileData.minority_status,
      minority_type: profileData.personal_info?.minority_type || profileData.minority_type,
      is_pwd: profileData.personal_info?.is_pwd ?? profileData.pwd_status,
      pwd_details: profileData.personal_info?.disability_type || profileData.pwd_details,
      is_first_graduate: profileData.personal_info?.is_first_generation ?? profileData.first_gen_learner,

      // Academic
      student_id_no: profileData.student_id_no,
      college_email: profileData.college_email,
      section: profileData.section,

      // Address (Matching users table columns)
      current_street: profileData.address_info?.current?.street,
      current_city: profileData.address_info?.current?.city,
      current_state: profileData.address_info?.current?.state,
      current_pincode: profileData.address_info?.current?.zip,

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
      guardian_relation: profileData.guardian_info?.guardian?.relation,
      guardian_contact: profileData.guardian_info?.guardian?.phone,

      // Emergency Contact
      emergency_contact_name: profileData.emergency_contact?.name,
      emergency_contact_number: profileData.emergency_contact?.phone,
      emergency_contact_relation: profileData.emergency_contact?.relation,
      emergency_contact_address: profileData.emergency_contact?.address,

      // Medical
      allergies: profileData.medical_history?.allergies,
      medical_conditions: profileData.medical_history?.chronic_illness,
      medical_history: profileData.medical_history?.history,

      updated_at: new Date()
    };

    // Remove undefined
    Object.keys(dbPayload).forEach(key => dbPayload[key] === undefined && delete dbPayload[key]);

    // Use .update() instead of .upsert() because the user record must already exist
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(dbPayload)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ status: 'success', data, error: null });
  } catch (error) {
    console.error('[Profile Update Error]:', error);
    handleError(error, res, 'Failed to update student profile');
  }
});

export default router;
