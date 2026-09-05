package com.kidneycare.service;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.AssessmentResponse;
import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.dto.response.RecommendationResponse;
import com.kidneycare.entity.*;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AssessmentService — the core orchestrator for risk assessment.
 * - The only module allowed to call MlService
 * - Always writes assessment+features BEFORE invoking RecommendationService
 * - Enforces: "ML predicts / SHAP explains / Rules recommend"
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssessmentService {

    private final MlService mlService;
    private final RecommendationService recommendationService;
    private final AssessmentRepository assessmentRepository;
    private final AssessmentFeatureRepository assessmentFeatureRepository;
    private final HealthProfileRepository healthProfileRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public AssessmentResponse createAssessment(String email, AssessmentRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // 1. Call ML service (predict + SHAP)
        MlPredictionResponse mlResponse = mlService.predict(request);

        // 2. Determine risk category
        String riskCategory = determineRiskCategory(mlResponse.getRiskScore());

        // 3. Save assessment
        Assessment assessment = Assessment.builder()
                .user(user)
                .riskScore(mlResponse.getRiskScore())
                .riskCategory(riskCategory)
                .prediction(mlResponse.getPrediction())
                .modelVersion(mlResponse.getModelVersion())
                .build();

        assessment = assessmentRepository.save(assessment);

        // 4. Save SHAP features
        final Assessment savedAssessment = assessment;
        if (mlResponse.getExplanations() != null) {
            List<AssessmentFeature> features = mlResponse.getExplanations().stream()
                    .map(exp -> AssessmentFeature.builder()
                            .assessment(savedAssessment)
                            .featureName(exp.getFeature())
                            .featureValue(exp.getValue() != null ? exp.getValue() : 0.0)
                            .shapValue(exp.getShapValue() != null ? exp.getShapValue() : 0.0)
                            .build())
                    .collect(Collectors.toList());
            assessmentFeatureRepository.saveAll(features);
        }

        // 5. Generate recommendations (failure here doesn't block assessment result)
        List<RecommendationResponse> recommendationResponses;
        try {
            var healthProfile = healthProfileRepository.findByUserId(user.getId()).orElse(null);
            var latestActivity = activityRepository
                    .findByUserIdAndActivityDate(user.getId(), java.time.LocalDate.now())
                    .orElse(null);

            recommendationResponses = recommendationService.generateFor(
                    savedAssessment, healthProfile, latestActivity, mlResponse.getExplanations()
            );
        } catch (Exception e) {
            log.error("Recommendation generation failed for assessment {}: {}",
                    savedAssessment.getId(), e.getMessage());
            recommendationResponses = List.of();
        }

        // 6. Build response
        return buildResponse(savedAssessment, mlResponse, recommendationResponses);
    }

    public List<AssessmentResponse> getAssessments(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return assessmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AssessmentResponse getAssessment(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Assessment assessment = assessmentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));

        return mapToResponse(assessment);
    }

    public java.util.Map<String, Object> getModelEvaluation() {
        return mlService.getModelEvaluation();
    }

    /**
     * Determine risk category from risk score.
     * These thresholds will be refined after model calibration analysis.
     */
    private String determineRiskCategory(Double riskScore) {
        if (riskScore == null) return "Unknown";
        if (riskScore >= 0.7) return "High";
        if (riskScore >= 0.4) return "Moderate";
        return "Low";
    }

    private AssessmentResponse buildResponse(Assessment assessment,
                                              MlPredictionResponse mlResponse,
                                              List<RecommendationResponse> recommendations) {
        List<AssessmentResponse.FeatureExplanationDto> explanations = null;
        if (mlResponse.getExplanations() != null) {
            explanations = mlResponse.getExplanations().stream()
                    .map(e -> AssessmentResponse.FeatureExplanationDto.builder()
                            .feature(e.getFeature())
                            .value(e.getValue())
                            .shapValue(e.getShapValue())
                            .build())
                    .collect(Collectors.toList());
        }

        return AssessmentResponse.builder()
                .id(assessment.getId())
                .riskScore(assessment.getRiskScore())
                .riskCategory(assessment.getRiskCategory())
                .prediction(assessment.getPrediction())
                .modelVersion(assessment.getModelVersion())
                .createdAt(assessment.getCreatedAt())
                .explanations(explanations)
                .recommendations(recommendations)
                .build();
    }

    private AssessmentResponse mapToResponse(Assessment assessment) {
        List<AssessmentResponse.FeatureExplanationDto> explanations =
                assessmentFeatureRepository.findByAssessmentIdOrderByShapValueDesc(assessment.getId())
                        .stream()
                        .map(f -> AssessmentResponse.FeatureExplanationDto.builder()
                                .feature(f.getFeatureName())
                                .value(f.getFeatureValue())
                                .shapValue(f.getShapValue())
                                .build())
                        .collect(Collectors.toList());

        return AssessmentResponse.builder()
                .id(assessment.getId())
                .riskScore(assessment.getRiskScore())
                .riskCategory(assessment.getRiskCategory())
                .prediction(assessment.getPrediction())
                .modelVersion(assessment.getModelVersion())
                .createdAt(assessment.getCreatedAt())
                .explanations(explanations)
                .build();
    }
}
