package com.schoolsphere.model.library;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class LibraryMember {
    private String id;
    
    @JsonProperty("user_id")
    private String userId;
    
    @JsonProperty("role")
    private String role; // STUDENT, FACULTY, LIBRARIAN
    
    @JsonProperty("status")
    private String status; // ACTIVE, SUSPENDED, EXPIRED
    
    @JsonProperty("membership_expiry")
    private LocalDate membershipExpiry;
    
    @JsonProperty("max_books_limit")
    private Integer maxBooksLimit;
    
    @JsonProperty("current_issued_count")
    private Integer currentIssuedCount;
    
    @JsonProperty("total_fines_due")
    private BigDecimal totalFinesDue;
    
    // For joining with main user table if needed
    @JsonProperty("user_details")
    private Object userDetails; 
}
