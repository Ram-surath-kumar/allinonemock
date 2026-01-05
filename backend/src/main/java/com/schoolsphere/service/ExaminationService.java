package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Service
public class ExaminationService {

    @Autowired
    private SupabaseService supabaseService;

    @Autowired
    private ObjectMapper objectMapper;

    // --- DASHBOARD ---
    public Map<String, Object> getDashboardData() throws IOException {
        Map<String, Object> dashboard = new HashMap<>();
        
        // Fetch active exams
        JsonNode examsNode = supabaseService.get("exams", Map.of("status", "eq.PLANNED"));
        List<Map<String, Object>> activeExams = convertJsonNodeToList(examsNode);
        dashboard.put("active_exams", activeExams);
        
        // Stats
        dashboard.put("total_exams", activeExams.size());
        
        // Fetch recent results (limit 5)
        // JsonNode resultsNode = supabaseService.get("student_results", Map.of("limit", "5", "order", "created_at.desc"));
        // dashboard.put("recent_results", convertJsonNodeToList(resultsNode));

        return dashboard;
    }

    // --- PLANNING (Exams, Calendar, Timetable) ---

    public List<Map<String, Object>> getExams() throws IOException {
        JsonNode node = supabaseService.get("exams", null);
        return convertJsonNodeToList(node);
    }

    public Map<String, Object> createExam(Map<String, Object> examData) throws IOException {
        JsonNode result = supabaseService.post("exams", examData);
        return convertJsonNodeToMap(result);
    }
    
    public List<Map<String, Object>> getExamTimetable(String examId) throws IOException {
        JsonNode node = supabaseService.get("exam_timetable", Map.of("exam_id", examId));
        return convertJsonNodeToList(node);
    }

    public Map<String, Object> createTimetableEntry(Map<String, Object> entryData) throws IOException {
        // Validation: Check for clashes (simplified)
        // In a real app, query existing entries for same date/time/course
        JsonNode result = supabaseService.post("exam_timetable", entryData);
        return convertJsonNodeToMap(result);
    }

    // --- ADMINISTRATION (Hall Tickets, Logistics) ---

    public Map<String, Object> generateHallTickets(String examId) throws IOException {
        // Logic: Fetch eligible students (e.g., from a specific program/semester)
        // For MVP, simplified: Fetch all students and generate tickets
        // In reality, check fees and attendance here.
        
        // 1. Get Exam Details to know programs/semesters
        JsonNode examNode = supabaseService.get("exams", Map.of("id", examId));
        if (examNode == null || examNode.isEmpty()) throw new RuntimeException("Exam not found");
        
        // 2. Fetch Eligible Students (This would need a complex filter or specific table)
        // For now, assuming we generate for ALL active students for demo purposes
        JsonNode studentsNode = supabaseService.get("users", Map.of("role", "student", "status", "active"));
        List<Map<String, Object>> students = convertJsonNodeToList(studentsNode);
        
        int generatedCount = 0;
        for (Map<String, Object> student : students) {
             Map<String, Object> ticket = new HashMap<>();
             ticket.put("exam_id", examId);
             ticket.put("student_id", student.get("id"));
             ticket.put("status", "GENERATED");
             
             try {
                // Upsert to avoid duplicates
                supabaseService.upsert("hall_tickets", ticket, "exam_id,student_id");
                generatedCount++;
             } catch (Exception e) {
                 // Ignore duplicates or errors
             }
        }
        
        return Map.of("status", "success", "tickets_generated", generatedCount);
    }
    
    public List<Map<String, Object>> getHallTickets(String examId) throws IOException {
         JsonNode node = supabaseService.get("hall_tickets", Map.of("exam_id", examId));
         return convertJsonNodeToList(node);
    }
    
    public Map<String, Object> generateSeatingPlan(String examId, String centerId, int roomCapacity) throws IOException {
        // 1. Fetch Hall Tickets for the Exam (Eligible Students)
        List<Map<String, Object>> tickets = getHallTickets(examId);
        if (tickets.isEmpty()) throw new RuntimeException("No hall tickets generated for this exam.");

        // 2. Fetch TimeTable (to know which subjects/dates) - For simplicity, we assign for the WHOLE exam block or specific paper?
        // Usually seating is per paper (Date+Session). 
        // For MVP: We will create a generic "Seat Number" for the student for the duration of the Exam OR for the first paper.
        // Let's assume we are assigning for *all* papers in this Exam block (simplified).
        
        // 3. Simple Allocation Strategy: Sequential fill of rooms
        int currentRoom = 1;
        int currentSeat = 1;
        int generatedCount = 0;
        
        for (Map<String, Object> ticket : tickets) {
            Map<String, Object> seatEntry = new HashMap<>();
            seatEntry.put("exam_timetable_id", null); // Linking to specific timetable is complex -> linked to Exam via logic? 
            // Wait, schema says `seating_plans` links to `exam_timetable_id`. 
            // So we need to generate per paper.
            
            // Let's fetch the FIRST timetable entry for this Exam to use as ID for now, 
            // or we'd need to loop through ALL timetable entries.
            List<Map<String, Object>> timeTable = getExamTimetable(examId);
            if (timeTable.isEmpty()) continue; 
            
            // Generate for EACH paper? Or just one? User request is generic.
            // Let's generate for the first paper just to demonstrate.
            String firstTimetableId = (String) timeTable.get(0).get("id");
            
            seatEntry.put("exam_timetable_id", firstTimetableId);
            seatEntry.put("exam_center_id", centerId);
            seatEntry.put("room_number", "R" + currentRoom);
            seatEntry.put("seat_number", "S" + currentSeat);
            seatEntry.put("student_id", ticket.get("student_id"));
            
            supabaseService.post("seating_plans", seatEntry);
            generatedCount++;
            
            currentSeat++;
            if (currentSeat > roomCapacity) {
                currentSeat = 1;
                currentRoom++;
            }
        }
        
        return Map.of("status", "success", "seats_assigned", generatedCount, "rooms_used", currentRoom);
    }
    
    public List<Map<String, Object>> getSeatingPlan(String examId) throws IOException {
         // This requires a join or two queries. 
         // 1. Get Timetables for Exam
         List<Map<String, Object>> timetable = getExamTimetable(examId);
         if (timetable.isEmpty()) return Collections.emptyList();
         
         // 2. Get Seating for those Timetables
         // Supabase "in" filter: exam_timetable_id.in.(id1,id2)
         String ids = timetable.stream()
            .map(t -> (String) t.get("id"))
            .collect(Collectors.joining(","));
            
         JsonNode seats = supabaseService.get("seating_plans", Map.of("exam_timetable_id", "in.(" + ids + ")"));
         return convertJsonNodeToList(seats);
    }

    // --- EVALUATION (Marks) ---
    
    public Map<String, Object> submitMarks(Map<String, Object> marksData) throws IOException {
        // Expects: student_id, assessment_component_id, marks_obtained
        // Validate marks <= max_marks logic here if component details fetched
        
        JsonNode result = supabaseService.upsert("marks_entries", marksData, "student_id,assessment_component_id");
        return convertJsonNodeToMap(result);
    }

    // --- UTILS ---

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> convertJsonNodeToList(JsonNode current) {
        if (current == null || !current.isArray()) {
            return Collections.emptyList();
        }
        return StreamSupport.stream(current.spliterator(), false)
                .map(node -> (Map<String, Object>) objectMapper.convertValue(node, Map.class))
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> convertJsonNodeToMap(JsonNode node) {
        if (node == null) return Collections.emptyMap();
        return (Map<String, Object>) objectMapper.convertValue(node, Map.class);
    }
}
