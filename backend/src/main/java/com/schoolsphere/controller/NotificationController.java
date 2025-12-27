package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping(produces = "application/json")
    public ApiResponse<Object> getNotifications(
            @RequestParam(required = false) String user_id,
            @RequestParam(required = false) Boolean read,
            @RequestParam(required = false) Integer limit) {
        try {
            Object result = notificationService.getNotifications(user_id, read, limit);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PostMapping(produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> createNotification(@RequestBody Map<String, Object> notificationData) {
        try {
            Object result = notificationService.createNotification(notificationData);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping(value = "/{id}/read", produces = "application/json")
    public ApiResponse<Object> markNotificationAsRead(@PathVariable String id) {
        try {
            Object result = notificationService.markNotificationAsRead(id);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }

    @PutMapping(value = "/read-all", produces = "application/json", consumes = "application/json")
    public ApiResponse<Object> markAllNotificationsAsRead(@RequestBody Map<String, Object> request) {
        try {
            String userId = (String) request.get("user_id");
            if (userId == null || userId.isEmpty()) {
                return ApiResponse.error("user_id is required");
            }
            Object result = notificationService.markAllNotificationsAsRead(userId);
            return ApiResponse.success(result);
        } catch (Exception e) {
            return ApiResponse.error(e.getMessage());
        }
    }
}

