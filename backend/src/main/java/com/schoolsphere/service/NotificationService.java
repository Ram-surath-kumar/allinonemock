package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class NotificationService {

    @Autowired
    private SupabaseService supabaseService;

    public Object getNotifications(String userId, Boolean read, Integer limit) throws Exception {
        Map<String, String> filters = new HashMap<>();
        if (userId != null && !userId.isEmpty()) {
            filters.put("user_id", userId);
        }
        if (read != null) {
            filters.put("read", read.toString());
        }

        JsonNode result = supabaseService.get("notifications", filters.isEmpty() ? null : filters);
        List<Map<String, Object>> notifications = convertJsonNodeToList(result);
        
        // Apply limit if specified
        if (limit != null && limit > 0 && notifications.size() > limit) {
            notifications = notifications.subList(0, limit);
        }
        
        return notifications;
    }

    public Object createNotification(Map<String, Object> notificationData) throws Exception {
        // Validation
        if (!notificationData.containsKey("user_id") || notificationData.get("user_id") == null) {
            throw new IllegalArgumentException("user_id is required");
        }
        if (!notificationData.containsKey("message") || notificationData.get("message") == null ||
            notificationData.get("message").toString().trim().isEmpty()) {
            throw new IllegalArgumentException("message is required");
        }

        JsonNode result = supabaseService.post("notifications", notificationData);
        return convertJsonNodeToMap(result);
    }

    public Object markNotificationAsRead(String id) throws Exception {
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("read", true);
        
        JsonNode result = supabaseService.put("notifications", id, updateData);
        return convertJsonNodeToMap(result);
    }

    public Object markAllNotificationsAsRead(String userId) throws Exception {
        // Get all unread notifications for user
        Map<String, String> filters = new HashMap<>();
        filters.put("user_id", userId);
        filters.put("read", "false");
        
        JsonNode notifications = supabaseService.get("notifications", filters);
        List<Map<String, Object>> updated = new ArrayList<>();
        
        if (notifications != null && notifications.isArray()) {
            for (JsonNode notif : notifications) {
                if (notif.has("id")) {
                    String id = notif.get("id").asText();
                    Map<String, Object> updateData = new HashMap<>();
                    updateData.put("read", true);
                    JsonNode result = supabaseService.put("notifications", id, updateData);
                    updated.add(convertJsonNodeToMap(result));
                }
            }
        }
        
        return updated;
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

