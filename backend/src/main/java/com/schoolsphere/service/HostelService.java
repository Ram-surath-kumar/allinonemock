package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.HostelDashboardData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class HostelService {

    @Autowired
    private SupabaseService supabaseService;

    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        Map<String, Object> map = new HashMap<>();
        if (node == null) return map;
        if (node.isArray()) return Map.of("data", node.toString());
        
        node.fields().forEachRemaining(entry -> {
            JsonNode value = entry.getValue();
            if (value.isTextual()) map.put(entry.getKey(), value.asText());
            else if (value.isInt()) map.put(entry.getKey(), value.asInt());
            else if (value.isDouble()) map.put(entry.getKey(), value.asDouble());
            else if (value.isBoolean()) map.put(entry.getKey(), value.asBoolean());
            else if (value.isNull()) map.put(entry.getKey(), null);
            else map.put(entry.getKey(), value.toString());
        });
        return map;
    }

    private List<Map<String, Object>> convertJsonArrayToList(JsonNode array) {
        List<Map<String, Object>> list = new ArrayList<>();
        if (array != null && array.isArray()) {
            for (JsonNode node : array) {
                list.add(convertJsonNodeToMap(node));
            }
        }
        return list;
    }

    public HostelDashboardData getDashboardData() throws Exception {
        // Fetch Hostels
        JsonNode hostelsNode = supabaseService.get("hostels", null);
        List<Map<String, Object>> hostels = convertJsonArrayToList(hostelsNode);

        // Fetch Rooms
        JsonNode roomsNode = supabaseService.get("rooms", null);
        List<Map<String, Object>> rooms = convertJsonArrayToList(roomsNode);

        // Fetch Beds
        JsonNode bedsNode = supabaseService.get("beds", null);
        List<Map<String, Object>> beds = convertJsonArrayToList(bedsNode);

        // Fetch Applications
        JsonNode applicationsNode = supabaseService.get("hostel_applications", null);
        List<Map<String, Object>> applications = convertJsonArrayToList(applicationsNode);

        // Calculate Stats
        Map<String, Object> stats = new HashMap<>();
        long totalBeds = beds.size();
        long occupiedBeds = beds.stream().filter(b -> "OCCUPIED".equals(b.get("status"))).count();
        stats.put("total_capacity", totalBeds);
        stats.put("occupancy_rate", totalBeds > 0 ? (double) occupiedBeds / totalBeds * 100.0 : 0.0);
        stats.put("pending_applications", applications.stream().filter(a -> "APPLIED".equals(a.get("status"))).count());
        stats.put("active_students", occupiedBeds);

        return new HostelDashboardData(hostels, rooms, beds, applications, stats);
    }

    // Infrastructure Management
    public Map<String, Object> createHostel(Map<String, Object> hostelData) throws Exception {
        JsonNode result = supabaseService.post("hostels", hostelData);
        return convertJsonNodeToMap(result);
    }

    public Map<String, Object> createRoom(Map<String, Object> roomData) throws Exception {
        JsonNode result = supabaseService.post("rooms", roomData);
        
        // Auto-create beds if capacity is set
        if (result != null && result.has("id") && result.has("capacity")) {
            String roomId = result.get("id").asText();
            int capacity = result.get("capacity").asInt();
            for (int i = 1; i <= capacity; i++) {
                Map<String, Object> bedData = new HashMap<>();
                bedData.put("room_id", roomId);
                bedData.put("bed_number", result.get("room_number").asText() + "-" + (char)('A' + i - 1));
                bedData.put("status", "VACANT");
                supabaseService.post("beds", bedData);
            }
        }
        
        return convertJsonNodeToMap(result);
    }
    
    public Map<String, Object> createBed(Map<String, Object> bedData) throws Exception {
        JsonNode result = supabaseService.post("beds", bedData);
        return convertJsonNodeToMap(result);
    }

    public void deleteHostel(String id) throws Exception {
        supabaseService.delete("hostels", id);
    }

    // Allocations
    public Map<String, Object> applyForHostel(Map<String, Object> applicationData) throws Exception {
        // Set default values if missing
        if (!applicationData.containsKey("status")) {
            applicationData.put("status", "APPLIED");
        }
        if (!applicationData.containsKey("application_date")) {
            applicationData.put("application_date", new java.util.Date()); // Will serialize to ISO string likely
        }
        JsonNode result = supabaseService.post("hostel_applications", applicationData);
        return convertJsonNodeToMap(result);
    }

    public Map<String, Object> allocateBed(Map<String, Object> allocationData) throws Exception {
        // 1. Create Allocation Record
        if (!allocationData.containsKey("status")) {
            allocationData.put("status", "ACTIVE");
        }
        if (!allocationData.containsKey("allocation_date")) {
            allocationData.put("allocation_date", new java.util.Date());
        }
        JsonNode result = supabaseService.post("hostel_allocations", allocationData);
        
        // 2. Update Application Status
        String applicationId = (String) allocationData.get("application_id");
        if (applicationId != null && !applicationId.isEmpty()) {
             supabaseService.put("hostel_applications", applicationId, Map.of("status", "ALLOCATED"));
        }

        // 3. Update Bed Status
        String bedId = (String) allocationData.get("bed_id");
        if (bedId != null && !bedId.isEmpty()) {
            supabaseService.put("beds", bedId, Map.of("status", "OCCUPIED"));
        }
        
        return convertJsonNodeToMap(result);
    }
    
    public Map<String, Object> checkIn(Map<String, Object> checkinData) throws Exception {
        JsonNode result = supabaseService.post("hostel_checkins", checkinData);
        return convertJsonNodeToMap(result);
    }

    // Operations
    public Map<String, Object> createMaintenanceRequest(Map<String, Object> requestData) throws Exception {
        JsonNode result = supabaseService.post("maintenance_requests", requestData);
        return convertJsonNodeToMap(result);
    }
    
    public List<Map<String, Object>> getMaintenanceRequests() throws Exception {
        JsonNode requests = supabaseService.get("maintenance_requests", null);
        return convertJsonArrayToList(requests);
    }
}
