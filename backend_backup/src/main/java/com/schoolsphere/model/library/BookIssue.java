package com.schoolsphere.model.library;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BookIssue {
    private String id;
    
    @JsonProperty("copy_id")
    private String copyId;
    
    @JsonProperty("member_id")
    private String memberId;
    
    @JsonProperty("issue_date")
    private OffsetDateTime issueDate;
    
    @JsonProperty("due_date")
    private LocalDate dueDate;
    
    @JsonProperty("returned_date")
    private OffsetDateTime returnedDate;
    
    @JsonProperty("status")
    private String status; // ISSUED, RETURNED, OVERDUE
    
    @JsonProperty("issued_by")
    private String issuedBy;
    
    // Optional joined fields
    @JsonProperty("book_copy")
    private BookCopy bookCopy;
    
    @JsonProperty("member")
    private LibraryMember member;
}
