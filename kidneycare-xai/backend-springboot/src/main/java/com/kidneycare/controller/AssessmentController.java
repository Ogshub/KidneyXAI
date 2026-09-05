package com.kidneycare.controller;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.AssessmentResponse;
import com.kidneycare.service.AssessmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assessments")
@RequiredArgsConstructor
public class AssessmentController {

    private final AssessmentService assessmentService;

    @PostMapping
    public ResponseEntity<AssessmentResponse> createAssessment(
            Authentication auth,
            @Valid @RequestBody AssessmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assessmentService.createAssessment(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<AssessmentResponse>> getAssessments(Authentication auth) {
        return ResponseEntity.ok(assessmentService.getAssessments(auth.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssessmentResponse> getAssessment(
            Authentication auth,
            @PathVariable Long id) {
        return ResponseEntity.ok(assessmentService.getAssessment(auth.getName(), id));
    }

    @GetMapping("/model-evaluation")
    public ResponseEntity<java.util.Map<String, Object>> getModelEvaluation() {
        return ResponseEntity.ok(assessmentService.getModelEvaluation());
    }
}
