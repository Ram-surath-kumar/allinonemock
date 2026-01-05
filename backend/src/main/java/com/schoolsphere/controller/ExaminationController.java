package com.schoolsphere.controller;

import com.schoolsphere.model.ApiResponse;
import com.schoolsphere.service.ExaminationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exam")
public class ExaminationController {

    @Autowired
    private ExaminationService examService;

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> getDashboard() {
        try {
            return new ApiResponse<>(examService.getDashboardData(), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @GetMapping("/list")
    public ApiResponse<List<Map<String, Object>>> getExams() {
        try {
            return new ApiResponse<>(examService.getExams(), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/create")
    public ApiResponse<Map<String, Object>> createExam(@RequestBody Map<String, Object> examData) {
        try {
            return new ApiResponse<>(examService.createExam(examData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @GetMapping("/timetable/{examId}")
    public ApiResponse<List<Map<String, Object>>> getTimetable(@PathVariable String examId) {
        try {
            return new ApiResponse<>(examService.getExamTimetable(examId), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
    
    @PostMapping("/timetable")
    public ApiResponse<Map<String, Object>> createTimetableEntry(@RequestBody Map<String, Object> entryData) {
        try {
            return new ApiResponse<>(examService.createTimetableEntry(entryData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/hall-tickets/generate/{examId}")
    public ApiResponse<Map<String, Object>> generateHallTickets(@PathVariable String examId) {
        try {
            return new ApiResponse<>(examService.generateHallTickets(examId), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }

    @GetMapping("/hall-tickets/{examId}")
    public ApiResponse<List<Map<String, Object>>> getHallTickets(@PathVariable String examId) {
        try {
            return new ApiResponse<>(examService.getHallTickets(examId), null);
        } catch (Exception e) {
             return new ApiResponse<>(null, e.getMessage());
        }
    }

    @PostMapping("/seating/generate")
    public ApiResponse<Map<String, Object>> generateSeating(@RequestBody Map<String, Object> data) {
        try {
            String examId = (String) data.get("exam_id");
            String centerId = (String) data.get("center_id");
            int capacity = (int) data.get("room_capacity");
            return new ApiResponse<>(examService.generateSeatingPlan(examId, centerId, capacity), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
    
    @GetMapping("/seating/{examId}")
    public ApiResponse<List<Map<String, Object>>> getSeatingPlan(@PathVariable String examId) {
        try {
            return new ApiResponse<>(examService.getSeatingPlan(examId), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
    
    @PostMapping("/marks/submit")
    public ApiResponse<Map<String, Object>> submitMarks(@RequestBody Map<String, Object> marksData) {
        try {
             return new ApiResponse<>(examService.submitMarks(marksData), null);
        } catch (Exception e) {
            return new ApiResponse<>(null, e.getMessage());
        }
    }
}
