// server/config/securityConfig.js

export const ROLES = {
    ADMIN: 'admin',
    REGISTRAR: 'registrar',
    FINANCE: 'finance',
    FACULTY: 'faculty',
    STUDENT: 'student'
};

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
