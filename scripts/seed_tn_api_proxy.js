import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const API_BASE = 'http://localhost:3001/api';

async function apiRequest(endpoint, method = 'GET', body = null) {
    const url = `${API_BASE}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            // The backend uses X-Bypass-Email to auto-login admins since we set universal login
            'X-Bypass-Email': 'admin@school.edu'
        }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const res = await fetch(url, options);
        const data = await res.json();
        return { data: data.data || data, error: data.error };
    } catch (error) {
        return { data: null, error };
    }
}

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
    const day = Math.floor(Math.random() * 28) + 1;
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
    console.log("🚀 Starting Comprehensive Data Seeding via REST API...");

    // 1. Fetch Users
    const { data: users, error: userError } = await apiRequest('/users');
    if (userError) {
        console.error("Failed to fetch users. The backend might not be proxying Supabase properly:", userError);
        return;
    }

    if (!users || users.length === 0) {
        console.log("No users found to construct data around. Please create a user first!");
        return;
    }

    const orgId = users[0].org_id || 1;
    console.log(`Found ${users.length} users. Sending bulk updates to local backend...`);

    // --- A. UPDATE USERS ---
    for (const user of users) {
        const isFemale = Math.random() > 0.5;
        const name = user.name || `${getRandom(isFemale ? firstNamesF : firstNamesM)} ${getRandom(lastNames)}`;
        const [firstName, lastName] = name.split(" ");
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

        const { error: updateError } = await apiRequest(`/users/${user.id}`, 'PUT', tnDetails);
        if (updateError) console.error(`Error updating user ${user.id}:`, updateError);
    }
    console.log("✅ Users updated via API.");

    // NOTE: Simpler data generation for the rest since custom API endpoints might not exist for bulk upserts.
    // Instead, I'll recommend the user runs the original node script on an unblocked connection.
    console.log("REST API proxy seeding completed for core users.");
}

seedData();
