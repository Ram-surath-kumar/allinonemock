package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class FinanceService {

    @Autowired
    private SupabaseService supabaseService;

    public Map<String, Object> getFinanceData(String userId, String role) throws Exception {
        Map<String, Object> financeData = new HashMap<>();
        
        // Get total income (from fees, payments, etc.)
        double totalIncome = calculateTotalIncome();
        
        // Get total salary paid
        double totalSalaryPaid = calculateTotalSalaryPaid();
        
        // Get career growth data
        List<Map<String, Object>> careerGrowth = getCareerGrowthData();
        
        // Get promotion details
        List<Map<String, Object>> promotions = getPromotionDetails();
        
        // Get hike rate data
        Map<String, Object> hikeRateData = getHikeRateData();
        
        financeData.put("totalIncome", totalIncome);
        financeData.put("totalSalaryPaid", totalSalaryPaid);
        financeData.put("netProfit", totalIncome - totalSalaryPaid);
        financeData.put("careerGrowth", careerGrowth);
        financeData.put("promotions", promotions);
        financeData.put("hikeRate", hikeRateData);
        
        return financeData;
    }

    private double calculateTotalIncome() throws Exception {
        // Calculate from fees/payments table if it exists
        // For now, we'll check if there's a fees or payments table
        try {
            JsonNode fees = supabaseService.get("fees", null);
            if (fees != null && fees.isArray()) {
                double total = 0.0;
                for (JsonNode fee : fees) {
                    if (fee.has("amount") && fee.has("status")) {
                        String status = fee.get("status").asText();
                        if ("paid".equals(status) || "completed".equals(status)) {
                            total += fee.get("amount").asDouble();
                        }
                    }
                }
                return total;
            }
        } catch (Exception e) {
            // Table might not exist, return 0
        }
        
        // Try payments table
        try {
            JsonNode payments = supabaseService.get("payments", null);
            if (payments != null && payments.isArray()) {
                double total = 0.0;
                for (JsonNode payment : payments) {
                    if (payment.has("amount")) {
                        total += payment.get("amount").asDouble();
                    }
                }
                return total;
            }
        } catch (Exception e) {
            // Table might not exist
        }
        
        return 0.0;
    }

    private double calculateTotalSalaryPaid() throws Exception {
        // Calculate from salaries table if it exists
        try {
            JsonNode salaries = supabaseService.get("salaries", null);
            if (salaries != null && salaries.isArray()) {
                double total = 0.0;
                for (JsonNode salary : salaries) {
                    if (salary.has("amount") && salary.has("status")) {
                        String status = salary.get("status").asText();
                        if ("paid".equals(status) || "completed".equals(status)) {
                            total += salary.get("amount").asDouble();
                        }
                    }
                }
                return total;
            }
        } catch (Exception e) {
            // Table might not exist
        }
        
        return 0.0;
    }

    private List<Map<String, Object>> getCareerGrowthData() throws Exception {
        List<Map<String, Object>> growthData = new ArrayList<>();
        
        // Get all staff users and their career progression
        Map<String, String> staffFilter = new HashMap<>();
        staffFilter.put("status", "active");
        
        JsonNode users = supabaseService.get("users", staffFilter);
        if (users != null && users.isArray()) {
            for (JsonNode user : users) {
                String userRole = user.has("role") ? user.get("role").asText() : "";
                // Only include staff (non-students)
                if (!"student".equals(userRole)) {
                    Map<String, Object> userGrowth = new HashMap<>();
                    userGrowth.put("userId", user.has("id") ? user.get("id").asText() : "");
                    userGrowth.put("name", user.has("name") ? user.get("name").asText() : "");
                    userGrowth.put("role", userRole);
                    userGrowth.put("currentSalary", getCurrentSalary(user.has("id") ? user.get("id").asText() : ""));
                    userGrowth.put("joinDate", user.has("created_at") ? user.get("created_at").asText() : "");
                    userGrowth.put("promotions", getPromotionCount(user.has("id") ? user.get("id").asText() : ""));
                    userGrowth.put("hikes", getHikeCount(user.has("id") ? user.get("id").asText() : ""));
                    growthData.add(userGrowth);
                }
            }
        }
        
        return growthData;
    }

    private List<Map<String, Object>> getPromotionDetails() throws Exception {
        List<Map<String, Object>> promotions = new ArrayList<>();
        
        // Get from promotions table if it exists
        try {
            JsonNode promoData = supabaseService.get("promotions", null);
            if (promoData != null && promoData.isArray()) {
                for (JsonNode promo : promoData) {
                    promotions.add(convertJsonNodeToMap(promo));
                }
            }
        } catch (Exception e) {
            // Table might not exist, return empty list
        }
        
        return promotions;
    }

    private Map<String, Object> getHikeRateData() throws Exception {
        Map<String, Object> hikeData = new HashMap<>();
        
        // Get from salary_hikes table if it exists
        try {
            JsonNode hikes = supabaseService.get("salary_hikes", null);
            if (hikes != null && hikes.isArray()) {
                double totalHikePercent = 0.0;
                int count = 0;
                List<Map<String, Object>> hikeList = new ArrayList<>();
                
                for (JsonNode hike : hikes) {
                    Map<String, Object> hikeMap = convertJsonNodeToMap(hike);
                    hikeList.add(hikeMap);
                    
                    if (hike.has("hike_percentage")) {
                        totalHikePercent += hike.get("hike_percentage").asDouble();
                        count++;
                    }
                }
                
                double averageHike = count > 0 ? totalHikePercent / count : 0.0;
                
                hikeData.put("averageHikeRate", averageHike);
                hikeData.put("totalHikes", count);
                hikeData.put("hikes", hikeList);
            } else {
                hikeData.put("averageHikeRate", 0.0);
                hikeData.put("totalHikes", 0);
                hikeData.put("hikes", new ArrayList<>());
            }
        } catch (Exception e) {
            // Table might not exist
            hikeData.put("averageHikeRate", 0.0);
            hikeData.put("totalHikes", 0);
            hikeData.put("hikes", new ArrayList<>());
        }
        
        return hikeData;
    }

    private double getCurrentSalary(String userId) throws Exception {
        try {
            Map<String, String> filters = new HashMap<>();
            filters.put("user_id", userId);
            filters.put("status", "active");
            
            JsonNode salary = supabaseService.get("salaries", filters);
            if (salary != null && salary.isArray() && salary.size() > 0) {
                JsonNode latest = salary.get(0);
                if (latest.has("amount")) {
                    return latest.get("amount").asDouble();
                }
            }
        } catch (Exception e) {
            // Table might not exist
        }
        return 0.0;
    }

    private int getPromotionCount(String userId) throws Exception {
        try {
            Map<String, String> filters = new HashMap<>();
            filters.put("user_id", userId);
            
            JsonNode promotions = supabaseService.get("promotions", filters);
            if (promotions != null && promotions.isArray()) {
                return promotions.size();
            }
        } catch (Exception e) {
            // Table might not exist
        }
        return 0;
    }

    private int getHikeCount(String userId) throws Exception {
        try {
            Map<String, String> filters = new HashMap<>();
            filters.put("user_id", userId);
            
            JsonNode hikes = supabaseService.get("salary_hikes", filters);
            if (hikes != null && hikes.isArray()) {
                return hikes.size();
            }
        } catch (Exception e) {
            // Table might not exist
        }
        return 0;
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

