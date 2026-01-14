
// server/services/db.js
import { supabaseAdmin, supabase } from '../common.js';
import { SENSITIVE_FIELDS, AUDIT_EVENTS } from '../config/securityConfig.js';
import crypto from 'crypto';

// Encryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012'; // Must be 32 chars
const IV_LENGTH = 16; // AES block size

if (process.env.NODE_ENV === 'production' && !process.env.ENCRYPTION_KEY) {
    console.error('CRITICAL: ENCRYPTION_KEY is missing in production!');
}

/* --- Encryption Helpers --- */

const encrypt = (text) => {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(String(text));
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (e) {
        console.error('Encryption Failed:', e);
        throw new Error('Encryption Service Failure');
    }
};

const decrypt = (text) => {
    if (!text || !String(text).includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        // Return original if decryption fails (might be unencrypted old data)
        return text;
    }
};

const processDataForWrite = (data) => {
    const processed = { ...data };
    SENSITIVE_FIELDS.forEach(field => {
        if (processed[field]) {
            processed[field] = encrypt(processed[field]);
        }
    });
    return processed;
};

const processDataForRead = (data) => {
    if (!data) return data;
    if (Array.isArray(data)) {
        return data.map(item => processDataForRead(item));
    }
    const processed = { ...data };
    SENSITIVE_FIELDS.forEach(field => {
        if (processed[field]) {
            processed[field] = decrypt(processed[field]);
        }
    });
    return processed;
};

/* --- Audit Logging --- */

const logAudit = async (table, recordId, operation, oldValues, newValues, context) => {
    if (process.env.DISABLE_SECURE_DB_FEATURES === 'true') {
        return { data: null, error: null };
    }

    try {
        const { error } = await supabaseAdmin
            .from('audit_logs')
            .insert({
                table_name: table,
                record_id: recordId,
                operation,
                old_values: oldValues,
                new_values: newValues,
                performed_by: context?.user?.id || null, // from req.user
                user_role: context?.userProfile?.role || 'system',
                ip_address: context?.ip,
                user_agent: context?.userAgent,
                reason: context?.reason
            });

        if (error) {
            console.error('AUDIT LOG FAILED:', error);
            // In a strict environment, we might want to throw here to roll back the transaction
            // throw new Error('Audit Log Writing Failed'); 
            throw error;
        }
        return { data: true, error: null };
    } catch (err) {
        console.error('CRITICAL AUDIT FAILURE:', err);
        throw err; // Fail the operation if audit fails
    }
};

/* --- Secure DB Service --- */

export const secureDb = {

    // READ Operation
    get: async (table, queryCallback) => {
        // Direct bypass if flag set
        if (process.env.DISABLE_SECURE_DB_FEATURES === 'true') {
            let query = supabaseAdmin.from(table).select('*');
            if (queryCallback) query = queryCallback(query);
            const { data, error } = await query;
            return { data, error };
        }

        let query = supabase.from(table).select('*'); // User client for RLS

        // Allow caller to modify query (add filters, etc)
        if (queryCallback) {
            query = queryCallback(query);
        }

        const { data, error } = await query;
        if (error) return { data: null, error };

        // Auto-decrypt
        return { data: processDataForRead(data), error: null };
    },

    // CREATE Operation
    create: async (table, data, context) => {
        if (process.env.DISABLE_SECURE_DB_FEATURES === 'true') {
            const { data: result, error } = await supabaseAdmin.from(table).insert(data).select().single();
            if (error) return { data: null, error };
            return { data: result, error: null };
        }

        // 1. Encrypt
        const encryptedData = processDataForWrite(data);

        // 2. Insert
        const { data: inserted, error } = await supabaseAdmin
            .from(table)
            .insert(encryptedData)
            .select() // Select to get ID
            .single();

        if (error) return { data: null, error };

        // 3. Audit
        try {
            await logAudit(table, inserted.id, AUDIT_EVENTS.CREATE, null, inserted, context);
        } catch (auditErr) {
            // Rollback? Supabase doesn't support easy rollback of single HTTP requests unless using RPC.
            // For now, we error out but data is technically IN. 
            // Ideally we'd delete the record here to "rollback".
            await supabaseAdmin.from(table).delete().eq('id', inserted.id);
            return { data: null, error: { message: 'Audit Log Failed - Operation Rolled Back' } };
        }

        return { data: processDataForRead(inserted), error: null };
    },

    // UPDATE Operation
    update: async (table, id, updates, context) => {
        if (process.env.DISABLE_SECURE_DB_FEATURES === 'true') {
            const { data: result, error } = await supabaseAdmin.from(table).update(updates).eq('id', id).select().single();
            if (error) return { data: null, error };
            return { data: result, error: null };
        }

        // 1. Fetch current (OLD) state for audit
        const { data: oldData, error: fetchError } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) return { data: null, error: fetchError };

        // 2. Encrypt New Data
        const encryptedUpdates = processDataForWrite(updates);

        // 3. Perform Update
        const { data: updated, error } = await supabaseAdmin
            .from(table)
            .update(encryptedUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) return { data: null, error };

        // 4. Audit
        try {
            await logAudit(table, id, AUDIT_EVENTS.UPDATE, oldData, updated, context);
        } catch (auditErr) {
            // "Rollback" is hard here without transactions.
            // We notify failure.
            console.error('Updates committed but audit failed for record:', id);
            return { data: null, error: { message: 'Audit Log Failed - Data may be inconsistent' } };
        }

        return { data: processDataForRead(updated), error: null };
    },

    // DELETE Operation
    delete: async (table, id, context) => {
        if (process.env.DISABLE_SECURE_DB_FEATURES === 'true') {
            const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
            return { data: true, error };
        }

        // 1. Fetch current (OLD) state for audit
        const { data: oldData, error: fetchError } = await supabaseAdmin
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) return { data: null, error: fetchError };

        // 2. Delete
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);

        if (error) return { error };

        // 3. Audit
        await logAudit(table, id, AUDIT_EVENTS.DELETE, oldData, null, context);

        return { error: null };
    },

    // Expose helpers if needed
    helpers: {
        encrypt,
        decrypt
    }
};
