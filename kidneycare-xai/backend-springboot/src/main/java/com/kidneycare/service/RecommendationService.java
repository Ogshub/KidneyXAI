package com.kidneycare.service;

import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.dto.response.RecommendationResponse;
import com.kidneycare.entity.*;
import com.kidneycare.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * RecommendationService — transparent rule-based engine.
 * Never calls the ML service itself; only reasons over data
 * handed to it by AssessmentService.
 *
 * Each recommendation stores: trigger, category, text, priority, source.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;

    /**
     * Generate recommendations for an assessment based on:
     * - Health profile (diabetes, hypertension, smoking, painkillers, etc.)
     * - Latest daily activity (if available)
     * - SHAP top features (from ML prediction)
     */
    @Transactional
    public List<RecommendationResponse> generateFor(
            Assessment assessment,
            HealthProfile healthProfile,
            Activity latestActivity,
            List<MlPredictionResponse.MlFeatureExplanation> shapExplanations
    ) {
        List<Recommendation> recommendations = new ArrayList<>();

        // ── Rules based on Health Profile ──
        if (healthProfile != null) {
            if ("Yes".equalsIgnoreCase(healthProfile.getHypertension())) {
                recommendations.add(buildRecommendation(assessment,
                        "Medical", "Hypertension = Yes",
                        "Regular blood pressure monitoring is important. Consider discussing a monitoring plan with your healthcare provider.",
                        "High", "WHO Hypertension Guidelines"));
            }

            if ("Yes".equalsIgnoreCase(healthProfile.getDiabetes())) {
                recommendations.add(buildRecommendation(assessment,
                        "Medical", "Diabetes = Yes",
                        "Regular blood glucose monitoring is recommended. Maintaining stable blood sugar levels supports kidney health.",
                        "High", "National Kidney Foundation"));
            }

            if ("Frequently".equalsIgnoreCase(healthProfile.getPainkillerUsage())) {
                recommendations.add(buildRecommendation(assessment,
                        "Medical", "Painkiller usage = Frequently",
                        "Frequent use of certain painkillers may affect kidney function. Consider discussing your medication use with a healthcare professional.",
                        "High", "National Kidney Foundation"));
            }

            if ("Regular".equalsIgnoreCase(healthProfile.getSmoking()) ||
                "Occasional".equalsIgnoreCase(healthProfile.getSmoking())) {
                recommendations.add(buildRecommendation(assessment,
                        "Lifestyle", "Smoking = " + healthProfile.getSmoking(),
                        "Smoking can damage blood vessels and reduce blood flow to the kidneys. Consider seeking support for smoking cessation.",
                        "High", "American Kidney Fund"));
            }

            if ("Weekly".equalsIgnoreCase(healthProfile.getAlcohol())) {
                recommendations.add(buildRecommendation(assessment,
                        "Lifestyle", "Alcohol = Weekly",
                        "Excessive alcohol consumption can affect kidney function. Consider moderating alcohol intake.",
                        "Medium", "National Kidney Foundation"));
            }
        }

        // ── Rules based on Latest Activity ──
        if (latestActivity != null) {
            if (latestActivity.getWaterIntakeLiters() != null &&
                latestActivity.getWaterIntakeLiters() < 1.5) {
                recommendations.add(buildRecommendation(assessment,
                        "Hydration", "Water intake = " + latestActivity.getWaterIntakeLiters() + " L",
                        "Adequate hydration supports kidney function. Aim for at least 1.5–2.0 liters of water per day, adjusted for activity level and climate.",
                        "Medium", "European Food Safety Authority"));
            }

            if (latestActivity.getExerciseMinutes() != null &&
                latestActivity.getExerciseMinutes() < 20) {
                recommendations.add(buildRecommendation(assessment,
                        "Exercise", "Exercise = " + latestActivity.getExerciseMinutes() + " min today",
                        "Regular physical activity supports cardiovascular and kidney health. The WHO recommends at least 150 minutes of moderate activity per week.",
                        "Medium", "WHO Physical Activity Guidelines"));
            }

            if (latestActivity.getSleepHours() != null &&
                latestActivity.getSleepHours() < 6.0) {
                recommendations.add(buildRecommendation(assessment,
                        "Sleep", "Sleep = " + latestActivity.getSleepHours() + " hours",
                        "Adequate sleep (7–8 hours) supports overall health including kidney function. Consider establishing a regular sleep schedule.",
                        "Low", "National Sleep Foundation"));
            }

            if ("High".equalsIgnoreCase(latestActivity.getSaltLevel())) {
                recommendations.add(buildRecommendation(assessment,
                        "Diet", "Salt/processed food level = High",
                        "Consider reducing frequent consumption of highly processed and salty foods. High sodium intake can contribute to elevated blood pressure.",
                        "Medium", "WHO Sodium Reduction Guidelines"));
            }

            if (latestActivity.getFastFood() != null && latestActivity.getFastFood()) {
                recommendations.add(buildRecommendation(assessment,
                        "Diet", "Fast food = Yes (today)",
                        "Regular fast food consumption may increase sodium and unhealthy fat intake. Consider balancing with home-prepared meals rich in fruits and vegetables.",
                        "Low", "Dietary Guidelines Advisory Committee"));
            }

            if ("High".equalsIgnoreCase(latestActivity.getStressLevel())) {
                recommendations.add(buildRecommendation(assessment,
                        "Wellbeing", "Stress level = High",
                        "Chronic stress can affect blood pressure and overall health. Consider stress management techniques such as regular exercise, adequate sleep, or mindfulness practices.",
                        "Medium", "American Heart Association"));
            }
        }

        // Save all recommendations
        List<Recommendation> saved = recommendationRepository.saveAll(recommendations);

        return saved.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByAssessment(Long assessmentId) {
        return recommendationRepository.findByAssessmentIdOrderByPriorityDesc(assessmentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByUser(Long userId) {
        List<RecommendationResponse> list = recommendationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        if (list.isEmpty()) {
            return getDefaultRecommendations();
        }
        return list;
    }

    private List<RecommendationResponse> getDefaultRecommendations() {
        return List.of(
                RecommendationResponse.builder()
                        .id(-1L)
                        .category("Hydration")
                        .triggerReason("Baseline Preventive Care")
                        .recommendation("Adequate daily hydration supports your kidneys in clearing sodium and urea. Aim for 1.5–2.0 liters of water daily.")
                        .priority("Routine")
                        .source("European Food Safety Authority & KDIGO")
                        .build(),
                RecommendationResponse.builder()
                        .id(-2L)
                        .category("Diet")
                        .triggerReason("Baseline Preventive Care")
                        .recommendation("Keep daily sodium intake under 2,000 mg (about 1 teaspoon of salt) to regulate blood pressure and protect glomerular filters.")
                        .priority("Medium")
                        .source("WHO & American Heart Association")
                        .build(),
                RecommendationResponse.builder()
                        .id(-3L)
                        .category("Medical")
                        .triggerReason("Baseline Preventive Care")
                        .recommendation("Exercise caution with regular over-the-counter NSAID painkillers (e.g. ibuprofen, naproxen), which can reduce renal blood flow.")
                        .priority("High")
                        .source("National Kidney Foundation")
                        .build(),
                RecommendationResponse.builder()
                        .id(-4L)
                        .category("Lifestyle")
                        .triggerReason("Baseline Preventive Care")
                        .recommendation("Schedule periodic resting blood pressure checks. Early hypertension is the second leading cause of undetected kidney disease.")
                        .priority("Medium")
                        .source("WHO Hypertension Guidelines")
                        .build(),
                RecommendationResponse.builder()
                        .id(-5L)
                        .category("Exercise")
                        .triggerReason("Baseline Preventive Care")
                        .recommendation("Aim for 150 minutes of moderate activity weekly (e.g. brisk walking) to improve vascular elasticity and renal perfusion.")
                        .priority("Routine")
                        .source("WHO Physical Activity Guidelines")
                        .build()
        );
    }

    private Recommendation buildRecommendation(Assessment assessment,
                                                String category,
                                                String trigger,
                                                String text,
                                                String priority,
                                                String source) {
        return Recommendation.builder()
                .assessment(assessment)
                .category(category)
                .triggerReason(trigger)
                .recommendation(text)
                .priority(priority)
                .source(source)
                .build();
    }

    private RecommendationResponse mapToResponse(Recommendation r) {
        return RecommendationResponse.builder()
                .id(r.getId())
                .category(r.getCategory())
                .triggerReason(r.getTriggerReason())
                .recommendation(r.getRecommendation())
                .priority(r.getPriority())
                .source(r.getSource())
                .build();
    }
}
