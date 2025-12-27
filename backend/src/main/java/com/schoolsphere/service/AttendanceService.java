package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.AttendancePageData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AttendanceService {

    @Autowired
    private SupabaseService supabaseService;

    public AttendancePageData getAttendancePageData(String userId, String role, String date) throws Exception {
        List<Map<String, Object>> students = new ArrayList<>();
        List<Map<String, Object>> departments = new ArrayList<>();
        List<Map<String, Object>> attendanceRecords = new ArrayList<>();
        List<String> teacherDepartmentIds = new ArrayList<>();
        Map<String, Object> userInfo = new HashMap<>();

        // Get user info
        if (userId != null) {
            JsonNode user = supabaseService.getById("users", userId);
            if (user != null) {
                userInfo = convertJsonNodeToMap(user);
            }
        }

        // Get departments
        JsonNode depts = supabaseService.get("departments", null);
        if (depts != null && depts.isArray()) {
            for (JsonNode dept : depts) {
                departments.add(convertJsonNodeToMap(dept));
            }
        }

        // Get teacher departments if teacher
        if ("teacher".equals(role) && userId != null) {
            JsonNode teacherDepts = supabaseService.get("teacher_departments", Map.of("teacher_id", userId));
            if (teacherDepts != null && teacherDepts.isArray()) {
                for (JsonNode td : teacherDepts) {
                    if (td.has("department_id")) {
                        teacherDepartmentIds.add(td.get("department_id").asText());
                    }
                }
            }
        }

        // Get students based on role
        if ("teacher".equals(role) && !teacherDepartmentIds.isEmpty()) {
            JsonNode studentsByDept = supabaseService.getIn("users", "department_id", teacherDepartmentIds);
            if (studentsByDept != null && studentsByDept.isArray()) {
                for (JsonNode student : studentsByDept) {
                    if ("student".equals(student.get("role").asText()) && 
                        "active".equals(student.get("status").asText())) {
                        students.add(convertJsonNodeToMap(student));
                    }
                }
            }
        } else {
            Map<String, String> studentFilters = new HashMap<>();
            studentFilters.put("role", "student");
            studentFilters.put("status", "active");
            JsonNode studentsData = supabaseService.get("users", studentFilters);
            if (studentsData != null && studentsData.isArray()) {
                for (JsonNode student : studentsData) {
                    students.add(convertJsonNodeToMap(student));
                }
            }
        }

        // Get attendance records for date
        if (date != null && !date.isEmpty()) {
            Map<String, String> attendanceFilters = new HashMap<>();
            attendanceFilters.put("date", date);
            JsonNode attendance = supabaseService.get("attendance", attendanceFilters);
            if (attendance != null && attendance.isArray()) {
                for (JsonNode record : attendance) {
                    attendanceRecords.add(convertJsonNodeToMap(record));
                }
            }
        }

        return new AttendancePageData(students, departments, attendanceRecords, teacherDepartmentIds, userInfo);
    }

    public Object markAttendance(Map<String, Object> request) throws Exception {
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> records = (List<Map<String, Object>>) request.get("records");
        
        if (records == null || records.isEmpty()) {
            throw new IllegalArgumentException("Records are required");
        }

        // Validate each record
        for (Map<String, Object> record : records) {
            if (!record.containsKey("student_id")) {
                throw new IllegalArgumentException("student_id is required for each record");
            }
            if (!record.containsKey("date")) {
                throw new IllegalArgumentException("date is required for each record");
            }
            if (!record.containsKey("status")) {
                throw new IllegalArgumentException("status is required for each record");
            }
            
            String status = (String) record.get("status");
            if (!Arrays.asList("present", "absent", "late", "excused").contains(status)) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }

        // Upsert attendance records - Supabase expects array for upsert
        JsonNode result = supabaseService.upsert("attendance", records, "student_id,date");
        
        // Convert array result to list of maps
        if (result != null && result.isArray()) {
            List<Map<String, Object>> resultList = new ArrayList<>();
            for (JsonNode record : result) {
                resultList.add(convertJsonNodeToMap(record));
            }
            return resultList;
        }
        
        return convertJsonNodeToMap(result);
    }

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        if (node == null) return map;
        
        if (node.isArray()) {
            // Return as list - this shouldn't happen in most cases
            return Map.of("data", node.toString());
        }
        
        node.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            if (value.isTextual()) {
                map.put(entry.getKey(), value.asText());
            } else if (value.isNumber()) {
                if (value.isInt()) {
                    map.put(entry.getKey(), value.asInt());
                } else {
                    map.put(entry.getKey(), value.asDouble());
                }
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

