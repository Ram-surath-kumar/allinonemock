package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DepartmentService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getDepartments(String id, List<String> ids) throws Exception {
        Map<String, String> filters = new HashMap<>();
        if (id != null && !id.isEmpty()) {
            filters.put("id", id);
        }

        JsonNode result;
        if (ids != null && !ids.isEmpty()) {
            // Use getIn for multiple IDs
            result = supabaseService.getIn("departments", "id", ids);
        } else {
            result = supabaseService.get("departments", filters.isEmpty() ? null : filters);
        }
        return convertJsonNodeToList(result);
    }

    public Object createDepartment(Map<String, Object> departmentData) throws Exception {
        // Validation
        if (!departmentData.containsKey("name") || departmentData.get("name") == null ||
            departmentData.get("name").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("Department name is required");
        }

        JsonNode result = supabaseService.post("departments", departmentData);
        return convertJsonNodeToMap(result);
    }

    public Object updateDepartment(String id, Map<String, Object> departmentData) throws Exception {
        // Validation
        if (departmentData.containsKey("name")) {
            String name = departmentData.get("name").toString();
            if (name == null || name.trim().isEmpty()) {
                throw new IllegalArgumentException("Department name cannot be empty");
            }
        }

        JsonNode result = supabaseService.put("departments", id, departmentData);
        return convertJsonNodeToMap(result);
    }

    public void deleteDepartment(String id) throws Exception {
        supabaseService.delete("departments", id);
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

