package com.schoolsphere.model.library;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Fine {
    private String id;
    
    @JsonProperty("member_id")
    private String memberId;
    
    @JsonProperty("issue_id")
    private String issueId;
    
    @JsonProperty("amount")
    private BigDecimal amount;
    
    @JsonProperty("reason")
    private String reason;
    
    @JsonProperty("status")
    private String status; // UNPAID, PAID, WAIVED, PARTIAL
    
    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
}
