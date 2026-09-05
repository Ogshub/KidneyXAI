package com.kidneycare.controller;

import com.kidneycare.dto.response.RecommendationResponse;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.UserRepository;
import com.kidneycare.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<RecommendationResponse>> getRecommendations(
            Authentication auth,
            @RequestParam(required = false) Long assessmentId) {
        if (assessmentId != null) {
            return ResponseEntity.ok(
                    recommendationService.getRecommendationsByAssessment(assessmentId));
        }

        User user = userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", auth.getName()));
        return ResponseEntity.ok(
                recommendationService.getRecommendationsByUser(user.getId()));
    }
}
