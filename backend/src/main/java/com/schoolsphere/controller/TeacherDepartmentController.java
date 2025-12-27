package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.TeacherDepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/teacher-departments")
public class TeacherDepartmentController {

    @Autowired
    private TeacherDepartmentService teacherDepartmentService;

    @GetMapping(value = "/{teacherId}", produces = "application/json")
    public ApiResponse<Object> getTeacherDepartments(@PathVariable String teacherId) {
        try {
            Object result = teacherDepartmentService.getTeacherDepartments(teacherId);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> updateTeacherDepartments(@RequestBody Map<String, Object> request) {
        try {
            String teacherId = (String) request.get("teacher_id");
            @SuppressWarnings("unchecked")
            List<String> departmentIds = (List<String>) request.get("department_ids");
            
            if (teacherId == null || teacherId.isEmpty()) {
                return ApiResponse.error("teacher_id is required");
            }
            if (departmentIds == null) {
                departmentIds = new java.util.ArrayList<>();
            }
            
            Object result = teacherDepartmentService.updateTeacherDepartments(teacherId, departmentIds);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

