package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.model.GrowthStats;
import com.schoolsphere.model.StaffBreakdown;
import com.schoolsphere.service.GrowthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/growth")
public class GrowthController {

    @Autowired
    private GrowthService growthService;

    @GetMapping(produces = "application/json")
    public ApiResponse<GrowthStats> getGrowthData(
            @RequestParam String metric,
            @RequestParam(defaultValue = "month") String period) {
        try {
            GrowthStats result = growthService.getGrowthData(metric, period);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping(value = "/staff-by-role", produces = "application/json")
    public ApiResponse<GrowthStats> getStaffGrowthByRole(
            @RequestParam String role,
            @RequestParam(defaultValue = "month") String period) {
        try {
            GrowthStats result = growthService.getStaffGrowthByRole(role, period);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @GetMapping(value = "/staff-breakdown", produces = "application/json")
    public ApiResponse<StaffBreakdown> getStaffBreakdown() {
        try {
            StaffBreakdown result = growthService.getStaffBreakdown();
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

