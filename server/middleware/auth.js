// server/middleware/auth.js
import { supabase } from '../common.js';
import { ROLES } from '../config/securityConfig.js';

/**
 * Middleware to authenticate user via Supabase JWT
 */
export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Missing authorization header' });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token', details: error?.message });
        }

        // Attach user to request
        req.user = user;

        // Fetch user profile for role
        const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('role, id, name, email')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // Fallback or just use metadata if available
            req.userProfile = { role: user.user_metadata?.role || 'student' };
        } else {
            req.userProfile = profile;
        }

        next();
    } catch (err) {
        console.error('Authentication Error:', err);
        res.status(500).json({ error: 'Internal Server Authentication Error' });
    }
};

/**
 * Middleware to check if user has one of the allowed roles
 * @param {string[]} allowedRoles 
 */
export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !req.userProfile) {
            return res.status(401).json({ error: 'User not authenticated' });
        }

        const userRole = req.userProfile.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Access Denied: Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
};
