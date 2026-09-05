package com.kidneycare.controller;

import com.kidneycare.dto.request.ResearchSubmissionRequest;
import com.kidneycare.service.ResearchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Public endpoint — no JWT required.
 * Handles Dataset B (college research) submissions.
 */
@RestController
@RequestMapping("/api/research")
@RequiredArgsConstructor
public class ResearchController {

    private final ResearchService researchService;

    @PostMapping("/responses")
    public ResponseEntity<Map<String, String>> submitResponse(
            @Valid @RequestBody ResearchSubmissionRequest request) {
        researchService.submitResponse(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("message", "Research response submitted successfully"));
    }

    @GetMapping("/analytics")
    public ResponseEntity<com.kidneycare.dto.response.ResearchAnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(researchService.getAnalytics());
    }
}
