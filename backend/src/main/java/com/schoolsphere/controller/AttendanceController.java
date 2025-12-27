package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.model.AttendancePageData;
import com.schoolsphere.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    @Autowired
    private AttendanceService attendanceService;

    @GetMapping(value = "/page-data", produces = "application/json")
    public ApiResponse<AttendancePageData> getAttendancePageData(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String date) {
        try {
            AttendancePageData data = attendanceService.getAttendancePageData(userId, role, date);
            return ApiResponse.success(data);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(value = "/mark", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> markAttendance(@RequestBody Map<String, Object> request) {
        try {
            Object result = attendanceService.markAttendance(request);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

