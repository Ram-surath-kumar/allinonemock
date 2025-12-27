package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/activities")
public class ActivityController {

    @Autowired
    private ActivityService activityService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getActivities(@RequestParam(required = false) Integer limit) {
        try {
            Object result = activityService.getActivities(limit);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> createActivity(@RequestBody Map<String, Object> activityData) {
        try {
            Object result = activityService.createActivity(activityData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(value = "/batch", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> createActivities(@RequestBody List<Map<String, Object>> activitiesData) {
        try {
            Object result = activityService.createActivities(activitiesData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

