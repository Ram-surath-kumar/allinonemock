import { api } from "./api";

export async function fetchDepartments() {
  try {
    const response = await api.getDepartments();
    if (response.error) throw new Error(response.error);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching departments:", error);
    throw error;
  }
}

export async function createDepartment(name, createdBy) {
  try {
    const response = await api.createDepartment({
      name,
      created_by: createdBy,
    });
    if (response.error) throw new Error(response.error);
    if (!response.data) throw new Error("No data returned");
    return response.data;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

export async function fetchTeacherDepartments(teacherId) {
  try {
    const response = await api.getTeacherDepartments(teacherId);
    if (response.error) throw new Error(response.error);
    return response.data?.map((d) => d.department_id) || [];
  } catch (error) {
    console.error("Error fetching teacher departments:", error);
    throw error;
  }
}

export async function updateTeacherDepartments(teacherId, departmentIds) {
  try {
    const response = await api.updateTeacherDepartments(teacherId, departmentIds);
    if (response.error) throw new Error(response.error);
  } catch (error) {
    console.error("Error updating teacher departments:", error);
    throw error;
  }
}
