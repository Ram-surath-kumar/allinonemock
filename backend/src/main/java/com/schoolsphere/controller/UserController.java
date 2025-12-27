package com.schoolsphere.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/users")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getUsers(
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String department_id,
            @RequestParam(required = false) String org_id,
            @RequestParam(required = false) String user_id) {
        try {
            Object result = userService.getUsers(email, role, status, department_id, org_id, user_id);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ApiResponse<Object> getUserById(@PathVariable String id) {
        try {
            Object result = userService.getUserById(id);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(value = "/by-departments", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> getUsersByDepartments(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> departmentIds = (List<String>) request.get("department_ids");
            String role = (String) request.get("role");
            String status = (String) request.get("status");
            
            Object result = userService.getUsersByDepartments(departmentIds, role, status);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Object> createUser(@Valid @RequestBody Map<String, Object> userData) {
        try {
            Object result = userService.createUser(userData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ApiResponse<Object> updateUser(@PathVariable String id, @Valid @RequestBody Map<String, Object> userData) {
        try {
            Object result = userService.updateUser(id, userData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Object> deleteUser(@PathVariable String id) {
        try {
            userService.deleteUser(id);
            return ApiResponse.success(Map.of("success", true));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

