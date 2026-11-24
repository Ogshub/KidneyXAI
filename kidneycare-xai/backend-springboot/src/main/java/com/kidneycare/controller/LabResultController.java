package com.kidneycare.controller;

import com.kidneycare.dto.response.LabResultResponse;
import com.kidneycare.service.LabParameterRegistry;
import com.kidneycare.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lab-results")
@RequiredArgsConstructor
public class LabResultController {
    private final MedicalRecordService records;
    private final LabParameterRegistry registry;

    @GetMapping
    public List<LabResultResponse> history(Authentication auth, @RequestParam String parameter,
                                           @RequestParam(defaultValue = "100") int limit) {
        return records.history(auth.getName(), parameter, limit);
    }

    @GetMapping("/parameters")
    public List<LabParameterRegistry.Parameter> parameters() {
        return registry.all();
    }

    @GetMapping("/compare")
    public MedicalRecordService.Comparison compare(Authentication auth, @RequestParam long a, @RequestParam long b) {
        return records.compare(auth.getName(), a, b);
    }

    @GetMapping("/assessment-inputs")
    public Map<String, LabResultResponse> assessmentInputs(Authentication auth) {
        return records.assessmentInputs(auth.getName());
    }
}
