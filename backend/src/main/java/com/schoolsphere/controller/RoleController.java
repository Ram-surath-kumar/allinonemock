package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getCustomRoles() {
        try {
            Object result = roleService.getCustomRoles();
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ApiResponse<Object> getCustomRoleById(@PathVariable String id) {
        try {
            Object result = roleService.getCustomRoleById(id);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> createCustomRole(@RequestBody Map<String, Object> roleData) {
        try {
            Object result = roleService.createCustomRole(roleData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> updateCustomRole(@PathVariable String id, @RequestBody Map<String, Object> roleData) {
        try {
            Object result = roleService.updateCustomRole(id, roleData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @DeleteMapping(value = "/{id}", produces = "application/json")
    public ApiResponse<Object> deleteCustomRole(@PathVariable String id) {
        try {
            roleService.deleteCustomRole(id);
            return ApiResponse.success(Map.of("success", true));
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

