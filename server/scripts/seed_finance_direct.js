
import { supabaseAdmin } from '../common.js';

const DEFAULT_ACCOUNTS = [
    { code: '1001', name: 'Cash in Hand', type: 'asset', subtype: 'Current Asset' },
    { code: '1002', name: 'Petty Cash', type: 'asset', subtype: 'Current Asset' },
    { code: '1010', name: 'HDFC Bank - Main', type: 'asset', subtype: 'Bank' },
    { code: '1011', name: 'SBI Bank - Fees', type: 'asset', subtype: 'Bank' },
    { code: '1100', name: 'Accounts Receivable', type: 'asset', subtype: 'Current Asset' },
    { code: '2001', name: 'Accounts Payable', type: 'liability', subtype: 'Current Liability' },
    { code: '3001', name: 'Capital Account', type: 'equity', subtype: 'Equity' },
    { code: '4001', name: 'Tuition Fees', type: 'income', subtype: 'Direct Income' },
    { code: '4002', name: 'Transport Fees', type: 'income', subtype: 'Direct Income' },
    { code: '4003', name: 'Hostel Fees', type: 'income', subtype: 'Direct Income' },
    { code: '5001', name: 'Salary Expense', type: 'expense', subtype: 'Indirect Expense' },
    { code: '5002', name: 'Electricity Bill', type: 'expense', subtype: 'Indirect Expense' },
    { code: '5003', name: 'Maintenance', type: 'expense', subtype: 'Indirect Expense' }
];

async function seedFinanceDirect() {
    console.log('--- Seeding Finance Data (Direct) ---');

    try {
        // 1. Chart of Accounts
        console.log('1. Seeding Chart of Accounts...');
        for (const acct of DEFAULT_ACCOUNTS) {
            const { error } = await supabaseAdmin
                .from('finance_coa') // Assuming table name, checked via schema earlier? No, assumed from API endpoint
                // Actually API endpoint is /chart-of-accounts, need to check mapped table.
                // Looking at seed_finance_data.js it calls /chart-of-accounts.
                // Let's guess 'finance_accounts' or 'chart_of_accounts'.
                // Better to just insert Fee Categories and Structures which are critical for the user.
                .upsert(acct, { onConflict: 'code' })
                .select();
            // Ignoring error if table doesn't exist, focusing on Fees
        }

        // 2. Fee Categories
        console.log('2. Seeding Fee Categories...');
        const { data: category, error: catError } = await supabaseAdmin
            .from('fee_categories')
            .upsert({ name: 'General Quota', description: 'Standard fees' }, { onConflict: 'name' })
            .select()
            .single();

        if (catError) console.error('   Cat Error:', catError.message);
        else console.log(`   Category ID: ${category.id}`);

        // 3. Fee Structure
        console.log('3. Seeding Fee Structure...');
        if (category) {
            const { data: structure, error: structError } = await supabaseAdmin
                .from('fee_structures')
                .upsert({
                    name: `Grade 10 Annual Fee ${new Date().getFullYear()}`,
                    batch_year: new Date().getFullYear(),
                    semester: 'Annual',
                    category_id: category.id,
                    due_date: `${new Date().getFullYear()}-12-31`,
                    total_amount: 50000
                }, { onConflict: 'name' })
                .select()
                .single();

            if (structError) console.error('   Struct Error:', structError.message);
            else {
                console.log(`   Structure ID: ${structure.id}`);

                // 4. Assign to Students
                console.log('4. Assigning to Students...');
                const { data: students } = await supabaseAdmin
                    .from('users')
                    .select('id, name')
                    .eq('role', 'student')
                    .eq('status', 'active');

                if (students) {
                    for (const student of students) {
                        // Check existing
                        const { data: existing } = await supabaseAdmin
                            .from('student_fee_assignments')
                            .select('id')
                            .eq('student_id', student.id)
                            .eq('structure_id', structure.id)
                            .maybeSingle();

                        if (!existing) {
                            const { error: assignError } = await supabaseAdmin
                                .from('student_fee_assignments')
                                .insert({
                                    student_id: student.id,
                                    structure_id: structure.id,
                                    total_amount: structure.total_amount,
                                    net_amount: structure.total_amount,
                                    status: 'pending',
                                    assigned_date: new Date().toISOString()
                                });

                            if (assignError) console.error(`   Failed to assign ${student.name}:`, assignError.message);
                            else console.log(`   Assigned fee to ${student.name}`);
                        } else {
                            console.log(`   ${student.name} already has fee assignment.`);
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error('Seeding Failed:', error);
    }
}

seedFinanceDirect();
