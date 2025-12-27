package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConsolidatedGrowthData {
    @JsonProperty("students")
    public Map<String, GrowthStats> students; // Key: period (week, month)
    
    @JsonProperty("staff")
    public Map<String, GrowthStats> staff; // Key: period (week, month)
    
    @JsonProperty("attendance")
    public Map<String, GrowthStats> attendance; // Key: period (week, month)

    public ConsolidatedGrowthData() {
    }

    public ConsolidatedGrowthData(Map<String, GrowthStats> students, 
                                  Map<String, GrowthStats> staff, 
                                  Map<String, GrowthStats> attendance) {
        this.students = students;
        this.staff = staff;
        this.attendance = attendance;
    }
}

