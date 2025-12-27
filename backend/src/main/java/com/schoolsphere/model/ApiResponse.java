package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiResponse<T> {
    @JsonProperty("data")
    public T data;
    
    @JsonProperty("error")
    public String error;

    public ApiResponse() {
    }

    public ApiResponse(T data, String error) {
        this.data = data;
        this.error = error;
    }

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(data, null);
    }

    public static <T> ApiResponse<T> error(String error) {
        return new ApiResponse<>(null, error);
    }
}
