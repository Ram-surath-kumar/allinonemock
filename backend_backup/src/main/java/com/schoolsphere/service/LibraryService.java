package com.schoolsphere.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.schoolsphere.model.library.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class LibraryService {

    @Autowired
    private SupabaseService supabaseService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // ==========================================
    // Book Management
    // ==========================================

    public List<Book> getAllBooks(Map<String, String> filters) throws Exception {
        JsonNode result = supabaseService.get("books", filters);
        return Arrays.asList(objectMapper.treeToValue(result, Book[].class));
    }

    public List<BookCopy> getBookCopies(String bookId) throws Exception {
        Map<String, String> filters = new HashMap<>();
        filters.put("book_id", bookId);
        JsonNode result = supabaseService.get("book_copies", filters);
        return Arrays.asList(objectMapper.treeToValue(result, BookCopy[].class));
    }

    // ==========================================
    // Member Management
    // ==========================================

    public LibraryMember getMember(String memberId) throws Exception {
        JsonNode result = supabaseService.getById("library_members", memberId);
        if (result == null) return null;
        return objectMapper.treeToValue(result, LibraryMember.class);
    }

    // ==========================================
    // Circulation (Issue/Return)
    // ==========================================

    public BookIssue issueBook(String memberId, String copyId) throws Exception {
        // 1. Validate Member
        LibraryMember member = getMember(memberId);
        if (member == null || !"ACTIVE".equals(member.getStatus())) {
            throw new IllegalArgumentException("Invalid or inactive member");
        }
        
        // 2. Validate Copy
        JsonNode copyNode = supabaseService.getById("book_copies", copyId);
        if (copyNode == null) throw new IllegalArgumentException("Book copy not found");
        BookCopy copy = objectMapper.treeToValue(copyNode, BookCopy.class);
        
        if (!"AVAILABLE".equals(copy.getStatus())) {
            throw new IllegalStateException("Book copy is not available for issue");
        }

        // 3. Create Issue Record
        Map<String, Object> issueData = new HashMap<>();
        issueData.put("member_id", memberId);
        issueData.put("copy_id", copyId);
        issueData.put("issue_date", new Date()); // Standard ISO format handled by Jackson
        // Logic for due date calculation (simplified: 14 days default)
        issueData.put("due_date", LocalDate.now().plusDays(14).toString());
        issueData.put("status", "ISSUED");

        JsonNode issueResult = supabaseService.post("book_issues", issueData);
        
        // 4. Update Copy Status
        Map<String, Object> copyUpdate = new HashMap<>();
        copyUpdate.put("status", "ISSUED");
        supabaseService.put("book_copies", copyId, copyUpdate);
        
        // 5. Update Member Stats
        Map<String, Object> memberUpdate = new HashMap<>();
        memberUpdate.put("current_issued_count", member.getCurrentIssuedCount() + 1);
        supabaseService.put("library_members", memberId, memberUpdate);

        return objectMapper.treeToValue(issueResult, BookIssue.class);
    }

    public BookIssue returnBook(String copyId) throws Exception {
        // 1. Find Active Issue
        Map<String, String> filters = new HashMap<>();
        filters.put("copy_id", copyId);
        filters.put("status", "ISSUED");
        JsonNode issues = supabaseService.get("book_issues", filters);
        
        if (issues.isEmpty()) {
            throw new IllegalArgumentException("No active issue found for this book copy");
        }
        
        // Assuming the last one is relevant if multiple (shouldn't happen with strict logic)
        JsonNode issueNode = issues.get(0); 
        BookIssue issue = objectMapper.treeToValue(issueNode, BookIssue.class);
        
        // 2. Close Issue Record
        Map<String, Object> updateData = new HashMap<>();
        updateData.put("returned_date", new Date());
        updateData.put("status", "RETURNED");
        
        JsonNode updatedIssueNode = supabaseService.put("book_issues", issue.getId(), updateData);
        
        // 3. Update Copy Status
        Map<String, Object> copyUpdate = new HashMap<>();
        copyUpdate.put("status", "AVAILABLE");
        supabaseService.put("book_copies", copyId, copyUpdate);

        // 4. Update Member Stats (Decrement count)
        LibraryMember member = getMember(issue.getMemberId());
        if (member != null) {
            Map<String, Object> memberUpdate = new HashMap<>();
            memberUpdate.put("current_issued_count", Math.max(0, member.getCurrentIssuedCount() - 1));
            supabaseService.put("library_members", member.getId(), memberUpdate);
        }

        return objectMapper.treeToValue(updatedIssueNode, BookIssue.class);
    }
}
