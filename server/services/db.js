
<<<<<<< HEAD
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
=======
import { supabaseAdmin } from '../common.js';
import { encryptData, decryptData, maskData } from '../utils/security.js';
import { SENSITIVE_FIELDS, MASK_FIELDS } from '../config/securityConfig.js';

/**
 * Secure Database Service Wrapper
 * Enforces Encryption, Audit Logging, and Data Safety.
 */

const processInputData = (data) => {
    if (!data) return data;
    const processed = { ...data };
    for (const key of Object.keys(processed)) {
        if (SENSITIVE_FIELDS.includes(key)) {
            processed[key] = encryptData(processed[key]);
        }
    }
    return processed;
};

const processOutputData = (data) => {
    if (!data) return data;
    // content might be array or object
    if (Array.isArray(data)) {
        return data.map(item => processOutputData(item));
    }
    const processed = { ...data };
    for (const key of Object.keys(processed)) {
        if (SENSITIVE_FIELDS.includes(key) && processed[key]) {
            // Try decrypt, if fails (legacy data), return original
            const decrypted = decryptData(processed[key]);
            processed[key] = decrypted || processed[key];
        }
    }
    return processed;
};

// Internal Log Helper
const logAudit = async (action, entity, recordId, changes, context) => {
    try {
        const entry = {
            entity_name: entity,
            record_id: recordId ? String(recordId) : null,
            action: action, // 'CREATE', 'UPDATE', 'DELETE'
            changes: changes, // JSONB
            user_id: context.user?.id || null,
            user_name: context.userProfile?.name || context.user?.email || 'System',
            user_role: context.userProfile?.role || 'system',
            ip_address: context.ip,
            user_agent: context.userAgent,
            reason: context.reason || 'Standard Operation',
            created_at: new Date().toISOString()
        };
        await supabaseAdmin.from('audit_logs').insert(entry);
    } catch (err) {
        console.error('CRITICAL: Audit Log Failed', err);
        // Requirement: "Failure to log = operation fails"
        // Since we log *after* op usually, to enforce this we might need to rollback.
        // But preventing the *next* step or flagging inconsistency is practical here.
        throw new Error('Audit Logging Failed - Operation Aborted per Security Policy');
    }
}

export const secureDb = {
    // READ
    get: async (table, queryFn) => {
        // queryFn is a callback (query) => query
        let query = supabaseAdmin.from(table).select('*');
        if (queryFn) query = queryFn(query);

        const { data, error } = await query;
        if (error) throw error;
        return processOutputData(data);
    },

    // CREATE
    create: async (table, data, context) => {
        const secureData = processInputData(data);
        const { data: created, error } = await supabaseAdmin
            .from(table)
            .insert(secureData)
            .select() // Needed for audit and return
            .single();

        if (error) throw error;

        // Audit Log
        await logAudit('CREATE', table, created.id, { new_value: created }, context);

        return processOutputData(created);
    },

    // UPDATE
    update: async (table, id, data, context) => {
        // 1. Fetch Old Data
        const { data: oldRecord, error: fetchError } = await supabaseAdmin
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

<<<<<<< HEAD
        if (fetchError) return { data: null, error: fetchError };

        // 2. Encrypt New Data
        const encryptedUpdates = processDataForWrite(updates);

        // 3. Perform Update
        const { data: updated, error } = await supabaseAdmin
            .from(table)
            .update(encryptedUpdates)
=======
        if (fetchError || !oldRecord) throw new Error('Record not found');

        // Decrypt old record for diffing
        const oldDecrypted = processOutputData(oldRecord);

        // 2. Prepare New Data (Encrypt)
        const secureData = processInputData(data);

        // 3. Update
        const { data: updated, error } = await supabaseAdmin
            .from(table)
            .update(secureData)
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
            .eq('id', id)
            .select()
            .single();

<<<<<<< HEAD
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
=======
        if (error) throw error;

        // 4. Calculate Diff
        const changes = {};
        const newDecrypted = processOutputData(updated);

        for (const key of Object.keys(data)) {
            if (JSON.stringify(oldDecrypted[key]) !== JSON.stringify(newDecrypted[key])) {
                changes[key] = {
                    old: MASK_FIELDS.includes(key) ? '***' : oldDecrypted[key],
                    new: MASK_FIELDS.includes(key) ? '***' : newDecrypted[key]
                };
            }
        }

        // 5. Audit
        await logAudit('UPDATE', table, id, changes, context);

        return newDecrypted;
    },

    // DELETE
    delete: async (table, id, context) => {
        // 1. Fetch Old Data
        const { data: oldRecord, error: fetchError } = await supabaseAdmin
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

<<<<<<< HEAD
        if (fetchError) return { data: null, error: fetchError };
=======
        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5

        // 2. Delete
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);

<<<<<<< HEAD
        if (error) return { error };

        // 3. Audit
        await logAudit(table, id, AUDIT_EVENTS.DELETE, oldData, null, context);

        return { error: null };
    },

    // Expose helpers if needed
    helpers: {
        encrypt,
        decrypt
=======
        if (error) throw error;

        // 3. Audit
        const oldDecrypted = oldRecord ? processOutputData(oldRecord) : {};
        await logAudit('DELETE', table, id, { deleted_record: oldDecrypted }, context);

        return true;
>>>>>>> 1323bce3fb23f0dd4ed7881a314c40c4d2307ed5
    }
};
