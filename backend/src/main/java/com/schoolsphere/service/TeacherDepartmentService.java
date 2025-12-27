package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class TeacherDepartmentService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getTeacherDepartments(String teacherId) throws Exception {
        Map<String, String> filters = new HashMap<>();
        filters.put("teacher_id", teacherId);

        JsonNode result = supabaseService.get("teacher_departments", filters);
        return convertJsonNodeToList(result);
    }

    public Object updateTeacherDepartments(String teacherId, List<String> departmentIds) throws Exception {
        // First, delete existing teacher departments
        Map<String, String> filters = new HashMap<>();
        filters.put("teacher_id", teacherId);
        JsonNode existing = supabaseService.get("teacher_departments", filters);
        
        if (existing != null && existing.isArray()) {
            for (JsonNode item : existing) {
                if (item.has("id")) {
                    String id = item.get("id").asText();
                    supabaseService.delete("teacher_departments", id);
                }
            }
        }

        // Then, create new teacher departments
        List<Map<String, Object>> newRecords = new ArrayList<>();
        for (String deptId : departmentIds) {
            Map<String, Object> record = new HashMap<>();
            record.put("teacher_id", teacherId);
            record.put("department_id", deptId);
            newRecords.add(record);
        }

        if (!newRecords.isEmpty()) {
            JsonNode result = supabaseService.post("teacher_departments", newRecords);
            return convertJsonNodeToList(result);
        }

        return new ArrayList<>();
    }

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        if (node == null) return map;
        
        if (node.isArray() && node.size() > 0) {
            node = node.get(0);
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

    private List<Map<String, Object>> convertJsonNodeToList(JsonNode node) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (node == null || !node.isArray()) {
            return list;
        }
        
        for (JsonNode item : node) {
            list.add(convertJsonNodeToMap(item));
        }
        return list;
    }
}

