-- ==========================================
-- ENSURE BASE USERS FOR LOGIN
-- ==========================================

DO $$
DECLARE
    v_org_id UUID;
    v_dept_id UUID;
BEGIN
    -- 1. Ensure Organization
    SELECT id INTO v_org_id FROM public.organizations WHERE org_code = 'AU-LV001' LIMIT 1;
    IF v_org_id IS NULL THEN
        INSERT INTO public.organizations (org_name, org_code, contact_info) 
        VALUES ('Anna University Affiliated - Loop Demo', 'AU-LV001', '{"phone": "044-22357004", "email": "admin@au-loop.edu.in", "address": "Guindy, Chennai"}') 
        RETURNING id INTO v_org_id;
    END IF;

    -- 2. Ensure Department
    SELECT id INTO v_dept_id FROM public.departments WHERE code = 'CSE' LIMIT 1;
    IF v_dept_id IS NULL THEN
        INSERT INTO public.departments (org_id, name, code, description, email)
        VALUES (v_org_id, 'Computer Science and Engineering', 'CSE', 'B.Tech IT & CSE Dept', 'cse@au-loop.edu.in')
        RETURNING id INTO v_dept_id;
    END IF;

    -- 3. Ensure Admin User
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@loopverse.in') THEN
        INSERT INTO public.users (id, org_id, department_id, name, email, role, status, loopid)
        VALUES (gen_random_uuid(), v_org_id, v_dept_id, 'System Admin', 'admin@loopverse.in', 'admin', 'active', 'admin');
    END IF;

    -- 4. Ensure Student User (1000120002)
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE loopid = '1000120002') THEN
        INSERT INTO public.users (id, org_id, department_id, name, email, role, status, loopid, user_id)
        VALUES (gen_random_uuid(), v_org_id, v_dept_id, 'Karthik Kumar', '1000120002@loopverse.in', 'student', 'active', '1000120002', 120002);
    END IF;

    -- 5. Update any existing users with wrong formats if necessary
    UPDATE public.users SET email = '1000120002@loopverse.in' WHERE loopid = '1000120002' AND email IS NULL;

END $$;
