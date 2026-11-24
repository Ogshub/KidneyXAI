package com.kidneycare.service;

import com.kidneycare.dto.response.*;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.AssessmentRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/** Internal, owner-scoped context access for application services. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PatientContextService {
    private final HealthProfileService healthProfiles;
    private final MedicalRecordService records;
    private final ActivityService activities;
    private final AssessmentService assessments;
    private final RecommendationService recommendations;
    private final AssessmentRepository assessmentRepository;
    private final UserRepository users;

    public Optional<HealthProfileResponse> healthProfile(String email) {
        try {
            return Optional.of(healthProfiles.getHealthProfile(email));
        } catch (ResourceNotFoundException ex) {
            return Optional.empty();
        }
    }

    public Optional<MedicalReportResponse> latestReport(String email) {
        return records.latestReport(email);
    }

    public List<LabResultResponse> laboratoryHistory(String email, String parameter, int limit) {
        return records.history(email, parameter, limit);
    }

    public Map<String, LabResultResponse> latestMeasurements(String email) {
        return records.latestMeasurements(email);
    }

    public MedicalRecordService.Comparison compareReports(String email, long a, long b) {
        return records.compare(email, a, b);
    }

    public ActivitySummaryResponse lifestyleSummary(String email, String period, LocalDate date) {
        return activities.getSummary(email, period, date);
    }

    public Optional<AssessmentResponse> latestAssessment(String email) {
        return assessmentRepository.findLatestByUserId(userId(email))
                .map(assessment -> assessments.getAssessment(email, assessment.getId()));
    }

    public List<RecommendationResponse> educationalRecommendations(String email) {
        return recommendations.getRecommendationsByUser(userId(email));
    }

    private long userId(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Account", "principal", "current")).getId();
    }
}
