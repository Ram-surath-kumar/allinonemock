package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.FinanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/finance")
public class FinanceController {

    @Autowired
    private FinanceService financeService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Map<String, Object>> getFinanceData(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role) {
        try {
            Map<String, Object> result = financeService.getFinanceData(userId, role);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

