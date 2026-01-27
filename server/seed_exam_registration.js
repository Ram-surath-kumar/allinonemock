import { supabaseAdmin } from './common.js';

async function seedExamData() {
    console.log('🌱 Seeding exam registration data...');

    try {
        // 1. Find Financial Management Exam
        const { data: exams, error: examError } = await supabaseAdmin
            .from('exams')
            .select('id, name')
            .ilike('name', '%Financial Management%')
            .limit(1);

        if (examError) throw examError;

        if (!exams || exams.length === 0) {
            console.error('❌ "Financial Management" exam not found. Please create it first.');
            process.exit(1);
        }

        const exam = exams[0];
        console.log(`✅ Found exam: ${exam.name} (${exam.id})`);

        // 2. Find some students
        const { data: students, error: studentError } = await supabaseAdmin
            .from('users')
            .select('id, name')
            .eq('role', 'student')
            .limit(5);

        if (studentError) throw studentError;

        if (!students || students.length === 0) {
            console.error('❌ No students found in the system.');
            process.exit(1);
        }

        console.log(`found ${students.length} students to register.`);

        // 3. Register students
        const registrations = students.map(student => ({
            exam_id: exam.id,
            student_id: student.id,
            status: 'REGISTERED',
            date: new Date().toISOString().split('T')[0]
        }));

        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('exam_attendance')
            .upsert(registrations, { onConflict: 'exam_id,student_id' }) // Prevent duplicates
            .select();

        if (insertError) throw insertError;

        console.log(`✅ Successfully registered ${inserted.length} students for ${exam.name}:`);
        inserted.forEach((reg, i) => {
            const studentName = students.find(s => s.id === reg.student_id)?.name;
            console.log(`   - ${studentName} (ID: ${reg.student_id})`);
        });

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    }
}

seedExamData();
