import { supabaseAdmin } from './common.js';

async function debugDetailed() {
    console.log('🔍 DETAILED DEBUG START');

    try {
        // 1. List all exams
        const { data: exams, error: examError } = await supabaseAdmin
            .from('exams')
            .select('id, name');

        if (examError) throw examError;

        console.log('--- EXAMS FOUND ---');
        exams.forEach(e => console.log(`ID: ${e.id} | Name: ${e.name}`));

        // 2. For each Financial Management exam, list attendance
        const targetExams = exams.filter(e => e.name.toLowerCase().includes('financial'));

        for (const exam of targetExams) {
            console.log(`\nChecking details for: ${exam.name} (${exam.id})`);

            const { data: attendance, error: attError } = await supabaseAdmin
                .from('exam_attendance')
                .select('*')
                .eq('exam_id', exam.id);

            if (attError) console.error('Error:', attError);

            console.log(`Found ${attendance.length} attendance records:`);
            attendance.forEach(a => {
                console.log(` - Student: ${a.student_id} | Status: '${a.status}' | ID: ${a.id}`);
            });
        }

    } catch (err) {
        console.error('Debug Error:', err);
    }
}

debugDetailed();
