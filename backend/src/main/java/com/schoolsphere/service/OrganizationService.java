package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class OrganizationService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getOrganizations(String id, String org_name) throws Exception {
        Map<String, String> filters = new HashMap<>();
        if (id != null && !id.isEmpty()) {
            filters.put("id", id);
        }
        if (org_name != null && !org_name.isEmpty()) {
            filters.put("org_name", org_name);
        }

        JsonNode result = supabaseService.get("organizations", filters.isEmpty() ? null : filters);
        return convertJsonNodeToList(result);
    }

    public Object getOrganizationById(String id) throws Exception {
        JsonNode result = supabaseService.getById("organizations", id);
        if (result == null) {
            return new java.util.ArrayList<>();
        }
        return convertJsonNodeToMap(result);
    }

    public Object updateOrganization(String id, Map<String, Object> orgData) throws Exception {
        JsonNode result = supabaseService.put("organizations", id, orgData);
        return convertJsonNodeToMap(result);
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
        List<Map<String, Object>> list = new java.util.ArrayList<>();
        if (node == null || !node.isArray()) {
            return list;
        }
        
        for (JsonNode item : node) {
            list.add(convertJsonNodeToMap(item));
        }
        return list;
    }
}

