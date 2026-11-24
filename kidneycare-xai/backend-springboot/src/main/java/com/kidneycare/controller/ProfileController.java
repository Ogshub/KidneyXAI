package com.kidneycare.controller;

import com.kidneycare.dto.request.ProfileUpdateRequest;
import com.kidneycare.dto.response.ProfileResponse;
import com.kidneycare.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(Authentication auth,
            @Valid @RequestBody com.kidneycare.dto.request.AccountDeletionRequest request) {
        profileService.deleteAccount(auth.getName(), request.password());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(profileService.getProfile(auth.getName()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            Authentication auth,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(auth.getName(), request));
    }
}
