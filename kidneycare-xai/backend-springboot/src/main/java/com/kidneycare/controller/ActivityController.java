package com.kidneycare.controller;

import com.kidneycare.dto.request.ActivityRequest;
import com.kidneycare.dto.response.ActivityResponse;
import com.kidneycare.service.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @PostMapping
    public ResponseEntity<ActivityResponse> saveActivity(
            Authentication auth,
            @Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(activityService.saveActivity(auth.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<ActivityResponse>> getActivities(
            Authentication auth,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(activityService.getActivities(auth.getName(), from, to));
    }
}
