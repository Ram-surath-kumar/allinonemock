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
public class BookCopy {
    private String id;
    
    @JsonProperty("book_id")
    private String bookId;
    
    @JsonProperty("library_id")
    private String libraryId;
    
    @JsonProperty("rack_id")
    private Integer rackId;
    
    @JsonProperty("accession_number")
    private String accessionNumber;
    
    @JsonProperty("status")
    private String status; // AVAILABLE, ISSUED, RESERVED, LOST, DAMAGED
    
    @JsonProperty("purchase_date")
    private LocalDate purchaseDate;
    
    @JsonProperty("price")
    private BigDecimal price;
    
    @JsonProperty("is_deleted")
    private boolean isDeleted;
    
    // Optional: Include book details when joined
    @JsonProperty("book")
    private Book book;
}
