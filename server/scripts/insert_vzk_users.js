import { createClient } from "@supabase/supabase-js";

import dotenv from 'dotenv';
dotenv.config();

// Credentials for 'vzkbyzpqnojhlazwopvz' (Target "Loop ERP")
// Prefer environment variables if set, otherwise fallback to hardcoded
const supabaseUrl = process.env.SUPABASE_URL || "https://vzkbyzpqnojhlazwopvz.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6a2J5enBxbm9qaGxhendvcHZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMTk2MTMsImV4cCI6MjA4MTc5NTYxM30.ledQxA84HlYEQyUTmp2VJ7U4lRkLMqKCYieQNL_ObuY";

console.log("Using Supabase URL:", supabaseUrl);
console.log("Using Key (first 10 chars):", supabaseAnonKey.substring(0, 10) + "...");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const users = [
    { id: '055333b1-c71e-43e4-8692-6dccb1b94141', name: 'Mukeshh', email: '1000120007@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-06 13:23:18.928918+00', status: 'active', loopid: '1000120007', org_id: null, user_id: '20007', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: '11ef8c9e-0c89-4913-ab67-b9854d667fbf', name: 'Vinayak', email: '1000120009@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-06 14:14:46.481566+00', status: 'active', loopid: '1000120009', org_id: null, user_id: '20009', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: '4571c64a-fa86-48e9-bb59-644afdd94e42', name: 'Harish', email: '1000120003@loopverse.in', role: 'teacher', permissions: ["view_students", "manage_attendance", "view_grades", "edit_grades", "view_staff", "edit_students"], created_at: '2026-02-05 19:31:37.177948+00', status: 'active', loopid: '1000120003', org_id: null, user_id: '20003', minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: '477989e3-25a8-4aef-becf-80f2f72e36c6', name: 'sameer', email: '1000120010@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-06 14:22:10.058627+00', status: 'active', loopid: '1000120010', org_id: null, user_id: '20010', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: '62e40154-c92b-4d33-ba33-e72c7ae42496', name: 'Sentha', email: '1000120004@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-05 19:31:58.547851+00', status: 'active', loopid: '1000120004', org_id: null, user_id: '20004', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: '845cde46-eb82-4a95-9761-21cf5306267a', name: 'Vijay', email: '1000120005@loopverse.in', role: 'vice_head', permissions: ["view_students", "edit_students", "manage_attendance", "view_grades", "edit_grades", "manage_timetable", "view_finance", "view_staff", "manage_staff"], created_at: '2026-02-05 19:32:27.330387+00', status: 'active', loopid: '1000120005', org_id: null, user_id: '20005', minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: 'b0af0399-741a-4be4-bb44-046ca4284b5f', name: 'Test Student 11', email: '1000120011@loopverse.in', role: 'student', permissions: null, created_at: '2026-02-14 12:20:32.600264+00', status: 'active' },
    { id: 'cb851b08-69eb-4adf-ac2c-ea18bda26c23', name: 'Jeeva', email: '1000120002@loopverse.in', role: 'admin', permissions: ["view_students", "edit_students", "manage_attendance", "view_grades", "edit_grades", "manage_timetable", "view_finance", "manage_finance", "manage_library", "manage_facilities", "view_staff", "manage_staff", "manage_departments", "manage_exams", "manage_hostel", "view_reports"], department: 'Administration', created_at: '2026-02-04 20:04:15.495257+00', status: 'active', loopid: '1000120002', org_id: null, user_id: '20002', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: 'd135b621-0efb-4d15-b9ce-fe9f20bd7ca3', name: 'Mukeshh', email: '1000120008@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-06 13:32:18.30151+00', status: 'active', loopid: '1000120008', org_id: null, user_id: '20008', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' },
    { id: 'd49587a3-f502-4751-8488-9b0b90f3ad43', name: 'Mukesh', email: '1000120006@loopverse.in', role: 'student', permissions: [], created_at: '2026-02-05 19:32:52.544028+00', status: 'active', loopid: '1000120006', org_id: null, user_id: '20006', department_id: null, minority_community: 'false', is_bpl: 'false', is_pwd: 'false', is_first_graduate: 'false' }
];

async function insertUsers() {
    // Debug: Check existing organizations
    const { data: orgs, error: orgError } = await supabase.from('organizations').select('*');
    if (orgError) {
        console.log("Could not fetch organizations (might be RLS):", orgError.message);
    } else {
        console.log("Available Organizations:", JSON.stringify(orgs, null, 2));
    }

    console.log(`Trying to insert/update ${users.length} users into public.users...`);

    const { data, error } = await supabase
        .from('users')
        .upsert(users, { onConflict: 'id' });

    if (error) {
        console.error("❌ ERROR inserting data:");
        console.error(JSON.stringify(error, null, 2));

        if (error.code === '42501') {
            console.error("\n⚠️  PERMISSION DENIED (RLS policy violation).");
            console.error("You are using the ANON key, which likely does not have permission to write to 'public.users'.");
            console.error("Please provide the SERVICE_ROLE_KEY for project 'vzkbyzpqnojhlazwopvz'.");
        }
    } else {
        console.log("✅ SUCCESS! Data inserted/updated.");
        console.log(JSON.stringify(data, null, 2));
    }
}

insertUsers();
