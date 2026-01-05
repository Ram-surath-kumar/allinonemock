package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import java.util.Map;

public class HostelDashboardData {
    public List<Map<String, Object>> hostels;
    public List<Map<String, Object>> rooms;
    public List<Map<String, Object>> beds;
    public List<Map<String, Object>> applications;
    
    @JsonProperty("stats")
    public Map<String, Object> stats;

    public HostelDashboardData(List<Map<String, Object>> hostels, 
                              List<Map<String, Object>> rooms,
                              List<Map<String, Object>> beds,
                              List<Map<String, Object>> applications,
                              Map<String, Object> stats) {
        this.hostels = hostels;
        this.rooms = rooms;
        this.beds = beds;
        this.applications = applications;
        this.stats = stats;
    }
}
