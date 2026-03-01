import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
});

// --- TN Mock Data Generators ---
const firstNamesM = ["Karthik", "Muthu", "Sriram", "Arun", "Vignesh", "Prakash", "Sanjay", "Dinesh", "Surya", "Balaji"];
const firstNamesF = ["Priya", "Anjali", "Kavya", "Divya", "Swathi", "Aishwarya", "Keerthi", "Shruthi", "Meena", "Geetha"];
const lastNames = ["Kumar", "Rajan", "Sundaram", "Krishnan", "Iyer", "Natarajan", "Murugan", "Ganesan", "Ramasamy", "Sekar"];

const cities = [
    { city: "Chennai", pincode: "600001" },
    { city: "Madurai", pincode: "625001" },
    { city: "Coimbatore", pincode: "641001" },
    { city: "Trichy", pincode: "620001" },
    { city: "Salem", pincode: "636001" },
    { city: "Tirunelveli", pincode: "627001" },
];

const streets = ["Anna Nagar", "K.K. Nagar", "T. Nagar", "Velachery", "Adyar", "Besant Nagar", "RS Puram", "Peelamedu"];
const bloodGroups = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];

function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function generateAadhar() {
    let num = "";
    for (let i = 0; i < 12; i++) num += Math.floor(Math.random() * 10).toString();
    return num;
}

function generatePhone() {
    let num = "9";
    for (let i = 0; i < 9; i++) num += Math.floor(Math.random() * 10).toString();
    return num;
}

function generateDateOfBirth(minAge = 18, maxAge = 25) {
    const year = new Date().getFullYear() - (Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge);
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1; // simple days
    return new Date(year, month, day).toISOString().split('T')[0];
}

async function logResult(operation, data, error) {
    if (error) {
        console.error(`❌ [ERROR] ${operation}:`, error.message || error);
    } else {
        console.log(`✅ [SUCCESS] ${operation}: ${data?.length || 1} records processed.`);
    }
}

