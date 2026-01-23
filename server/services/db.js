// server/services/db.js
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
            table_name: entity,
            record_id: recordId ? String(recordId) : null,
            operation: action, // 'CREATE', 'UPDATE', 'DELETE'

            // Default null
            old_values: null,
            new_values: null,

            performed_by: context.user?.id || null,
            user_role: context.userProfile?.role || 'system',
            ip_address: context.ip,
            user_agent: context.userAgent,
            reason: context.reason || 'Standard Operation',
            created_at: new Date().toISOString()
        };

        // Construct payload based on action
        if (action === 'UPDATE') {
            entry.old_values = Object.keys(changes).reduce((acc, k) => ({ ...acc, [k]: changes[k]?.old }), {});
            entry.new_values = Object.keys(changes).reduce((acc, k) => ({ ...acc, [k]: changes[k]?.new }), {});
        } else if (action === 'CREATE' && changes.new_value) {
            entry.new_values = changes.new_value;
        } else if (action === 'DELETE' && changes.deleted_record) {
            entry.old_values = changes.deleted_record;
        }

        const { error } = await supabaseAdmin.from('audit_logs').insert(entry);
        if (error) {
            console.error('CRITICAL: Audit Log Failed', error);
            throw error;
        }
    } catch (err) {
        console.error('CRITICAL: Audit Log Failed', err);
        throw new Error('Audit Logging Failed - ' + err.message);
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
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldRecord) throw new Error('Record not found');

        // Decrypt old record for diffing
        const oldDecrypted = processOutputData(oldRecord);

        // 2. Prepare New Data (Encrypt)
        const secureData = processInputData(data);

        // 3. Update
        const { data: updated, error } = await supabaseAdmin
            .from(table)
            .update(secureData)
            .eq('id', id)
            .select()
            .single();

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
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

        // 2. Delete
        const { error } = await supabaseAdmin
            .from(table)
            .delete()
            .eq('id', id);

        if (error) throw error;

        // 3. Audit
        const oldDecrypted = oldRecord ? processOutputData(oldRecord) : {};
        await logAudit('DELETE', table, id, { deleted_record: oldDecrypted }, context);

        return true;
    }
};
