package com.schoolsphere.model.library;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;
import java.util.UUID;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Library {
    private String id;
    
    @JsonProperty("name")
    private String name;
    
    @JsonProperty("location")
    private String location;
    
    @JsonProperty("working_hours")
    private Map<String, String> workingHours;
    
    @JsonProperty("is_active")
    private boolean isActive;
    
    @JsonProperty("created_at")
    private String createdAt;
}
