-- Migration: Data Transfer from student_profiles to users AND Cleanup
-- Step 1: Transfer Data
UPDATE users u
SET 
  -- Demographics
  dob = sp.dob,
  gender = sp.gender,
  blood_group = sp.blood_group,
  religion = sp.religion,
  category = sp.category,
  nationality = sp.nationality,
  mother_tongue = sp.mother_tongue,
  aadhar_no = sp.aadhar_no,
  
  -- Academic & Contacts
  college_email = sp.college_email,
  personal_email = sp.personal_email,
  personal_mobile = sp.personal_mobile,
  alt_mobile = sp.alt_mobile,
  landline_phone = sp.landline_phone,
  
  -- Address (Current)
  current_street = sp.current_street,
  current_city = sp.current_city,
  current_state = sp.current_state,
  current_pincode = sp.current_pincode,
  current_country = sp.current_country,
  
  -- Address (Permanent)
  permanent_street = sp.permanent_street,
  permanent_city = sp.permanent_city,
  permanent_state = sp.permanent_state,
  permanent_pincode = sp.permanent_pincode,
  permanent_country = sp.permanent_country,

  -- Family
  father_name = sp.father_name,
  father_occupation = sp.father_occupation,
  mother_name = sp.mother_name,
  mother_occupation = sp.mother_occupation,
  family_income = CAST(NULLIF(sp.family_annual_income, '') AS NUMERIC),
  siblings_count = sp.siblings_count,
  is_first_graduate = CASE WHEN sp.first_gen_learner THEN 'Yes' ELSE 'No' END,
  is_pwd = CASE WHEN sp.pwd_status THEN 'Yes' ELSE 'No' END,

  -- Emergency & Health
  emergency_contact_relation = sp.emergency_contact_relation,
  emergency_contact_address = sp.emergency_contact_address,
  medical_history = COALESCE(sp.medical_conditions, '') || ' ' || COALESCE(sp.allergies, ''),
  
  -- Identify by LoopID if missing
  loopid = COALESCE(u.loopid, sp.student_id_no)

FROM student_profiles sp
WHERE u.id = sp.user_id;

-- Step 2: VERIFY DATA (Run a SELECT query to check if users table is populated)
-- SELECT id, name, college_email, loopid, category FROM users WHERE role = 'student' LIMIT 10;

-- Step 3: DROP TABLE (ONLY RUN THIS AFTER VERIFYING DATA)
-- DROP TABLE student_profiles;
