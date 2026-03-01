-- ==========================================
-- ULTIMATE TAMIL NADU MOCK DATA SEEDER 
-- Covers ALL tables in the new ERP Schema
-- ==========================================

DO $$
DECLARE
    v_org_id UUID;
    v_dept_cs UUID;
    v_dept_it UUID;
    v_teacher_1 UUID;
    v_teacher_2 UUID;
    
    -- Academic
    v_sem UUID;
    v_prog_btech UUID;
    v_po_1 UUID;
    
    v_course_dbms UUID;
    v_course_os UUID;
    v_offering_dbms UUID;
    v_offering_os UUID;
    
    -- Exams
    v_exam_1 UUID;
    v_timetable_1 UUID;
    
    -- Facilities
    v_bldg_main UUID;
    v_room_lab1 UUID;
    v_room_hall1 UUID;
    
    -- Finance
    v_cat_tuition UUID;
    v_cat_hostel UUID;
    v_head_tui UUID;
    v_head_lib UUID;
    v_schol_merit UUID;
    v_struct_btech UUID;
    v_bank UUID;
    v_penalty UUID;
    v_tax UUID;
    
    -- Hostel
    v_hostel_boys UUID;
    v_hostel_girls UUID;
    v_room_b1 UUID;
    v_room_g1 UUID;
    
    -- Library
    v_book_1 UUID;
    v_book_2 UUID;
    v_copy_1 UUID;
    v_copy_2 UUID;
    
    -- Transport
    v_veh_1 UUID;
    v_veh_2 UUID;
    v_route_1 UUID;
    v_stop_1 UUID;
    
    -- Users/Loop Variables
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
    -- ==========================================
    -- 0. ORGANIZATION & DEPARTMENTS
    -- ==========================================
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (org_name, org_code, contact_info) 
        VALUES ('Anna University Affiliated - Loop Demo', 'AU-LV001', '{"phone": "044-22357004", "email": "admin@au-loop.edu.in", "address": "Guindy, Chennai"}') 
        RETURNING id INTO v_org_id;
    END IF;

    -- Create Teachers first so we can assign them as HODs
    SELECT id INTO v_teacher_1 FROM public.users WHERE role = 'teacher' LIMIT 1;
    SELECT id INTO v_teacher_2 FROM public.users WHERE role = 'teacher' OFFSET 1 LIMIT 1;

    INSERT INTO public.departments (org_id, name, code, description, email, head_id)
    VALUES 
        (v_org_id, 'Computer Science and Engineering', 'CSE', 'B.Tech IT & CSE Dept', 'cse@au-loop.edu.in', v_teacher_1),
        (v_org_id, 'Information Technology', 'IT', 'B.Tech IT', 'it@au-loop.edu.in', v_teacher_2)
    ON CONFLICT (code) DO NOTHING;
    
    IF v_dept_cs IS NULL THEN SELECT id INTO v_dept_cs FROM public.departments WHERE code = 'CSE' LIMIT 1; END IF;
    SELECT id INTO v_dept_it FROM public.departments WHERE code = 'IT' LIMIT 1;

    -- ==========================================
    -- 1. USERS & PROFILES
    -- ==========================================
    FOR r IN SELECT * FROM public.users LOOP
        v_gender := CASE WHEN random() > 0.5 THEN 'Female' ELSE 'Male' END;
        v_first_name := CASE WHEN v_gender = 'Female' THEN arr_female_names[ceil(random() * 10)] ELSE arr_male_names[ceil(random() * 10)] END;
        v_last_name := arr_last_names[ceil(random() * 10)];
        v_name := COALESCE(r.name, v_first_name || ' ' || v_last_name);
        v_phone := '9' || lpad((floor(random() * 900000000) + 100000000)::text, 9, '0');
        v_aadhar := lpad((floor(random() * 900000000000) + 100000000000)::text, 12, '0');
        
        DECLARE c_idx int := ceil(random() * 6);
        BEGIN
           v_city := arr_cities[c_idx];
           v_street := floor(random() * 100 + 1)::text || ', ' || arr_streets[ceil(random() * 8)];
           
           UPDATE public.users 
           SET 
               org_id = v_org_id,
               department_id = CASE WHEN random() > 0.5 THEN v_dept_cs ELSE v_dept_it END,
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
               minority_community = 'No',
               current_street = v_street,
               current_city = v_city,
               current_state = 'Tamil Nadu',
               current_pincode = arr_pincodes[c_idx],
               current_country = 'India'
           WHERE id = r.id;
        END;
    END LOOP;

    -- Assign Teachers to Departments Junction
    FOR r IN SELECT id FROM public.users WHERE role = 'teacher' LOOP
        INSERT INTO public.teacher_departments (teacher_id, department_id, is_primary)
        VALUES (r.id, v_dept_cs, true) ON CONFLICT DO NOTHING;
    END LOOP;

    -- ==========================================
    -- 2. ACADEMICS & REGISTRATIONS
    -- ==========================================
    INSERT INTO public.semesters (name, start_date, end_date, is_current)
    VALUES ('Even Sem 2025-26', '2026-01-05', '2026-05-30', true) ON CONFLICT DO NOTHING;
    SELECT id INTO v_sem FROM public.semesters WHERE name = 'Even Sem 2025-26' LIMIT 1;

    INSERT INTO public.academic_programs (org_id, department_id, name, code, duration_years, approval_status)
    VALUES (v_org_id, v_dept_cs, 'B.Tech Computer Science and Engineering', 'BTECH-CSE', 4, 'Approved') ON CONFLICT DO NOTHING;
    SELECT id INTO v_prog_btech FROM public.academic_programs WHERE code = 'BTECH-CSE' LIMIT 1;

    INSERT INTO public.program_outcomes (program_id, code, description)
    VALUES (v_prog_btech, 'PO1', 'Engineering Knowledge') ON CONFLICT DO NOTHING;
    SELECT id INTO v_po_1 FROM public.program_outcomes WHERE code = 'PO1' LIMIT 1;

    INSERT INTO public.courses (program_id, department_id, name, course_code, credits, type, level, course_type, description)
    VALUES 
        (v_prog_btech, v_dept_cs, 'Database Management Systems', 'CS8492', 4, 'core', 'undergraduate', 'Theory+Lab', 'Core DBMS course based on TN syllabus'),
        (v_prog_btech, v_dept_cs, 'Operating Systems', 'CS8493', 3, 'core', 'undergraduate', 'Theory', 'OS internals and concepts')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_course_dbms FROM public.courses WHERE course_code = 'CS8492' LIMIT 1;
    
    SELECT id INTO v_course_os FROM public.courses WHERE course_code = 'CS8493' LIMIT 1;

    INSERT INTO public.course_offerings (course_id, semester_id, faculty_id, faculty_name, room_number, slot_code)
    VALUES 
        (v_course_dbms, v_sem, v_teacher_1, 'Dr. S. Karthik', 'LB-201', 'A1'),
        (v_course_os, v_sem, v_teacher_2, 'Prof. T. Priya', 'LB-202', 'B1')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_offering_dbms FROM public.course_offerings WHERE slot_code = 'A1' LIMIT 1;
    SELECT id INTO v_offering_os FROM public.course_offerings WHERE slot_code = 'B1' LIMIT 1;

    -- Register ALL students to these courses
    FOR r IN SELECT id FROM public.users WHERE role = 'student' LOOP
        INSERT INTO public.course_registrations (student_id, course_offering_id, status, attendance_percentage)
        VALUES (r.id, v_offering_dbms, 'Registered', floor(random() * 25) + 75) ON CONFLICT DO NOTHING;
        
        INSERT INTO public.course_registrations (student_id, course_offering_id, status, attendance_percentage)
        VALUES (r.id, v_offering_os, 'Registered', floor(random() * 25) + 75) ON CONFLICT DO NOTHING;
        
        -- Generate daily attendance for last 10 days
        FOR i IN 0..9 LOOP
            INSERT INTO public.attendance (student_id, date, status, notes)
            VALUES (r.id, CURRENT_DATE - (i || ' days')::interval, CASE WHEN random() > 0.15 THEN 'present' ELSE 'absent' END, 'Auto-generated')
            ON CONFLICT DO NOTHING;
        END LOOP;
    END LOOP;

    -- ==========================================
    -- 3. EXAMS & EVALUATION
    -- ==========================================
    INSERT INTO public.exams (org_id, name, start_date, end_date, status, academic_calendar_id, programs, semesters)
    VALUES (v_org_id, 'Mid Term Exam 1 (CAT-1)', '2026-03-01', '2026-03-10', 'PLANNED', v_sem, ARRAY['BTECH-CSE'], ARRAY[6]) ON CONFLICT DO NOTHING;
    SELECT id INTO v_exam_1 FROM public.exams WHERE name = 'Mid Term Exam 1 (CAT-1)' LIMIT 1;

    INSERT INTO public.exam_timetable (exam_id, course_id, exam_date, start_time, end_time, room_no)
    VALUES (v_exam_1, v_course_dbms, '2026-03-02', '10:00', '11:30', 'Hall 1') ON CONFLICT DO NOTHING;
    SELECT id INTO v_timetable_1 FROM public.exam_timetable WHERE exam_id = v_exam_1 LIMIT 1;

    FOR r IN SELECT id FROM public.users WHERE role = 'student' LOOP
        INSERT INTO public.hall_tickets (exam_id, student_id, status, room_number, seat_number)
        VALUES (v_exam_1, r.id, 'GENERATED', 'Hall 1', 'S-' || floor(random()*100)) ON CONFLICT DO NOTHING;
        
        INSERT INTO public.exam_attendance (exam_id, exam_timetable_id, student_id, status)
        VALUES (v_exam_1, v_timetable_1, r.id, 'PRESENT') ON CONFLICT DO NOTHING;
        
        INSERT INTO public.exam_marks (exam_id, student_id, score, total_marks)
        VALUES (v_exam_1, r.id, floor(random() * 40) + 60, 100) ON CONFLICT DO NOTHING;
    END LOOP;

    -- ==========================================
    -- 4. FACILITIES & ROOMS
    -- ==========================================
    INSERT INTO public.facilities_buildings (org_id, name, code, campus_location, floors)
    VALUES (v_org_id, 'Ramanujan Block', 'RB', 'Main Campus', 4) ON CONFLICT DO NOTHING;
    SELECT id INTO v_bldg_main FROM public.facilities_buildings WHERE code = 'RB' LIMIT 1;

    INSERT INTO public.facilities_rooms (building_id, room_number, room_name, room_type, status, capacity)
    VALUES 
        (v_bldg_main, 'LB-201', 'DBMS Lab', 'Lab', 'Active', 60),
        (v_bldg_main, 'Hall 1', 'Exam Hall 1', 'Auditorium', 'Active', 250)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_room_lab1 FROM public.facilities_rooms WHERE room_number = 'LB-201' LIMIT 1;
    SELECT id INTO v_room_hall1 FROM public.facilities_rooms WHERE room_number = 'Hall 1' LIMIT 1;

    INSERT INTO public.facilities_equipment (room_id, item_name, category, quantity)
    VALUES (v_room_lab1, 'Desktop PCs (i7, 16GB)', 'Technology', 60);

    -- ==========================================
    -- 5. FINANCE & FEES
    -- ==========================================
    INSERT INTO public.fee_categories (org_id, name) VALUES (v_org_id, 'Academic Fees') ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_tuition FROM public.fee_categories WHERE name = 'Academic Fees' LIMIT 1;
    INSERT INTO public.fee_categories (org_id, name) VALUES (v_org_id, 'Hostel & Transport') ON CONFLICT DO NOTHING;
    SELECT id INTO v_cat_hostel FROM public.fee_categories WHERE name = 'Hostel & Transport' LIMIT 1;

    INSERT INTO public.fee_heads (name, type) VALUES ('Tuition Fee', 'tuition') ON CONFLICT DO NOTHING;
    SELECT id INTO v_head_tui FROM public.fee_heads WHERE name = 'Tuition Fee' LIMIT 1;
    INSERT INTO public.fee_heads (name, type) VALUES ('Library Fee', 'library') ON CONFLICT DO NOTHING;
    SELECT id INTO v_head_lib FROM public.fee_heads WHERE name = 'Library Fee' LIMIT 1;

    INSERT INTO public.scholarships (name, type, value) VALUES ('First Graduate Concession', 'fixed_amount', 25000) ON CONFLICT DO NOTHING;
    SELECT id INTO v_schol_merit FROM public.scholarships WHERE name = 'First Graduate Concession' LIMIT 1;

    INSERT INTO public.fee_structures (category_id, semester_id, name, academic_year, total_amount)
    VALUES (v_cat_tuition, v_sem, 'B.Tech Year 3 Fee', '2025-26', 125000) ON CONFLICT DO NOTHING;
    SELECT id INTO v_struct_btech FROM public.fee_structures WHERE name = 'B.Tech Year 3 Fee' LIMIT 1;

    INSERT INTO public.fee_structure_items (structure_id, head_id, amount) VALUES (v_struct_btech, v_head_tui, 120000), (v_struct_btech, v_head_lib, 5000);

    INSERT INTO public.fee_penalty_configs (org_id, name, type, amount, grace_period_days)
    VALUES (v_org_id, 'Standard Late Fee', 'flat', 500, 15) ON CONFLICT DO NOTHING;
    SELECT id INTO v_penalty FROM public.fee_penalty_configs WHERE name = 'Standard Late Fee' LIMIT 1;

    INSERT INTO public.tax_configs (org_id, gst_rate) VALUES (v_org_id, 18) ON CONFLICT DO NOTHING;
    SELECT id INTO v_tax FROM public.tax_configs WHERE gst_rate = 18 LIMIT 1;
    
    INSERT INTO public.bank_accounts (org_id, bank_name, account_number, ifsc_code)
    VALUES (v_org_id, 'Indian Bank', '12345678901', 'IDIB000M123') ON CONFLICT DO NOTHING;
    SELECT id INTO v_bank FROM public.bank_accounts WHERE account_number = '12345678901' LIMIT 1;

    FOR r IN SELECT id FROM public.users WHERE role = 'student' LOOP
        DECLARE 
            v_assignment_id UUID;
            v_paid_amt NUMERIC := CASE WHEN random() > 0.4 THEN 125000 ELSE 60000 END;
            v_status TEXT := CASE WHEN v_paid_amt = 125000 THEN 'paid' ELSE 'partial' END;
        BEGIN
            INSERT INTO public.student_fee_assignments (student_id, structure_id, scholarship_id, total_amount, discount_amount, net_amount, paid_amount, status, approval_status)
            VALUES (r.id, v_struct_btech, CASE WHEN random() > 0.8 THEN v_schol_merit ELSE NULL END, 125000, 0, 125000, v_paid_amt, v_status, 'approved')
            ON CONFLICT DO NOTHING;
            SELECT id INTO v_assignment_id FROM public.student_fee_assignments WHERE student_id = r.id AND structure_id = v_struct_btech LIMIT 1;

            INSERT INTO public.fee_installments (assignment_id, installment_number, amount, due_date, status, paid_amount)
            VALUES 
                (v_assignment_id, 1, 60000, '2025-08-01', 'paid', 60000),
                (v_assignment_id, 2, 65000, '2026-01-01', CASE WHEN v_paid_amt = 125000 THEN 'paid' ELSE 'pending' END, CASE WHEN v_paid_amt = 125000 THEN 65000 ELSE 0 END);
                
            -- Create a dummy transaction
            INSERT INTO public.transactions (student_id, assignment_id, amount, payment_method, gateway_transaction_id, receipt_number, status)
            VALUES (r.id, v_assignment_id, 60000, 'online', 'UPI' || floor(random() * 99999999), 'REC-' || floor(random() * 99999), 'success');
        END;
    END LOOP;

    -- ==========================================
    -- 6. HOSTEL MANAGEMENT
    -- ==========================================
    INSERT INTO public.hostels (org_id, name, type, gender, capacity)
    VALUES 
        (v_org_id, 'Bharathiar Boys Hostel', 'On-Campus', 'Male', 500),
        (v_org_id, 'Kannagi Girls Hostel', 'On-Campus', 'Female', 400)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_hostel_boys FROM public.hostels WHERE gender = 'Male' LIMIT 1;
    SELECT id INTO v_hostel_girls FROM public.hostels WHERE gender = 'Female' LIMIT 1;

    INSERT INTO public.hostel_rooms (hostel_id, room_number, capacity, room_type, monthly_rent)
    VALUES 
        (v_hostel_boys, 'B-101', 3, 'Standard Non-AC', 4000),
        (v_hostel_girls, 'G-201', 2, 'Standard AC', 6000)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_room_b1 FROM public.hostel_rooms WHERE room_number = 'B-101' LIMIT 1;
    SELECT id INTO v_room_g1 FROM public.hostel_rooms WHERE room_number = 'G-201' LIMIT 1;

    -- Allocate hostel to half the students based on gender
    FOR r IN SELECT id, gender FROM public.users WHERE role = 'student' AND random() > 0.5 LOOP
        INSERT INTO public.hostel_allocations_api (user_id, room_id, hostel_id, monthly_rent, deposit_amount)
        VALUES (
            r.id, 
            CASE WHEN r.gender = 'Female' THEN v_room_g1 ELSE v_room_b1 END, 
            CASE WHEN r.gender = 'Female' THEN v_hostel_girls ELSE v_hostel_boys END,
            CASE WHEN r.gender = 'Female' THEN 6000 ELSE 4000 END,
            15000
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    -- ==========================================
    -- 7. LIBRARY
    -- ==========================================
    INSERT INTO public.books (org_id, title, author, isbn, publisher, quantity, available_quantity)
    VALUES 
        (v_org_id, 'Database System Concepts', 'Silberschatz', '9780073523323', 'McGraw Hill', 20, 15),
        (v_org_id, 'Operating System Concepts', 'Galvin', '9781118063330', 'Wiley', 15, 10)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_book_1 FROM public.books WHERE isbn = '9780073523323' LIMIT 1;
    SELECT id INTO v_book_2 FROM public.books WHERE isbn = '9781118063330' LIMIT 1;

    INSERT INTO public.book_copies (book_id, accession_number, status, price) VALUES (v_book_1, 'ACC-DB-01', 'available', 850) ON CONFLICT DO NOTHING;
    SELECT id INTO v_copy_1 FROM public.book_copies WHERE accession_number = 'ACC-DB-01' LIMIT 1;
    INSERT INTO public.book_copies (book_id, accession_number, status, price) VALUES (v_book_2, 'ACC-OS-01', 'issued', 950) ON CONFLICT DO NOTHING;
    SELECT id INTO v_copy_2 FROM public.book_copies WHERE accession_number = 'ACC-OS-01' LIMIT 1;

    FOR r IN SELECT id FROM public.users WHERE role = 'student' LOOP
        INSERT INTO public.library_members (user_id, member_number) VALUES (r.id, 'LIB-' || floor(random()*99999)) ON CONFLICT DO NOTHING;
        -- Issue a book to some
        IF random() > 0.8 THEN
           INSERT INTO public.book_issues (copy_id, member_id, due_date, status)
           SELECT v_copy_2, lm.id, CURRENT_DATE + interval '14 days', 'issued'
           FROM public.library_members lm WHERE lm.user_id = r.id;
        END IF;
    END LOOP;

    -- ==========================================
    -- 8. TRANSPORT
    -- ==========================================
    INSERT INTO public.transport_vehicles (org_id, vehicle_number, vehicle_type, capacity, driver_name)
    VALUES 
        (v_org_id, 'TN 09 AZ 1234', 'Bus', 50, 'Vel Murugan'),
        (v_org_id, 'TN 10 BZ 5678', 'Bus', 40, 'Kandasamy')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_veh_1 FROM public.transport_vehicles WHERE vehicle_number = 'TN 09 AZ 1234' LIMIT 1;

    INSERT INTO public.transport_routes (org_id, vehicle_id, route_name, route_code, start_point, end_point)
    VALUES (v_org_id, v_veh_1, 'Route 1 - Tambaram', 'R1-TBM', 'Tambaram Station', 'Campus')
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_route_1 FROM public.transport_routes WHERE route_code = 'R1-TBM' LIMIT 1;

    INSERT INTO public.transport_stops (route_id, stop_name, stop_order)
    VALUES (v_route_1, 'Chromepet', 1), (v_route_1, 'Pallavaram', 2)
    ON CONFLICT DO NOTHING;
    SELECT id INTO v_stop_1 FROM public.transport_stops WHERE stop_name = 'Chromepet' LIMIT 1;

    -- Allocate transport to ALL students
    FOR r IN SELECT id FROM public.users WHERE role = 'student' LOOP
        DECLARE v_reg_id UUID;
        BEGIN
            INSERT INTO public.transport_registrations (org_id, student_id, route_id, vehicle_id, reg_id, fee_annual)
            VALUES (v_org_id, r.id, v_route_1, v_veh_1, 'TR-' || floor(random()*99999), 18000)
            ON CONFLICT DO NOTHING;
            
            SELECT id INTO v_reg_id FROM public.transport_registrations WHERE student_id = r.id LIMIT 1;
            
            IF v_reg_id IS NOT NULL THEN
                INSERT INTO public.transport_fee_payments (org_id, registration_id, amount_due, amount_paid, due_date, status)
                VALUES (v_org_id, v_reg_id, 18000, 18000, '2025-08-01', 'Paid')
                ON CONFLICT DO NOTHING;
            END IF;
        END;
    END LOOP;

END $$;
