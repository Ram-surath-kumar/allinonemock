package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.model.HostelDashboardData;
import com.schoolsphere.service.HostelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/hostel")
public class HostelController {

    @Autowired
    private HostelService hostelService;

    @GetMapping("/dashboard")
    public ApiResponse<HostelDashboardData> getDashboardData() {
        try {
            return new ApiResponse<>(hostelService.getDashboardData(), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> createHostel(@RequestBody Map<String, Object> hostelData) {
        try {
            return new ApiResponse<>(hostelService.createHostel(hostelData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
    
    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteHostel(@PathVariable String id) {
         try {
            hostelService.deleteHostel(id);
            return new ApiResponse<>(null, null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/rooms")
    public ApiResponse<Map<String, Object>> createRoom(@RequestBody Map<String, Object> roomData) {
        try {
            return new ApiResponse<>(hostelService.createRoom(roomData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/apply")
    public ApiResponse<Map<String, Object>> applyForHostel(@RequestBody Map<String, Object> applicationData) {
        try {
            return new ApiResponse<>(hostelService.applyForHostel(applicationData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/allocate")
    public ApiResponse<Map<String, Object>> allocateBed(@RequestBody Map<String, Object> allocationData) {
        try {
            return new ApiResponse<>(hostelService.allocateBed(allocationData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
    
    @PostMapping("/maintenance")
    public ApiResponse<Map<String, Object>> createMaintenanceRequest(@RequestBody Map<String, Object> data) {
        try {
            return new ApiResponse<>(hostelService.createMaintenanceRequest(data), null);
        } catch (Exception e) {
             return new ApiResponse<>(null, e.getMessage());
        }
    }
}
