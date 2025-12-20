import { supabase } from '@/lib/supabase';

export interface Department {
  id: string;
  name: string;
  created_at: string;
  created_by?: string;
}

export async function fetchDepartments(): Promise<Department[]> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching departments:', error);
    throw error;
  }
}

export async function createDepartment(name: string, createdBy: string): Promise<Department> {
  try {
    const { data, error } = await supabase
      .from('departments')
      .insert({
        name,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating department:', error);
    throw error;
  }
}

export async function fetchTeacherDepartments(teacherId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('teacher_departments')
      .select('department_id')
      .eq('teacher_id', teacherId);

    if (error) throw error;
    return data?.map(d => d.department_id) || [];
  } catch (error) {
    console.error('Error fetching teacher departments:', error);
    throw error;
  }
}

export async function updateTeacherDepartments(teacherId: string, departmentIds: string[]): Promise<void> {
  try {
    // Delete existing associations
    const { error: deleteError } = await supabase
      .from('teacher_departments')
      .delete()
      .eq('teacher_id', teacherId);

    if (deleteError) throw deleteError;

    // Insert new associations
    if (departmentIds.length > 0) {
      const { error: insertError } = await supabase
        .from('teacher_departments')
        .insert(
          departmentIds.map(deptId => ({
            teacher_id: teacherId,
            department_id: deptId,
          }))
        );

      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error updating teacher departments:', error);
    throw error;
  }
}

