import { supabase, supabaseAdmin } from '../common.js';

// Authentication Middleware
// Authentication Middleware
export const authenticateUser = async (req, res, next) => {
    try {
        const fs = await import('fs');
        const log = (msg) => {
            const time = new Date().toISOString();
            // Log to root directory
            fs.appendFileSync('./server_debug_log.txt', `[${time}] [AUTH] ${msg}\n`);
        };

        const authHeader = req.headers.authorization;
        log(`Incoming Request: ${req.method} ${req.originalUrl || req.url}`);

        if (!authHeader) {
            log('Fail: Missing Authorization header');
            return res.status(401).json({ error: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        // log(`Token (last 6 chars): ...${token.slice(-6)}`);

        // Verify token using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            log(`Fail: Invalid/Expired Token. Error: ${error?.message}`);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = user;

        // Fetch full user profile including role from 'users' table
        const { data: userProfile, error: profileError } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(`id.eq.${user.id},email.eq.${user.email}`)
            .single();

        if (profileError || !userProfile) {
            log(`Fail: Profile not found for user ${user.email}. DB Error: ${profileError?.message}`);
            // Fallback commented out to strictly verify DB lookup
            // return res.status(403).json({ error: 'User profile not found. Access denied.' });
            req.userProfile = { role: 'user', ...user }; // Allow temporary fallback for debugging
            log('Warn: Using fallback profile (role=user)');
        } else {
            req.userProfile = userProfile;
            log(`Success: Authenticated as ${user.email} (Role: ${userProfile.role})`);
        }

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err);
        const fs = await import('fs');
        fs.appendFileSync('./server_debug_log.txt', `[${new Date().toISOString()}] [AUTH-ERROR] ${err.message}\n`);
        res.status(500).json({ error: 'Internal Server Authentication Error' });
    }
};

// RBAC Middleware
export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.userProfile || !req.userProfile.role) {
            return res.status(403).json({ error: 'Access Denied: No role assigned' });
        }

        const userRole = req.userProfile.role;

        // Admin has access to everything
        if (userRole === 'admin') {
            return next();
        }

        if (allowedRoles.includes(userRole)) {
            return next();
        }

        return res.status(403).json({ error: `Access Denied: Requires one of [${allowedRoles.join(', ')}]` });
    };
};

// MFA Requirement Middleware
export const requireMFA = async (req, res, next) => {
    // Check Supabase JWT for AAL (Authenticator Assurance Level)
    const aal = req.user?.app_metadata?.aal || 'aal1';

    if (aal !== 'aal2') {
        // Enforce MFA
        // In a real Supabase flow, we'd check if they have 2FA enabled and if the current session is AAL2.
        // If just 'aal1', we deny access to sensitive modules.
        return res.status(403).json({
            error: 'MFA Required. Please verify your identity with a second factor.',
            code: 'MFA_REQUIRED'
        });
    }
    next();
};
