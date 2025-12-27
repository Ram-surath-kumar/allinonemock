package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private SupabaseService supabaseService;

    public Object createUser(Map<String, Object> userData) throws Exception {
        // Validation
        validateUserData(userData, true);
        
        JsonNode result = supabaseService.post("users", userData);
        return convertJsonNodeToMap(result);
    }

    public Object updateUser(String id, Map<String, Object> userData) throws Exception {
        // Validation
        validateUserData(userData, false);
        
        JsonNode result = supabaseService.put("users", id, userData);
        return convertJsonNodeToMap(result);
    }

    public void deleteUser(String id) throws Exception {
        supabaseService.delete("users", id);
    }

    public Object getUsers(String email, String role, String status, String department_id, String org_id, String user_id) throws Exception {
        Map<String, String> filters = new java.util.HashMap<>();
        if (email != null && !email.isEmpty()) {
            filters.put("email", email);
        }
        if (role != null && !role.isEmpty()) {
            filters.put("role", role);
        }
        if (status != null && !status.isEmpty()) {
            filters.put("status", status);
        }
        if (department_id != null && !department_id.isEmpty()) {
            filters.put("department_id", department_id);
        }
        if (org_id != null && !org_id.isEmpty()) {
            filters.put("org_id", org_id);
        }
        if (user_id != null && !user_id.isEmpty()) {
            filters.put("user_id", user_id);
        }

        JsonNode result = supabaseService.get("users", filters.isEmpty() ? null : filters);
        return convertJsonNodeToList(result);
    }

    public Object getUserById(String id) throws Exception {
        JsonNode result = supabaseService.getById("users", id);
        if (result == null) {
            return new java.util.ArrayList<>();
        }
        return convertJsonNodeToMap(result);
    }

    public Object getUsersByDepartments(List<String> departmentIds, String role, String status) throws Exception {
        if (departmentIds == null || departmentIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        JsonNode result = supabaseService.getIn("users", "department_id", departmentIds);
        List<Map<String, Object>> allUsers = convertJsonNodeToList(result);
        
        // Filter by role and status if provided
        List<Map<String, Object>> filteredUsers = new java.util.ArrayList<>();
        for (Map<String, Object> user : allUsers) {
            if (role != null && !role.isEmpty()) {
                String userRole = user.get("role") != null ? user.get("role").toString() : "";
                if (!role.equals(userRole)) {
                    continue;
                }
            }
            if (status != null && !status.isEmpty()) {
                String userStatus = user.get("status") != null ? user.get("status").toString() : "";
                if (!status.equals(userStatus)) {
                    continue;
                }
            }
            filteredUsers.add(user);
        }
        
        return filteredUsers;
    }

    private void validateUserData(Map<String, Object> userData, boolean isCreate) {
        if (isCreate) {
            if (!userData.containsKey("name") || userData.get("name") == null || 
                userData.get("name").toString().trim().isEmpty()) {
                throw new IllegalArgumentException("Name is required");
            }
            if (!userData.containsKey("email") || userData.get("email") == null || 
                userData.get("email").toString().trim().isEmpty()) {
                throw new IllegalArgumentException("Email is required");
            }
            if (!userData.containsKey("role") || userData.get("role") == null) {
                throw new IllegalArgumentException("Role is required");
            }
        }

        // Email validation
        if (userData.containsKey("email")) {
            String email = userData.get("email").toString();
            if (!email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                throw new IllegalArgumentException("Invalid email format");
            }
        }

        // Role validation
        if (userData.containsKey("role")) {
            String role = userData.get("role").toString();
            String[] validRoles = {"admin", "vice_head", "teacher", "student", "housekeeping", "librarian", "accountant"};
            boolean isValid = false;
            for (String validRole : validRoles) {
                if (validRole.equals(role)) {
                    isValid = true;
                    break;
                }
            }
            if (!isValid) {
                throw new IllegalArgumentException("Invalid role: " + role);
            }
        }

        // Status validation
        if (userData.containsKey("status")) {
            String status = userData.get("status").toString();
            if (!status.equals("active") && !status.equals("inactive")) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }
    }

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        java.util.Map<String, Object> map = new java.util.HashMap<>();
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

    private java.util.List<Map<String, Object>> convertJsonNodeToList(JsonNode node) {
        java.util.List<Map<String, Object>> list = new java.util.ArrayList<>();
        if (node == null || !node.isArray()) {
            return list;
        }
        
        for (JsonNode item : node) {
            list.add(convertJsonNodeToMap(item));
        }
        return list;
    }
}

