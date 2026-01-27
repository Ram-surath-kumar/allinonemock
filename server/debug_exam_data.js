import { supabaseAdmin } from './common.js';

async function debugExamData() {
    console.log('🔍 Debugging Exam Data...');

    try {
        // 1. Find all exams matching "Financial"
        const { data: exams, error: examError } = await supabaseAdmin
            .from('exams')
            .select('id, name, created_at');

        if (examError) throw examError;

        const financialExams = exams.filter(e => e.name.toLowerCase().includes('financial'));

        console.log(`\nFound ${financialExams.length} 'Financial' exams:`);
        for (const exam of financialExams) {
            console.log(`- [${exam.id}] "${exam.name}" (Created: ${exam.created_at})`);

            // Check attendance for this exam
            const { count, error: countError } = await supabaseAdmin
                .from('exam_attendance')
                .select('*', { count: 'exact', head: true })
                .eq('exam_id', exam.id);

            if (countError) console.error('  Error checking attendance:', countError.message);
            console.log(`  > Registered Students: ${count}`);
        }

        // 2. Check if there are ANY students
        const { count: studentCount } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student');
        console.log(`\nTotal Students in DB: ${studentCount}`);

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugExamData();
