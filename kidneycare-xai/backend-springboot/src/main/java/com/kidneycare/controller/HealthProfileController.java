package com.kidneycare.controller;

import com.kidneycare.dto.request.HealthProfileRequest;
import com.kidneycare.dto.response.HealthProfileResponse;
import com.kidneycare.service.HealthProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/health-profile")
@RequiredArgsConstructor
public class HealthProfileController {

    private final HealthProfileService healthProfileService;

    @GetMapping
    public ResponseEntity<HealthProfileResponse> getHealthProfile(Authentication auth) {
        return ResponseEntity.ok(healthProfileService.getHealthProfile(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<HealthProfileResponse> updateHealthProfile(
            Authentication auth,
            @RequestBody HealthProfileRequest request) {
        return ResponseEntity.ok(healthProfileService.updateHealthProfile(auth.getName(), request));
    }
}
