import { supabaseAdmin } from './common.js';

async function getID() {
    const { data } = await supabaseAdmin.from('exams').select('id').ilike('name', '%Financial Management%').limit(1);
    if (data && data.length) console.log(`EXAM_ID:${data[0].id}`);
    else console.log('EXAM_ID:NOT_FOUND');
}
getID();
