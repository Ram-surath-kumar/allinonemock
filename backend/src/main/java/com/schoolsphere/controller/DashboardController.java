package com.schoolsphere.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.model.DashboardData;
import com.schoolsphere.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping(produces = "application/json")
    public ApiResponse<DashboardData> getDashboardData(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {
        try {
            DashboardData data = dashboardService.getDashboardData(userId, role);
            return ApiResponse.success(data);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

