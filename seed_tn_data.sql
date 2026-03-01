-- ==========================================
-- TAMIL NADU MOCK DATA SEEDER SCRIPT
-- ==========================================
-- INSTRUCTIONS: Copy and paste this entire script into your Supabase SQL Editor and hit "RUN".
-- This bypasses any local internet blocking issues by running directly on the database server.

DO $$
DECLARE
    v_org_id int;
    v_course_id int;
    v_class_id int;
    v_veh_1 int; v_veh_2 int;
    v_route_1 int;
    v_stop_1 int;
    v_hostel_boys int; v_hostel_girls int;
    v_room_b101 int; v_room_g101 int;
    v_fee_template int;
    
    r RECORD;
    v_name text;
    v_first_name text;
    v_last_name text;
    v_gender text;
    v_phone text;
    v_aadhar text;
    v_city text;
    v_street text;
    
    -- Arrays for randomization
    arr_male_names text[] := ARRAY['Karthik', 'Muthu', 'Sriram', 'Arun', 'Vignesh', 'Prakash', 'Sanjay', 'Dinesh', 'Surya', 'Balaji'];
    arr_female_names text[] := ARRAY['Priya', 'Anjali', 'Kavya', 'Divya', 'Swathi', 'Aishwarya', 'Keerthi', 'Shruthi', 'Meena', 'Geetha'];
    arr_last_names text[] := ARRAY['Kumar', 'Rajan', 'Sundaram', 'Krishnan', 'Iyer', 'Natarajan', 'Murugan', 'Ganesan', 'Ramasamy', 'Sekar'];
    arr_cities text[] := ARRAY['Chennai', 'Madurai', 'Coimbatore', 'Trichy', 'Salem', 'Tirunelveli'];
    arr_pincodes text[] := ARRAY['600001', '625001', '641001', '620001', '636001', '627001'];
    arr_streets text[] := ARRAY['Anna Nagar', 'K.K. Nagar', 'T. Nagar', 'Velachery', 'Adyar', 'Besant Nagar', 'RS Puram', 'Peelamedu'];
    arr_blood_groups text[] := ARRAY['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
BEGIN
    -- Get primary Org ID
    SELECT id INTO v_org_id FROM organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO organizations (org_name, org_code) VALUES ('LoopVerse Demo', 'LV001') RETURNING id INTO v_org_id;
    END IF;

    -------------------------------------------------------------------
    -- 1. UPDATE ALL EXISTING USERS WITH COMPREHENSIVE TN DETAILS
    -------------------------------------------------------------------
    FOR r IN SELECT * FROM users LOOP
        -- Generate random variables
        v_gender := CASE WHEN random() > 0.5 THEN 'Female' ELSE 'Male' END;
        v_first_name := CASE WHEN v_gender = 'Female' THEN arr_female_names[ceil(random() * 10)] ELSE arr_male_names[ceil(random() * 10)] END;
        v_last_name := arr_last_names[ceil(random() * 10)];
        v_name := COALESCE(r.name, v_first_name || ' ' || v_last_name);
        v_phone := '9' || lpad((floor(random() * 900000000) + 100000000)::text, 9, '0');
        v_aadhar := lpad((floor(random() * 900000000000) + 100000000000)::text, 12, '0');
        
        -- Pick city index
        DECLARE
           c_idx int := ceil(random() * 6);
        BEGIN
           v_city := arr_cities[c_idx];
           v_street := floor(random() * 100 + 1)::text || ', ' || arr_streets[ceil(random() * 8)];
           
           UPDATE users 
           SET 
               name = v_name,
               dob = '2005-06-15'::date + (floor(random() * 365 * 3) || ' days')::interval,
               gender = v_gender,
               blood_group = arr_blood_groups[ceil(random() * 8)],
               religion = 'Hindu',
               category = (ARRAY['OC', 'BC', 'MBC', 'SC', 'ST'])[ceil(random() * 5)],
               nationality = 'Indian',
               mother_tongue = 'Tamil',
               aadhar_no = v_aadhar,
               pan_no = 'ABCDE' || lpad((floor(random() * 9000) + 1000)::text, 4, '0') || 'F',
               college_email = lower(v_first_name) || '.' || lower(v_last_name) || '@anandhacollege.edu.in',
               minority_community = 'No',
               is_bpl = CASE WHEN random() > 0.8 THEN 'Yes' ELSE 'No' END,
               is_pwd = CASE WHEN random() > 0.95 THEN 'Yes' ELSE 'No' END,
               marks_10th_pct = floor(random() * 21) + 80,
               marks_12th_pct = floor(random() * 21) + 80,
               entrance_exam_score = floor(random() * 101) + 100,
               family_income = floor(random() * 800000) + 200000,
               siblings_count = floor(random() * 4),
               is_first_graduate = CASE WHEN random() > 0.5 THEN 'Yes' ELSE 'No' END,
               personal_email = COALESCE(r.email, lower(v_name) || '@gmail.com'),
               personal_mobile = v_phone,
               alt_mobile = '9' || lpad((floor(random() * 900000000) + 100000000)::text, 9, '0'),
               landline_phone = '-',
               current_street = v_street,
               current_city = v_city,
               current_state = 'Tamil Nadu',
               current_pincode = arr_pincodes[c_idx],
               current_country = 'India',
               permanent_street = v_street,
               permanent_city = v_city,
               permanent_state = 'Tamil Nadu',
               permanent_pincode = arr_pincodes[c_idx],
               permanent_country = 'India',
               father_name = arr_male_names[ceil(random() * 10)] || ' ' || v_last_name,
               father_occupation = (ARRAY['Farmer', 'Business', 'Govt Employee', 'Private Sector', 'Teacher'])[ceil(random() * 5)],
               mother_name = arr_female_names[ceil(random() * 10)],
               mother_occupation = (ARRAY['Homemaker', 'Teacher', 'Nurse', 'Private Sector'])[ceil(random() * 4)],
               emergency_contact_name = arr_male_names[ceil(random() * 10)],
               emergency_contact_relation = 'Uncle',
               emergency_contact_number = '9' || lpad((floor(random() * 900000000) + 100000000)::text, 9, '0'),
               emergency_contact_address = v_street || ', ' || v_city,
               medical_history = 'None'
           WHERE id = r.id;
        END;
    END LOOP;

    -------------------------------------------------------------------
    -- 2. ACADEMICS & ATTENDANCE
    -------------------------------------------------------------------
    INSERT INTO courses (org_id, course_name, course_code, duration_semesters)
    VALUES (v_org_id, 'B.Tech - Computer Science', 'BTECH-CS', 8)
    ON CONFLICT DO NOTHING RETURNING id INTO v_course_id;
    
    IF v_course_id IS NULL THEN SELECT id INTO v_course_id FROM courses LIMIT 1; END IF;

    INSERT INTO classes (org_id, course_id, class_name, year, semester)
    VALUES (v_org_id, v_course_id, 'CS-A', 2026, 6)
    ON CONFLICT DO NOTHING RETURNING id INTO v_class_id;
    
    IF v_class_id IS NULL THEN SELECT id INTO v_class_id FROM classes LIMIT 1; END IF;

    -- Generate random attendance for the last 10 days for all students
    FOR r IN SELECT id FROM users WHERE role = 'student' LOOP
        FOR i IN 0..9 LOOP
            INSERT INTO attendance (org_id, student_id, class_id, date, status, notes)
            VALUES (
                v_org_id, 
                r.id, 
                v_class_id, 
                CURRENT_DATE - (i || ' days')::interval, 
                CASE WHEN random() > 0.15 THEN 'present' ELSE 'absent' END, 
                'Generated by Seeders'
            )
            ON CONFLICT (student_id, date, class_id) DO UPDATE SET status = EXCLUDED.status;
        END LOOP;
    END LOOP;

    -------------------------------------------------------------------
    -- 3. TRANSPORT
    -------------------------------------------------------------------
    INSERT INTO vehicles (org_id, vehicle_number, capacity, driver_name, driver_phone, vehicle_type, status)
    VALUES 
        (v_org_id, 'TN 10 AA 1234', 40, 'Kannan', '9876543210', 'Bus', 'active'),
        (v_org_id, 'TN 22 BB 5678', 40, 'Kumar', '9876543211', 'Bus', 'active')
    ON CONFLICT DO NOTHING RETURNING id INTO v_veh_1;
    
    IF v_veh_1 IS NULL THEN SELECT id INTO v_veh_1 FROM vehicles LIMIT 1; END IF;

    INSERT INTO transport_routes (org_id, route_name, start_location, end_location, vehicle_id)
    VALUES (v_org_id, 'Route A - City to Campus', 'Central Station', 'Campus South Gate', v_veh_1)
    ON CONFLICT DO NOTHING RETURNING id INTO v_route_1;
    
    IF v_route_1 IS NULL THEN SELECT id INTO v_route_1 FROM transport_routes LIMIT 1; END IF;

    INSERT INTO transport_stops (route_id, stop_name, stop_time, pickup_price, drop_price, two_way_price)
    VALUES (v_route_1, 'Guindy', '08:00', 5000, 5000, 9000)
    ON CONFLICT DO NOTHING RETURNING id INTO v_stop_1;
    
    IF v_stop_1 IS NULL THEN SELECT id INTO v_stop_1 FROM transport_stops LIMIT 1; END IF;

    -- Allocate Transport to ~50% of students
    FOR r IN SELECT id FROM users WHERE role = 'student' AND random() > 0.5 LOOP
        INSERT INTO transport_allocations (org_id, user_id, route_id, stop_id, type, amount, start_date, end_date, status)
        VALUES (v_org_id, r.id, v_route_1, v_stop_1, 'two_way', 9000, '2025-06-01', '2026-05-31', 'active')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -------------------------------------------------------------------
    -- 4. HOSTEL
    -------------------------------------------------------------------
    INSERT INTO hostels (org_id, name, type, capacity, warden_name, contact_number)
    VALUES 
        (v_org_id, 'Kaveri Boys Hostel', 'Boys', 100, 'Thiru. Sivasubramaniyan', '9876543212'),
        (v_org_id, 'Ganga Girls Hostel', 'Girls', 80, 'Tmt. Valarmathi', '9876543213')
    ON CONFLICT DO NOTHING RETURNING id INTO v_hostel_boys;

    IF v_hostel_boys IS NULL THEN SELECT id INTO v_hostel_boys FROM hostels LIMIT 1; END IF;

    INSERT INTO hostel_rooms (hostel_id, room_number, capacity, type, price_per_year)
    VALUES (v_hostel_boys, 'A-101', 3, 'Non-AC', 45000)
    ON CONFLICT DO NOTHING RETURNING id INTO v_room_b101;
    
    IF v_room_b101 IS NULL THEN SELECT id INTO v_room_b101 FROM hostel_rooms LIMIT 1; END IF;

    -- Allocate hostel to students NOT in transport
    FOR r IN SELECT u.id FROM users u LEFT JOIN transport_allocations ta ON u.id = ta.user_id WHERE u.role = 'student' AND ta.id IS NULL LOOP
        INSERT INTO hostel_allocations (org_id, user_id, room_id, start_date, end_date, status)
        VALUES (v_org_id, r.id, v_room_b101, '2025-06-01', '2026-05-31', 'active')
        ON CONFLICT DO NOTHING;
    END LOOP;

    -------------------------------------------------------------------
    -- 5. FINANCE
    -------------------------------------------------------------------
    INSERT INTO fee_templates (org_id, name, description, amount, type, interval)
    VALUES (v_org_id, 'B.Tech Tuition Fee - Year 3', 'Standard tuition fee', 120000, 'tuition', 'yearly')
    ON CONFLICT (org_id, name) DO NOTHING RETURNING id INTO v_fee_template;
    
    IF v_fee_template IS NULL THEN SELECT id INTO v_fee_template FROM fee_templates LIMIT 1; END IF;

    FOR r IN SELECT id FROM users WHERE role = 'student' LOOP
        INSERT INTO student_fee_assignments (org_id, student_id, template_id, amount, due_date, status, paid_amount)
        VALUES (
            v_org_id, 
            r.id, 
            v_fee_template, 
            120000, 
            '2025-08-30', 
            CASE WHEN random() > 0.3 THEN 'paid' ELSE 'pending' END, 
            CASE WHEN random() > 0.3 THEN 120000 ELSE 0 END
        )
        ON CONFLICT DO NOTHING;
    END LOOP;

    -------------------------------------------------------------------
    -- 6. EVENTS & NOTIFICATIONS
    -------------------------------------------------------------------
    INSERT INTO events (org_id, title, description, start_date, end_date, type, status)
    VALUES 
        (v_org_id, 'Pongal Celebration', 'Traditional Pongal celebration on campus.', '2026-01-14T09:00:00Z', '2026-01-14T17:00:00Z', 'holiday', 'published'),
        (v_org_id, 'Tech Symposium 2026', 'Annual technical symposium.', '2026-03-10T10:00:00Z', '2026-03-12T16:00:00Z', 'academic', 'published')
    ON CONFLICT DO NOTHING;

    FOR r IN SELECT id FROM users LOOP
        INSERT INTO notifications (org_id, user_id, title, message, type, is_read)
        VALUES (v_org_id, r.id, 'Welcome to LoopVerse ERP', 'Your profile has been fully updated with TN demo data.', 'system', false)
        ON CONFLICT DO NOTHING;
    END LOOP;

END $$;
