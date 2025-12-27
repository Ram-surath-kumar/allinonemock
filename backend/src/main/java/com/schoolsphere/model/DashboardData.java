package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class DashboardData {
    @JsonProperty("stats")
    public Map<String, Object> stats;
    
    @JsonProperty("recentActivities")
    public List<Map<String, Object>> recentActivities;
    
    @JsonProperty("students")
    public List<Map<String, Object>> students;
    
    @JsonProperty("departments")
    public List<Map<String, Object>> departments;
    
    @JsonProperty("notifications")
    public List<Map<String, Object>> notifications;
    
    @JsonProperty("userInfo")
    public Map<String, Object> userInfo;
    
    @JsonProperty("organizationInfo")
    public Map<String, Object> organizationInfo;
    
    @JsonProperty("allUsers")
    public List<Map<String, Object>> allUsers; // All users for admin view

    public DashboardData() {
    }

    public DashboardData(Map<String, Object> stats, List<Map<String, Object>> recentActivities,
                        List<Map<String, Object>> students, List<Map<String, Object>> departments,
                        List<Map<String, Object>> notifications, Map<String, Object> userInfo,
                        Map<String, Object> organizationInfo, List<Map<String, Object>> allUsers) {
        this.stats = stats;
        this.recentActivities = recentActivities;
        this.students = students;
        this.departments = departments;
        this.notifications = notifications;
        this.userInfo = userInfo;
        this.organizationInfo = organizationInfo;
        this.allUsers = allUsers;
    }
}

