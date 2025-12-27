package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.OrganizationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/organizations")
public class OrganizationController {

    @Autowired
    private OrganizationService organizationService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getOrganizations(
            @RequestParam(required = false) String id,
            @RequestParam(required = false) String org_name) {
        try {
            Object result = organizationService.getOrganizations(id, org_name);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping(value = "/{id}", produces = "application/json")
    public ApiResponse<Object> getOrganizationById(@PathVariable String id) {
        try {
            Object result = organizationService.getOrganizationById(id);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> updateOrganization(@PathVariable String id, @RequestBody Map<String, Object> orgData) {
        try {
            Object result = organizationService.updateOrganization(id, orgData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