async function seedData() {
    console.log("🚀 Starting Comprehensive Data Seeding for TN Context...");

    // 1. Fetch Users
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) {
        console.error("Failed to fetch users:", userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log("No users found to construct data around. Please create a user first!");
        return;
    }

    const orgId = users[0].org_id || 1; // Fallback to 1 if not set
    console.log(`Found ${users.length} users in organization ${orgId}. Updating profiles...`);

    // --- A. UPDATE USERS WITH EXTENSIVE TN DETAILS ---
    for (const user of users) {
        const isFemale = Math.random() > 0.5;
        const name = user.name || `${getRandom(isFemale ? firstNamesF : firstNamesM)} ${getRandom(lastNames)}`;
        const [firstName, lastName] = name.split(" ");

        // Choose address
        const cityInfo = getRandom(cities);
        const street = `${Math.floor(Math.random() * 100) + 1}, ${getRandom(streets)}`;

        const tnDetails = {
            name: name,
            dob: generateDateOfBirth(user.role === 'student' ? 18 : 28, user.role === 'student' ? 24 : 60),
            gender: isFemale ? 'Female' : 'Male',
            blood_group: getRandom(bloodGroups),
            religion: 'Hindu',
            category: getRandom(['OC', 'BC', 'MBC', 'SC', 'ST']),
            nationality: 'Indian',
            mother_tongue: 'Tamil',
            aadhar_no: generateAadhar(),
            pan_no: `ABCDE${Math.floor(Math.random() * 9000) + 1000}F`,
            college_email: `${(firstName || 'user').toLowerCase()}.${(lastName || 'name').toLowerCase()}@anandhacollege.edu.in`,
            minority_community: 'No',
            is_bpl: Math.random() > 0.8 ? 'Yes' : 'No',
            is_pwd: Math.random() > 0.95 ? 'Yes' : 'No',
            marks_10th_pct: Math.floor(Math.random() * 21) + 80,
            marks_12th_pct: Math.floor(Math.random() * 21) + 80,
            entrance_exam_score: Math.floor(Math.random() * 101) + 100,
            family_income: Math.floor(Math.random() * 800000) + 200000,
            siblings_count: Math.floor(Math.random() * 4),
            is_first_graduate: Math.random() > 0.5 ? 'Yes' : 'No',
            personal_email: user.email,
            personal_mobile: generatePhone(),
            alt_mobile: generatePhone(),
            landline_phone: '-',
            current_street: street,
            current_city: cityInfo.city,
            current_state: 'Tamil Nadu',
            current_pincode: cityInfo.pincode,
            current_country: 'India',
            permanent_street: street,
            permanent_city: cityInfo.city,
            permanent_state: 'Tamil Nadu',
            permanent_pincode: cityInfo.pincode,
            permanent_country: 'India',
            father_name: `${getRandom(firstNamesM)} ${lastName || ''}`,
            father_occupation: getRandom(['Farmer', 'Business', 'Govt Employee', 'Private Sector', 'Teacher']),
            mother_name: getRandom(firstNamesF),
            mother_occupation: getRandom(['Homemaker', 'Teacher', 'Nurse', 'Private Sector']),
            emergency_contact_name: getRandom(firstNamesM),
            emergency_contact_relation: 'Uncle',
            emergency_contact_number: generatePhone(),
            emergency_contact_address: `${street}, ${cityInfo.city}`,
            medical_history: 'None'
        };

        const { error: updateError } = await supabase
            .from('users')
            .update(tnDetails)
            .eq('id', user.id);

        if (updateError) {
            console.error(`Error updating user ${user.id}:`, updateError.message);
        }
    }
    console.log("✅ Users updated with comprehensive TN details.");

    const students = users.filter((u) => u.role === 'student' || u.role === 'ADMIN_student_bypass');
    const studentUsers = students.length > 0 ? students : users; // Use all if no student explicitly defined

    // --- B. MODULE: ACADEMICS / ATTENDANCE ---
    console.log("\n📚 Processing Academics & Attendance...");

    // Create / Identify a course & class if needed
    let courseId = null, classId = null;
    const { data: courses } = await supabase.from('courses').select('id').limit(1);
    if (courses && courses.length > 0) courseId = courses[0].id;
    else {
        const { data: nc } = await supabase.from('courses').insert({ org_id: orgId, course_name: 'B.Tech - Computer Science', course_code: 'BTECH-CS', duration_semesters: 8 }).select();
        if (nc) courseId = nc[0].id;
    }

    const { data: classes } = await supabase.from('classes').select('id').limit(1);
    if (classes && classes.length > 0) classId = classes[0].id;
    else if (courseId) {
        const { data: ncls } = await supabase.from('classes').insert({ org_id: orgId, course_id: courseId, class_name: 'CS-A', year: 2026, semester: 6 }).select();
        if (ncls) classId = ncls[0].id;
    }

    // Populate Attendance for last 10 days
    const attendanceRecords = [];
    for (const student of studentUsers) {
        for (let i = 0; i < 10; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            attendanceRecords.push({
                org_id: orgId,
                student_id: student.id,
                class_id: classId || 1,
                date: d.toISOString().split('T')[0],
                status: Math.random() > 0.15 ? 'present' : 'absent',
                marked_by: users.find(u => u.role === 'teacher')?.id || null,
                notes: 'Generated by Seeders'
            });
        }
    }
    const { error: attErr } = await supabase.from('attendance').upsert(attendanceRecords, { onConflict: 'student_id,class_id,date' });
    logResult('Attendance Marking', attendanceRecords, attErr);


    // --- C. MODULE: TRANSPORT ---
    console.log("\n🚌 Processing Transport...");

    // Populate Vehicles
    let { data: vehicles } = await supabase.from('vehicles').select('id');
    if (!vehicles || vehicles.length === 0) {
        const vc = [];
        for (let i = 1; i <= 3; i++) {
            vc.push({ org_id: orgId, vehicle_number: `TN ${Math.floor(Math.random() * 90) + 10} AA ${Math.floor(Math.random() * 9000) + 1000}`, capacity: 40, driver_name: getRandom(firstNamesM), driver_phone: generatePhone(), vehicle_type: 'Bus', status: 'active' });
        }
        const { data: insV } = await supabase.from('vehicles').insert(vc).select();
        vehicles = insV;
    }

    // Populate Routes
    let { data: routes } = await supabase.from('transport_routes').select('id');
    if (!routes || routes.length === 0) {
        const tr = [
            { org_id: orgId, route_name: 'Route A - City to Campus', start_location: 'Central Station', end_location: 'Campus South Gate', vehicle_id: vehicles[0].id, waypoints: [] },
            { org_id: orgId, route_name: 'Route B - Suburbs to Campus', start_location: 'Tambaram', end_location: 'Campus North Gate', vehicle_id: vehicles[1]?.id || vehicles[0].id, waypoints: [] }
        ];
        const { data: insR } = await supabase.from('transport_routes').insert(tr).select();
        routes = insR;
    }

    // Populate Stops
    let { data: stops } = await supabase.from('transport_stops').select('id');
    if (!stops || stops.length === 0 && routes) {
        const ts = [
            { route_id: routes[0].id, stop_name: 'Guindy', stop_time: '08:00', pickup_price: 5000, drop_price: 5000, two_way_price: 9000 },
            { route_id: routes[0].id, stop_name: 'Chromepet', stop_time: '08:15', pickup_price: 4000, drop_price: 4000, two_way_price: 7000 }
        ];
        const { data: insS } = await supabase.from('transport_stops').insert(ts).select();
        stops = insS;
    }

    // Allocate Transport for students
    const transportAllocations = [];
    if (routes && stops) {
        for (const student of studentUsers) {
            if (Math.random() > 0.5) { // Allocate transport to ~50% students
                transportAllocations.push({
                    org_id: orgId,
                    user_id: student.id,
                    route_id: routes[0].id,
                    stop_id: stops[0].id,
                    type: 'two_way',
                    amount: 9000,
                    start_date: '2025-06-01',
                    end_date: '2026-05-31',
                    status: 'active'
                });
            }
        }
        if (transportAllocations.length > 0) {
            // Clear existing allocations to prevent unique constraint violations on user_id, status if any exist
            const { error: taErr } = await supabase.from('transport_allocations').upsert(transportAllocations, { onConflict: 'id' });
            logResult('Transport Allocation', transportAllocations, taErr);
        }
    }


    // --- D. MODULE: HOSTEL ---
    console.log("\n🛏️ Processing Hostel...");

    let { data: hostels } = await supabase.from('hostels').select('id');
    if (!hostels || hostels.length === 0) {
        const hst = [
            { org_id: orgId, name: "Kaveri Boys Hostel", type: "Boys", capacity: 100, warden_name: "Thiru. Sivasubramaniyan", contact_number: generatePhone() },
            { org_id: orgId, name: "Ganga Girls Hostel", type: "Girls", capacity: 80, warden_name: "Tmt. Valarmathi", contact_number: generatePhone() }
        ];
        const { data: ih } = await supabase.from('hostels').insert(hst).select();
        hostels = ih;
    }

    let { data: rooms } = await supabase.from('hostel_rooms').select('id');
    if ((!rooms || rooms.length === 0) && hostels) {
        const hrm = [];
        for (let i = 101; i <= 110; i++) hrm.push({ hostel_id: hostels[0].id, room_number: `A-${i}`, capacity: 3, type: 'Non-AC', price_per_year: 45000 });
        for (let i = 201; i <= 210; i++) hrm.push({ hostel_id: hostels[1]?.id || hostels[0].id, room_number: `B-${i}`, capacity: 2, type: 'AC', price_per_year: 65000 });
        const { data: ir } = await supabase.from('hostel_rooms').insert(hrm).select();
        rooms = ir;
    }

    const hostelAllocations = [];
    if (rooms) {
        // Allocate hostel to students who didn't get transport (roughly)
        for (const student of studentUsers) {
            const hasTransport = transportAllocations.some(ta => ta.user_id === student.id);
            if (!hasTransport) {
                hostelAllocations.push({
                    org_id: orgId,
                    user_id: student.id,
                    room_id: rooms[Math.floor(Math.random() * rooms.length)].id,
                    start_date: '2025-06-01',
                    end_date: '2026-05-31',
                    status: 'active'
                });
            }
        }
        if (hostelAllocations.length > 0) {
            const { error: haErr } = await supabase.from('hostel_allocations').upsert(hostelAllocations, { onConflict: 'id' });
            logResult('Hostel Allocation', hostelAllocations, haErr);
        }
    }

    // --- E. MODULE: FINANCE ---
    console.log("\n💸 Processing Finances...");

    let { data: feeTemplates } = await supabase.from('fee_templates').select('id');
    if (!feeTemplates || feeTemplates.length === 0) {
        const ft = { org_id: orgId, name: "B.Tech Tuition Fee - Year 3", description: "Standard tuition fee", amount: 120000, type: "tuition", interval: "yearly" };
        const { data: ift } = await supabase.from('fee_templates').insert(ft).select();
        feeTemplates = ift;
    }

    const feeAssignments = [];
    if (feeTemplates) {
        for (const student of studentUsers) {
            feeAssignments.push({
                org_id: orgId,
                student_id: student.id,
                template_id: feeTemplates[0].id,
                amount: feeTemplates[0].amount,
                due_date: '2025-08-30',
                status: Math.random() > 0.3 ? 'paid' : 'pending',
                paid_amount: Math.random() > 0.3 ? feeTemplates[0].amount : 0
            });
        }

        const { error: faErr } = await supabase.from('student_fee_assignments').upsert(feeAssignments, { onConflict: 'id' });
        logResult('Fee Assignments', feeAssignments, faErr);
    }

    // --- F. MODULE: EVENTS & NOTIFICATIONS ---
    console.log("\n📅 Processing Events & Notifications...");

    const events = [
        { org_id: orgId, title: 'Pongal Celebration', description: 'Traditional Pongal celebration on campus.', start_date: '2026-01-14T09:00:00Z', end_date: '2026-01-14T17:00:00Z', type: 'holiday', status: 'published' },
        { org_id: orgId, title: 'Tech Symposium 2026', description: 'Annual technical symposium.', start_date: '2026-03-10T10:00:00Z', end_date: '2026-03-12T16:00:00Z', type: 'academic', status: 'published' }
    ];
    const { error: evErr } = await supabase.from('events').insert(events);
    logResult('Events Generation', events, evErr);

    const notifications = [];
    for (const user of users) {
        notifications.push({
            org_id: orgId,
            user_id: user.id,
            title: 'Welcome to LoopVerse ERP',
            message: 'Your profile has been fully updated. Please review your details.',
            type: 'system',
            is_read: false
        });
    }
    const { error: notifErr } = await supabase.from('notifications').insert(notifications);
    logResult('Notifications Generation', notifications, notifErr);

    console.log("\n🎉 ALL SEEDING OPERATIONS COMPLETED SUCCESSFULLY!");
}

seedData();
