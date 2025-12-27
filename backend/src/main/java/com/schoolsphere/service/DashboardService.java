package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.DashboardData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DashboardService {

    @Autowired
    private SupabaseService supabaseService;

    public DashboardData getDashboardData(String userId, String role) throws Exception {
        Map<String, Object> stats = new HashMap<>();
        List<Map<String, Object>> recentActivities = new ArrayList<>();
        List<Map<String, Object>> students = new ArrayList<>();
        List<Map<String, Object>> departments = new ArrayList<>();
        List<Map<String, Object>> notifications = new ArrayList<>();
        Map<String, Object> userInfo = new HashMap<>();
        Map<String, Object> organizationInfo = new HashMap<>();
        List<Map<String, Object>> allUsers = new ArrayList<>();

        // Get user info
        if (userId != null) {
            JsonNode user = supabaseService.getById("users", userId);
            if (user != null) {
                userInfo = convertJsonNodeToMap(user);
                
                // Get organization info if user has org_id
                if (user.has("org_id") && !user.get("org_id").isNull()) {
                    String orgId = user.get("org_id").asText();
                    JsonNode org = supabaseService.getById("organizations", orgId);
                    if (org != null) {
                        organizationInfo = convertJsonNodeToMap(org);
                    }
                }
            }
        }

        // Get departments
        JsonNode depts = supabaseService.get("departments", null);
        if (depts != null && depts.isArray()) {
            for (JsonNode dept : depts) {
                departments.add(convertJsonNodeToMap(dept));
            }
        }

        // Get all users (for admin/vice_head) or filtered users (for teachers)
        Map<String, String> activeFilter = new HashMap<>();
        activeFilter.put("status", "active");
        
        if ("teacher".equals(role) && userId != null) {
            // Get teacher departments
            JsonNode teacherDepts = supabaseService.get("teacher_departments", Map.of("teacher_id", userId));
            List<String> deptIds = new ArrayList<>();
            if (teacherDepts != null && teacherDepts.isArray()) {
                for (JsonNode td : teacherDepts) {
                    if (td.has("department_id")) {
                        deptIds.add(td.get("department_id").asText());
                    }
                }
            }
            
            // Get students for teacher's departments
            if (!deptIds.isEmpty()) {
                JsonNode studentsByDept = supabaseService.getIn("users", "department_id", deptIds);
                if (studentsByDept != null && studentsByDept.isArray()) {
                    for (JsonNode student : studentsByDept) {
                        if ("student".equals(student.get("role").asText()) && 
                            "active".equals(student.get("status").asText())) {
                            students.add(convertJsonNodeToMap(student));
                        }
                    }
                }
            }
            // For teachers, allUsers is same as students
            allUsers = new ArrayList<>(students);
        } else {
            // For admin/vice_head, get all active users
            JsonNode allUsersData = supabaseService.get("users", activeFilter);
            if (allUsersData != null && allUsersData.isArray()) {
                for (JsonNode user : allUsersData) {
                    Map<String, Object> userMap = convertJsonNodeToMap(user);
                    allUsers.add(userMap);
                    // Filter students
                    if ("student".equals(user.get("role").asText())) {
                        students.add(userMap);
                    }
                }
            }
        }

        // Get recent activities (limit to 10, ordered by created_at desc)
        // Note: Supabase PostgREST doesn't support limit/order in simple get, 
        // so we'll get all and sort in Java
        JsonNode activities = supabaseService.get("activities", null);
        if (activities != null && activities.isArray()) {
            List<JsonNode> activityList = new ArrayList<>();
            for (JsonNode activity : activities) {
                activityList.add(activity);
            }
            // Sort by created_at descending and take first 10
            activityList.sort((a, b) -> {
                String aTime = a.has("created_at") ? a.get("created_at").asText() : "";
                String bTime = b.has("created_at") ? b.get("created_at").asText() : "";
                return bTime.compareTo(aTime);
            });
            for (int i = 0; i < Math.min(10, activityList.size()); i++) {
                recentActivities.add(convertJsonNodeToMap(activityList.get(i)));
            }
        }

        // Get notifications for user
        if (userId != null) {
            Map<String, String> notifFilters = new HashMap<>();
            notifFilters.put("user_id", userId);
            JsonNode notifs = supabaseService.get("notifications", notifFilters);
            if (notifs != null && notifs.isArray()) {
                for (JsonNode notif : notifs) {
                    notifications.add(convertJsonNodeToMap(notif));
                }
            }
        }

        // Get staff members (all non-student roles)
        Map<String, String> staffFilters = new HashMap<>();
        staffFilters.put("status", "active");
        JsonNode allUsersData = supabaseService.get("users", staffFilters);
        int staffCount = 0;
        if (allUsersData != null && allUsersData.isArray()) {
            for (JsonNode user : allUsersData) {
                String userRole = user.has("role") ? user.get("role").asText() : "";
                if (!"student".equals(userRole) && "active".equals(user.has("status") ? user.get("status").asText() : "")) {
                    staffCount++;
                }
            }
        }

        // Calculate attendance rate (average for last 7 days)
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate weekAgo = today.minusDays(7);
        String weekAgoStr = weekAgo.toString();
        String todayStr = today.toString();
        
        // Get all attendance data and filter in Java
        JsonNode attendanceData = supabaseService.get("attendance", null);
        
        int totalAttendanceRecords = 0;
        int presentCount = 0;
        if (attendanceData != null && attendanceData.isArray()) {
            for (JsonNode record : attendanceData) {
                if (record.has("date")) {
                    String recordDate = record.get("date").asText();
                    // Filter records from last 7 days
                    if (recordDate != null && recordDate.compareTo(weekAgoStr) >= 0 && recordDate.compareTo(todayStr) <= 0) {
                        totalAttendanceRecords++;
                        if (record.has("status")) {
                            String status = record.get("status").asText();
                            if ("present".equals(status)) {
                                presentCount++;
                            }
                        }
                    }
                }
            }
        }
        
        double attendanceRate = totalAttendanceRecords > 0 
            ? (double) presentCount / totalAttendanceRecords * 100.0 
            : 0.0;

        // Calculate stats
        stats.put("totalStudents", students.size());
        stats.put("totalStaff", staffCount);
        stats.put("totalDepartments", departments.size());
        stats.put("totalActivities", recentActivities.size());
        stats.put("attendanceRate", Math.round(attendanceRate * 10.0) / 10.0);
        stats.put("feeCollection", 0.0); // TODO: Implement when fees table is available
        stats.put("feeCollectionPercentage", 0.0); // TODO: Implement when fees table is available
        stats.put("unreadNotifications", notifications.stream()
            .filter(n -> {
                Object read = n.get("read");
                return read == null || !Boolean.TRUE.equals(read);
            })
            .count());

        DashboardData data = new DashboardData();
        data.stats = stats;
        data.recentActivities = recentActivities;
        data.students = students;
        data.departments = departments;
        data.notifications = notifications;
        data.userInfo = userInfo;
        data.organizationInfo = organizationInfo;
        data.allUsers = allUsers;
        return data;
    }

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        node.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            if (value.isTextual()) {
                map.put(entry.getKey(), value.asText());
            } else if (value.isNumber()) {
                map.put(entry.getKey(), value.asDouble());
            } else if (value.isBoolean()) {
                map.put(entry.getKey(), value.asBoolean());
            } else if (value.isNull()) {
                map.put(entry.getKey(), null);
            } else {
                map.put(entry.getKey(), value.toString());
            }
        });
        return map;
    }
}

