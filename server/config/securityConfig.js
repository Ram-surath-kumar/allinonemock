<<<<<<< HEAD
// server/config/securityConfig.js

export const ROLES = {
=======

export const SENSITIVE_FIELDS = [
    'aadhaar_number',
    'national_id',
    'passport_number',
    'phone',
    'mobile',
    'phone_number',
    'contact_number',
    'email', // Note: email often needed for lookup, might need hash for search + encrypted for storage
    'personal_email',
    'address',
    'permanent_address',
    'current_address',
    'bank_account_number',
    'ifsc_code',
    'bank_name',
    'salary_amount' // Financial data
];

// Fields that explicitly require Masking in logs/UI
export const MASK_FIELDS = [
    'password',
    'token',
    'refresh_token',
    'aadhaar_number',
    'bank_account_number'
];

export const RBAC_ROLES = {
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
    ADMIN: 'admin',
    REGISTRAR: 'registrar',
    FINANCE: 'finance',
    FACULTY: 'faculty',
    STUDENT: 'student'
};

<<<<<<< HEAD
export const SENSITIVE_FIELDS = [
    'aadhaar_number',
    'bank_account_number',
    'phone',
    'mobile',
    'salary_amount'
];

export const AUDIT_EVENTS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ_SENSITIVE: 'READ_SENSITIVE'
};
=======
export const MFA_REQUIRED_MODULES = [
    'finance',
    'exams',
    'results',
    'users' // User management
];
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
