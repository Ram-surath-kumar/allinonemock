package com.schoolsphere.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
@NoArgsConstructor
public class AttendancePageData {
    @JsonProperty("students")
    public List<Map<String, Object>> students;
    
    @JsonProperty("departments")
    public List<Map<String, Object>> departments;
    
    @JsonProperty("attendanceRecords")
    public List<Map<String, Object>> attendanceRecords;
    
    @JsonProperty("teacherDepartmentIds")
    public List<String> teacherDepartmentIds;
    
    @JsonProperty("userInfo")
    public Map<String, Object> userInfo;

    public AttendancePageData(List<Map<String, Object>> students, List<Map<String, Object>> departments,
                              List<Map<String, Object>> attendanceRecords, List<String> teacherDepartmentIds,
                              Map<String, Object> userInfo) {
        this.students = students;
        this.departments = departments;
        this.attendanceRecords = attendanceRecords;
        this.teacherDepartmentIds = teacherDepartmentIds;
        this.userInfo = userInfo;
    }
}

