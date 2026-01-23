import { supabase } from '../supabaseClient.js';

async function cleanupTable(tableName, uniqueKeys, name) {
    console.log(`Checking ${name} (${tableName})...`);
    const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: true }); // Keep oldest

    if (error) {
        console.error(`Error fetching ${tableName}:`, error);
        return;
    }

    const seen = new Map();
    const toDelete = [];

    for (const record of records) {
        // Create a unique key string based on the specified columns
        const key = uniqueKeys.map(k => record[k]).join('|').toLowerCase();

        if (seen.has(key)) {
            toDelete.push(record.id);
        } else {
            seen.set(key, record.id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Found ${toDelete.length} duplicates in ${tableName}. Deleting...`);
        const { error: deleteError } = await supabase
            .from(tableName)
            .delete()
            .in('id', toDelete);

        if (deleteError) {
            console.error(`Error deleting from ${tableName}:`, deleteError);
        } else {
            console.log(`Successfully deleted ${toDelete.length} duplicates from ${tableName}.`);
        }
    } else {
        console.log(`No duplicates found in ${tableName}.`);
    }
}

async function main() {
    console.log('Starting cleanup of finance data...');

    // 1. Fee Heads (Unique by name)
    await cleanupTable('fee_heads', ['name'], 'Fee Heads');

    // 2. Fee Structures (Unique by name)
    // Note: If you want to allow same name for different batches, add 'batch_year' to uniqueKeys
    await cleanupTable('fee_structures', ['name', 'batch_year', 'semester'], 'Fee Structures');

    // 3. Scholarships (Unique by name)
    await cleanupTable('scholarships', ['name'], 'Scholarships');

    // 4. Assignment Rules (Unique by category, hostel, structure)
    // Be careful with nulls in keys (join might handle them weirdly if stringified)
    // But for now, let's assume simple duplicates.
    // 'student_category' can be null.
    // Custom logic for checks might be safer but let's try strict uniqueness on:
    // student_category (check for null), hostel_status, fee_structure_id

    // We'll skip generic cleaner for rules and write custom one to handle nulls safely if needed, 
    // but the generic one joining with '|' should handle 'null' string or similar.
    // Let's use specific logic for valid comparison.

    console.log(`Checking Assignment Rules (assignment_rules)...`);
    const { data: rules, error } = await supabase.from('assignment_rules').select('*').order('created_at', { ascending: true });
    if (!error && rules) {
        const seenRules = new Set();
        const deleteRules = [];
        for (const r of rules) {
            const key = `${r.student_category || 'NULL'}|${r.hostel_status}|${r.fee_structure_id}`;
            if (seenRules.has(key)) {
                deleteRules.push(r.id);
            } else {
                seenRules.add(key);
            }
        }
        if (deleteRules.length > 0) {
            console.log(`Found ${deleteRules.length} duplicates in assignment_rules. Deleting...`);
            await supabase.from('assignment_rules').delete().in('id', deleteRules);
            console.log('Deleted duplicates.');
        } else {
            console.log('No duplicates in assignment_rules.');
        }
    }

    // 5. Penalty Configs (Unique by name)
    await cleanupTable('penalty_configs', ['name'], 'Penalty Configs');

    console.log('Cleanup complete.');
    process.exit(0);
}

main();
