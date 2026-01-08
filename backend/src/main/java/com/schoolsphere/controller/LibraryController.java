package com.schoolsphere.controller;

import com.schoolsphere.model.library.Book;
import com.schoolsphere.model.library.BookIssue;
import com.schoolsphere.model.library.LibraryMember;
import com.schoolsphere.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/library")
public class LibraryController {

    @Autowired
    private LibraryService libraryService;

    // ==========================================
    // Book Endpoints
    // ==========================================

    @GetMapping("/books")
    public ResponseEntity<List<Book>> getAllBooks(@RequestParam(required = false) Map<String, String> filters) {
        try {
            return ResponseEntity.ok(libraryService.getAllBooks(filters));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==========================================
    // Member Endpoints
    // ==========================================

    @GetMapping("/members/{id}")
    public ResponseEntity<LibraryMember> getMember(@PathVariable String id) {
        try {
            LibraryMember member = libraryService.getMember(id);
            if (member == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(member);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ==========================================
    // Circulation Endpoints
    // ==========================================

    @PostMapping("/issue")
    public ResponseEntity<?> issueBook(@RequestBody Map<String, String> request) {
        try {
            String memberId = request.get("member_id");
            String copyId = request.get("copy_id");
            BookIssue issue = libraryService.issueBook(memberId, copyId);
            return ResponseEntity.ok(issue);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error processing issue: " + e.getMessage());
        }
    }

    @PostMapping("/return")
    public ResponseEntity<?> returnBook(@RequestBody Map<String, String> request) {
        try {
            String copyId = request.get("copy_id");
            BookIssue issue = libraryService.returnBook(copyId);
            return ResponseEntity.ok(issue);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error processing return: " + e.getMessage());
        }
    }
}
