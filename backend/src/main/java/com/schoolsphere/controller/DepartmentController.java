package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.DepartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/departments")
public class DepartmentController {

    @Autowired
    private DepartmentService departmentService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getDepartments(
            @RequestParam(required = false) String id,
            @RequestParam(required = false) List<String> ids) {
        try {
            Object result = departmentService.getDepartments(id, ids);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> createDepartment(@RequestBody Map<String, Object> departmentData) {
        try {
            Object result = departmentService.createDepartment(departmentData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> updateDepartment(@PathVariable String id, @RequestBody Map<String, Object> departmentData) {
        try {
            Object result = departmentService.updateDepartment(id, departmentData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping(value = "/{id}", produces = "application/json")
    public ApiResponse<Object> deleteDepartment(@PathVariable String id) {
        try {
            departmentService.deleteDepartment(id);
            return ApiResponse.success(Map.of("success", true));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

