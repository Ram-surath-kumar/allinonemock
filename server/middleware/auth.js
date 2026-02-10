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

        // Helper for retry logic
        const retryOperation = async (operation, retries = 3, delay = 200) => {
            for (let i = 0; i < retries; i++) {
                try {
                    return await operation();
                } catch (err) {
                    const isLastAttempt = i === retries - 1;
                    if (isLastAttempt) throw err;

                    // Check if strictly network/fetch error
                    const isNetworkError = err.message && (
                        err.message.includes('fetch failed') ||
                        err.message.includes('network') ||
                        err.message.includes('ETIMEDOUT') ||
                        err.message.includes('ECONNREFUSED') ||
                        err.message.includes('socket hang up')
                    );

                    if (!isNetworkError) throw err; // Don't retry logic errors

                    log(`Warn: Operation failed (attempt ${i + 1}/${retries}). Retrying in ${delay}ms... Error: ${err.message}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    delay *= 2;
                }
            }
        };

        // 1. Verify token using Supabase with retry
        let user, authError;
        try {
            const result = await retryOperation(async () => {
                const { data, error } = await supabase.auth.getUser(token);
                if (error) {
                    // Check if fetch error wrapped in Supabase error
                    if (error.message && (
                        error.message.includes('fetch failed') ||
                        error.message.includes('network')
                    )) {
                        throw new Error(error.message); // Throw to trigger retry
                    }
                }
                return { data, error };
            });
            user = result.data.user;
            authError = result.error;
        } catch (err) {
            authError = err;
        }

        if (authError || !user) {
            const isNetworkError = authError?.message && (
                authError.message.includes('fetch failed') ||
                authError.message.includes('service unreachable')
            );

            log(`Fail: ${isNetworkError ? 'Network Error' : 'Invalid/Expired Token'}. Error: ${authError?.message}`);

            if (isNetworkError) {
                return res.status(503).json({ error: 'Authentication service unavailable. Please try again.' });
            }
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = user;

        // 2. Fetch full user profile with retry
        let userProfile, profileError;
        try {
            const result = await retryOperation(async () => {
                const { data, error } = await supabaseAdmin
                    .from('users')
                    .select('*')
                    .or(`id.eq.${user.id},email.eq.${user.email}`)
                    .single();

                if (error) {
                    // Supabase DB client usually throws on network error, but returns object on query error
                    // If it's a connection error, we might see it in 'error' object or it might throw.
                    // We'll check error.message for network hints just in case
                    if (error.message && error.message.includes('fetch failed')) {
                        throw new Error(error.message);
                    }
                }
                return { data, error };
            });
            userProfile = result.data;
            profileError = result.error;
        } catch (err) {
            // If DB fetch failing hard (network)
            log(`Fail: Profile fetch network error: ${err.message}`);
        }

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
