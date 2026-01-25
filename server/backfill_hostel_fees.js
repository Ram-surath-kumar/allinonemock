
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars:', { supabaseUrl, hasKey: !!supabaseKey });
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function backfillHostelFees() {
    console.log('Starting Backfill (Direct Client)...');

    try {
        // 1. Get allocations
        const { data: allocations, error: allocError } = await supabase
            .from('hostel_allocations_api')
            .select('*')
            .eq('status', 'active');

        if (allocError) throw allocError;
        console.log(`Found ${allocations.length} active allocations.`);

        let processed = 0;
        let assigned = 0;

        for (const alloc of allocations) {
            processed++;
            console.log(`Processing student ${alloc.user_id}...`);

            try {
                // 2. Find Fee Structure
                // We will look for ANY fee structure named %Hostel% for this year
                const { data: structures, error: structError } = await supabase
                    .from('fee_structures')
                    .select('*')
                    .ilike('name', '%Hostel%')
                    .eq('batch_year', new Date().getFullYear());

                if (structError) {
                    console.error('Error fetching structure:', structError);
                    throw structError;
                }

                let structureId;
                let structureAmount = 50000;

                if (structures && structures.length > 0) {
                    structureId = structures[0].id;
                    structureAmount = structures[0].total_amount;
                    console.log('Using structure:', structures[0].name);
                } else {
                    console.log('Creating default structure...');
                    const { data: newStruct, error: createError } = await supabase
                        .from('fee_structures')
                        .insert({
                            name: `Hostel Fee - ${new Date().getFullYear()}`,
                            batch_year: new Date().getFullYear(),
                            semester: 'Annual',
                            due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
                            total_amount: 50000,
                            category_id: null // optional
                        })
                        .select()
                        .single();
                    
                    if (createError) throw createError;
                    structureId = newStruct.id;
                    structureAmount = newStruct.total_amount;
                }

                // 3. Check assignment
                const { data: existing, error: existError } = await supabase
                    .from('student_fee_assignments')
                    .select('*')
                    .eq('student_id', alloc.user_id)
                    .eq('structure_id', structureId);
                
                if (existError) throw existError;

                if (existing && existing.length > 0) {
                    console.log('Already assigned.');
                    continue;
                }

                // 4. Create Assignment
                const { data: assign, error: assignError } = await supabase
                    .from('student_fee_assignments')
                    .insert({
                        student_id: alloc.user_id,
                        structure_id: structureId,
                        total_amount: structureAmount,
                        net_amount: structureAmount,
                        status: 'pending',
                        assigned_date: new Date().toISOString().split('T')[0]
                    })
                    .select()
                    .single();

                if (assignError) throw assignError;
                console.log('Assigned:', assign.id);
                assigned++;

            } catch (err) {
                console.error('Inner Error:', JSON.stringify(err, null, 2));
            }
        }
        
        console.log(`Done. Assigned: ${assigned}`);

    } catch (error) {
        console.error('Fatal:', error);
    }
}

backfillHostelFees();
