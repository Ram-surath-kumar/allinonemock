package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class ActivityService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getActivities(Integer limit) throws Exception {
        JsonNode result = supabaseService.get("activities", null);
        List<Map<String, Object>> activities = convertJsonNodeToList(result);
        
        // Sort by created_at descending
        activities.sort((a, b) -> {
            String aTime = a.get("created_at") != null ? a.get("created_at").toString() : "";
            String bTime = b.get("created_at") != null ? b.get("created_at").toString() : "";
            return bTime.compareTo(aTime);
        });
        
        // Apply limit if specified
        if (limit != null && limit > 0 && activities.size() > limit) {
            activities = activities.subList(0, limit);
        }
        
        return activities;
    }

    public Object createActivity(Map<String, Object> activityData) throws Exception {
        // Validation
        if (!activityData.containsKey("type") || activityData.get("type") == null) {
            throw new IllegalArgumentException("type is required");
        }
        if (!activityData.containsKey("description") || activityData.get("description") == null ||
            activityData.get("description").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("description is required");
        }

        JsonNode result = supabaseService.post("activities", activityData);
        return convertJsonNodeToMap(result);
    }

    public Object createActivities(List<Map<String, Object>> activitiesData) throws Exception {
        // Validate each activity
        for (Map<String, Object> activity : activitiesData) {
            if (!activity.containsKey("type") || activity.get("type") == null) {
                throw new IllegalArgumentException("type is required for all activities");
            }
            if (!activity.containsKey("description") || activity.get("description") == null ||
                activity.get("description").toString().trim().isEmpty()) {
                throw new IllegalArgumentException("description is required for all activities");
            }
        }

        JsonNode result = supabaseService.post("activities", activitiesData);
        return convertJsonNodeToList(result);
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

