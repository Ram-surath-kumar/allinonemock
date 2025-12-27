package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class RoleService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getCustomRoles() throws Exception {
        try {
            JsonNode roles = supabaseService.get("custom_roles", null);
            if (roles != null && roles.isArray()) {
                List<Map<String, Object>> roleList = new ArrayList<>();
                for (JsonNode role : roles) {
                    roleList.add(convertJsonNodeToMap(role));
                }
                return roleList;
            }
            return new ArrayList<>();
        } catch (Exception e) {
            // If table doesn't exist, return empty list instead of throwing error
            if (e.getMessage() != null && e.getMessage().contains("PGRST205")) {
                return new ArrayList<>();
            }
            throw e;
        }
    }

    public Object getCustomRoleById(String id) throws Exception {
        JsonNode role = supabaseService.getById("custom_roles", id);
        if (role != null) {
            return convertJsonNodeToMap(role);
        }
        return null;
    }

    public Object createCustomRole(Map<String, Object> roleData) throws Exception {
        // Validate required fields
        if (!roleData.containsKey("name") || roleData.get("name") == null) {
            throw new IllegalArgumentException("Role name is required");
        }
        
        String name = (String) roleData.get("name");
        if (name.trim().isEmpty()) {
            throw new IllegalArgumentException("Role name cannot be empty");
        }

        // Ensure permissions is an array
        Object permissionsObj = roleData.get("permissions");
        List<String> permissions = new ArrayList<>();
        if (permissionsObj instanceof List) {
            @SuppressWarnings("unchecked")
            List<Object> permList = (List<Object>) permissionsObj;
            for (Object perm : permList) {
                if (perm instanceof String) {
                    permissions.add((String) perm);
                }
            }
        }

        // Prepare data for insertion
        Map<String, Object> insertData = new HashMap<>();
        insertData.put("name", name.trim());
        insertData.put("permissions", permissions.toArray(new String[0]));

        if (roleData.containsKey("created_by")) {
            insertData.put("created_by", roleData.get("created_by"));
        }

        JsonNode result = supabaseService.post("custom_roles", insertData);
        return convertJsonNodeToMap(result);
    }

    public Object updateCustomRole(String id, Map<String, Object> roleData) throws Exception {
        // Validate required fields
        if (roleData.containsKey("name")) {
            String name = (String) roleData.get("name");
            if (name != null && name.trim().isEmpty()) {
                throw new IllegalArgumentException("Role name cannot be empty");
            }
        }

        // Ensure permissions is an array if provided
        if (roleData.containsKey("permissions")) {
            Object permissionsObj = roleData.get("permissions");
            List<String> permissions = new ArrayList<>();
            if (permissionsObj instanceof List) {
                @SuppressWarnings("unchecked")
                List<Object> permList = (List<Object>) permissionsObj;
                for (Object perm : permList) {
                    if (perm instanceof String) {
                        permissions.add((String) perm);
                    }
                }
            }
            roleData.put("permissions", permissions.toArray(new String[0]));
        }

        // Add updated_at timestamp
        roleData.put("updated_at", new Date().toInstant().toString());

        JsonNode result = supabaseService.put("custom_roles", id, roleData);
        return convertJsonNodeToMap(result);
    }

    public void deleteCustomRole(String id) throws Exception {
        supabaseService.delete("custom_roles", id);
    }

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        if (node == null) return map;
        
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
            } else if (value.isArray()) {
                List<Object> list = new ArrayList<>();
                for (JsonNode item : value) {
                    if (item.isTextual()) {
                        list.add(item.asText());
                    } else if (item.isNumber()) {
                        list.add(item.isInt() ? item.asInt() : item.asDouble());
                    } else if (item.isBoolean()) {
                        list.add(item.asBoolean());
                    } else {
                        list.add(item.toString());
                    }
                }
                map.put(entry.getKey(), list);
            } else if (value.isNull()) {
                map.put(entry.getKey(), null);
            } else {
                map.put(entry.getKey(), value.toString());
            }
        });
        return map;
    }
}

