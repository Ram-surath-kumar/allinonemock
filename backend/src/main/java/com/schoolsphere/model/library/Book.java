package com.schoolsphere.model.library;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class Book {
    private String id;
    
    @JsonProperty("isbn")
    private String isbn;
    
    @JsonProperty("title")
    private String title;
    
    @JsonProperty("author")
    private String author;
    
    @JsonProperty("publisher")
    private String publisher;
    
    @JsonProperty("edition")
    private String edition;
    
    @JsonProperty("category_id")
    private Integer categoryId;
    
    @JsonProperty("is_reference_only")
    private boolean isReferenceOnly;
    
    @JsonProperty("created_at")
    private String createdAt;
}
