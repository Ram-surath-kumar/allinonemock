package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.schoolsphere.model.ConsolidatedGrowthData;
import com.schoolsphere.model.GrowthStats;
import com.schoolsphere.model.StaffBreakdown;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class GrowthService {

    @Autowired
    private SupabaseService supabaseService;

    public GrowthStats getGrowthData(String metric, String period) throws Exception {
        LocalDate now = LocalDate.now();
        LocalDate startDate;
        LocalDate previousStartDate;
        List<Map<String, Object>> dataPoints = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Determine date ranges based on period
        switch (period) {
            case "week":
                startDate = now.minusWeeks(1);
                previousStartDate = now.minusWeeks(2);
                break;
            case "month":
                startDate = now.minusMonths(1);
                previousStartDate = now.minusMonths(2);
                break;
            case "quarter":
                startDate = now.minusMonths(3);
                previousStartDate = now.minusMonths(6);
                break;
            case "year":
                startDate = now.minusYears(1);
                previousStartDate = now.minusYears(2);
                break;
            default:
                startDate = now.minusMonths(1);
                previousStartDate = now.minusMonths(2);
        }

        // Fetch all required data ONCE based on metric
        JsonNode usersData = null;
        JsonNode attendanceData = null;
        
        if ("students".equals(metric) || "staff".equals(metric)) {
            Map<String, String> filters = new HashMap<>();
            filters.put("status", "active");
            usersData = supabaseService.get("users", filters);
        } else if ("attendance".equals(metric)) {
            // Fetch all attendance data - we'll filter by date in Java
            // Note: In a production system, you might want to fetch a date range
            // For now, fetch all and filter in memory to avoid multiple API calls
            Map<String, String> filters = new HashMap<>();
            attendanceData = supabaseService.get("attendance", filters);
        }

        // Generate data points based on period
        switch (period) {
            case "week":
                for (LocalDate date = startDate; !date.isAfter(now); date = date.plusDays(1)) {
                    dataPoints.add(calculateDataPointOptimized(metric, date, formatter, usersData, attendanceData));
                }
                break;
            case "month":
                LocalDate weekStart = startDate;
                while (!weekStart.isAfter(now)) {
                    LocalDate weekEnd = weekStart.plusDays(6);
                    if (weekEnd.isAfter(now)) weekEnd = now;
                    dataPoints.add(calculateDataPointOptimized(metric, weekEnd, formatter, usersData, attendanceData));
                    weekStart = weekStart.plusWeeks(1);
                }
                break;
            case "quarter":
            case "year":
                LocalDate monthStart = startDate;
                while (!monthStart.isAfter(now)) {
                    dataPoints.add(calculateDataPointOptimized(metric, monthStart, formatter, usersData, attendanceData));
                    monthStart = monthStart.plusMonths(1);
                }
                break;
        }

        // Calculate current and previous period values using the same fetched data
        double current = calculateMetricValueOptimized(metric, now, usersData, attendanceData);
        double previous = calculateMetricValueOptimized(metric, previousStartDate, usersData, attendanceData);

        double change = current - previous;
        double changePercent = previous > 0 ? (change / previous) * 100 : 0;

        return new GrowthStats(
            Math.round(current * 10.0) / 10.0,
            Math.round(previous * 10.0) / 10.0,
            Math.round(change * 10.0) / 10.0,
            Math.round(changePercent * 10.0) / 10.0,
            period,
            dataPoints
        );
    }

    public GrowthStats getStaffGrowthByRole(String role, String period) throws Exception {
        LocalDate now = LocalDate.now();
        LocalDate startDate = period.equals("week") ? now.minusWeeks(1) : now.minusMonths(1);
        LocalDate previousStartDate = period.equals("week") ? now.minusWeeks(2) : now.minusMonths(2);
        
        List<Map<String, Object>> dataPoints = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        // Fetch all users with this role ONCE
        Map<String, String> filters = new HashMap<>();
        filters.put("role", role);
        filters.put("status", "active");
        JsonNode usersData = supabaseService.get("users", filters);

        // Generate data points
        if (period.equals("week")) {
            for (LocalDate date = startDate; !date.isAfter(now); date = date.plusDays(1)) {
                int count = countUsersByRoleAndDateFromData(role, date, usersData);
                Map<String, Object> point = new HashMap<>();
                point.put("date", date.format(formatter));
                point.put("value", count);
                point.put("label", date.format(DateTimeFormatter.ofPattern("MMM d")));
                dataPoints.add(point);
            }
        } else {
            LocalDate weekStart = startDate;
            while (!weekStart.isAfter(now)) {
                LocalDate weekEnd = weekStart.plusDays(6);
                if (weekEnd.isAfter(now)) weekEnd = now;
                int count = countUsersByRoleAndDateFromData(role, weekEnd, usersData);
                Map<String, Object> point = new HashMap<>();
                point.put("date", weekEnd.format(formatter));
                point.put("value", count);
                point.put("label", weekEnd.format(DateTimeFormatter.ofPattern("MMM d")));
                dataPoints.add(point);
                weekStart = weekStart.plusWeeks(1);
            }
        }

        int current = countUsersByRoleAndDateFromData(role, now, usersData);
        int previous = countUsersByRoleAndDateFromData(role, previousStartDate, usersData);
        double change = current - previous;
        double changePercent = previous > 0 ? (change / previous) * 100 : 0;

        return new GrowthStats(
            (double) current,
            (double) previous,
            change,
            Math.round(changePercent * 10.0) / 10.0,
            period,
            dataPoints
        );
    }

    public StaffBreakdown getStaffBreakdown() throws Exception {
        Map<String, String> filters = new HashMap<>();
        filters.put("status", "active");
        
        JsonNode users = supabaseService.get("users", filters);
        int teachers = 0;
        int librarians = 0;
        int housekeeping = 0;
        int accountants = 0;

        if (users != null && users.isArray()) {
            for (JsonNode user : users) {
                String role = user.has("role") ? user.get("role").asText() : "";
                switch (role) {
                    case "teacher":
                        teachers++;
                        break;
                    case "librarian":
                        librarians++;
                        break;
                    case "housekeeping":
                        housekeeping++;
                        break;
                    case "accountant":
                        accountants++;
                        break;
                }
            }
        }

        int total = teachers + librarians + housekeeping + accountants;
        return new StaffBreakdown(teachers, librarians, housekeeping, accountants, total);
    }

    private Map<String, Object> calculateDataPointOptimized(String metric, LocalDate date, DateTimeFormatter formatter, 
                                                             JsonNode usersData, JsonNode attendanceData) {
        double value = calculateMetricValueOptimized(metric, date, usersData, attendanceData);
        Map<String, Object> point = new HashMap<>();
        point.put("date", date.format(formatter));
        point.put("value", Math.round(value * 10.0) / 10.0);
        point.put("label", date.format(DateTimeFormatter.ofPattern("MMM d")));
        return point;
    }

    private double calculateMetricValueOptimized(String metric, LocalDate date, JsonNode usersData, JsonNode attendanceData) {
        switch (metric) {
            case "students":
                return countUsersByRoleAndDateFromData("student", date, usersData);
            case "staff":
                return countStaffByDateFromData(date, usersData);
            case "attendance":
                return calculateAttendanceRateFromData(date, attendanceData);
            case "fees":
                return 0.0; // TODO: Implement when fees table is available
            default:
                return 0.0;
        }
    }

    private int countUsersByRoleAndDateFromData(String role, LocalDate date, JsonNode usersData) {
        if (usersData == null || !usersData.isArray()) {
            return 0;
        }
        
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + "T23:59:59";
        int count = 0;
        for (JsonNode user : usersData) {
            String userRole = user.has("role") ? user.get("role").asText() : "";
            if (role.equals(userRole)) {
                if (user.has("created_at")) {
                    String createdAt = user.get("created_at").asText();
                    if (createdAt != null && createdAt.compareTo(dateStr) <= 0) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    private int countStaffByDateFromData(LocalDate date, JsonNode usersData) {
        if (usersData == null || !usersData.isArray()) {
            return 0;
        }
        
        int count = 0;
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + "T23:59:59";
        List<String> staffRoles = Arrays.asList("teacher", "librarian", "housekeeping", "accountant", "admin", "vice_head");
        
        for (JsonNode user : usersData) {
            String role = user.has("role") ? user.get("role").asText() : "";
            if (staffRoles.contains(role)) {
                if (user.has("created_at")) {
                    String createdAt = user.get("created_at").asText();
                    if (createdAt != null && createdAt.compareTo(dateStr) <= 0) {
                        count++;
                    }
                }
            }
        }
        return count;
    }

    private double calculateAttendanceRateFromData(LocalDate date, JsonNode attendanceData) {
        if (attendanceData == null || !attendanceData.isArray()) {
            return 0.0;
        }
        
        String dateStr = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        int total = 0;
        int present = 0;
        
        for (JsonNode record : attendanceData) {
            if (record.has("date") && dateStr.equals(record.get("date").asText())) {
                total++;
                if (record.has("status") && "present".equals(record.get("status").asText())) {
                    present++;
                }
            }
        }
        return total > 0 ? (double) present / total * 100.0 : 0.0;
    }
}

