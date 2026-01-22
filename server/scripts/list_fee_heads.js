
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });

async function listHeads() {
    console.log('--- Current Fee Heads ---');
    const { data: heads, error } = await supabase.from('fee_heads').select('name, type');

    if (error) {
        console.error('Error fetching heads:', error);
        return;
    }

    if (!heads || heads.length === 0) {
        console.log('No fee heads found.');
    } else {
        const grouped = {};
        heads.forEach(h => {
            if (!grouped[h.type]) grouped[h.type] = [];
            grouped[h.type].push(h.name);
        });

        for (const [cat, names] of Object.entries(grouped)) {
            console.log(`\n[${cat}]`);
            names.forEach(n => console.log(` - ${n}`));
        }
    }
}

listHeads();
