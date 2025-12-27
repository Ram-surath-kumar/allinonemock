package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class StaffBreakdown {
    @JsonProperty("teachers")
    public Integer teachers;
    
    @JsonProperty("librarians")
    public Integer librarians;
    
    @JsonProperty("housekeeping")
    public Integer housekeeping;
    
    @JsonProperty("accountants")
    public Integer accountants;
    
    @JsonProperty("total")
    public Integer total;

    public StaffBreakdown() {
    }

    public StaffBreakdown(Integer teachers, Integer librarians, Integer housekeeping, Integer accountants, Integer total) {
        this.teachers = teachers;
        this.librarians = librarians;
        this.housekeeping = housekeeping;
        this.accountants = accountants;
        this.total = total;
    }
}

