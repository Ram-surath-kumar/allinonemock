
import { supabaseAdmin } from '../common.js';

export const auditLogger = async (req, res, next) => {
    // Only log mutations or specific critical GETs if needed
    // Typically log POST, PUT, DELETE, PATCH
    const sensitiveMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];

    if (sensitiveMethods.includes(req.method)) {
        // Capture original response finish to log status
        const originalFinish = res.on;

        // Log asynchronously - don't block the request
        res.on('finish', async () => {
            try {
                // Extract User ID if available (middleware likely placed after auth or user extraction)
                // Assuming request has user attached if authenticated
                const userId = req.user?.id || req.body?.userId || null;

                // Don't log login attempts with passwords in details
                const details = { ...req.body };
                if (details.password) delete details.password;

                await supabaseAdmin.from('audit_logs').insert({
                    user_id: userId,
                    action: `${req.method} ${req.originalUrl}`,
                    method: req.method,
                    endpoint: req.originalUrl,
                    details: details,
                    ip_address: req.ip || req.headers['x-forwarded-for'],
                    user_agent: req.headers['user-agent'],
                    // status_code: res.statusCode // If we added this column
                });
            } catch (err) {
                console.error('Audit logging failed:', err);
            }
        });
    }

    next();
};
