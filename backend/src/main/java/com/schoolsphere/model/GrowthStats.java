package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class GrowthStats {
    @JsonProperty("current")
    public Double current;
    
    @JsonProperty("previous")
    public Double previous;
    
    @JsonProperty("change")
    public Double change;
    
    @JsonProperty("changePercent")
    public Double changePercent;
    
    @JsonProperty("period")
    public String period;
    
    @JsonProperty("data")
    public List<Map<String, Object>> data;

    public GrowthStats() {
    }

    public GrowthStats(Double current, Double previous, Double change, Double changePercent, String period, List<Map<String, Object>> data) {
        this.current = current;
        this.previous = previous;
        this.change = change;
        this.changePercent = changePercent;
        this.period = period;
        this.data = data;
    }
}

