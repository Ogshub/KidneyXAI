package com.kidneycare.service;

import com.kidneycare.dto.response.*;
import com.kidneycare.entity.*;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.*;
import com.kidneycare.util.LifestyleScoreCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DashboardService — read-only aggregator across three repositories.
 * NEVER writes to any table. If it starts writing, dashboard logic
 * has leaked into the wrong layer.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final AssessmentRepository assessmentRepository;
    private final AssessmentFeatureRepository assessmentFeatureRepository;
    private final ActivityRepository activityRepository;
    private final RecommendationRepository recommendationRepository;
    private final UserRepository userRepository;

    public DashboardResponse getDashboard(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Long userId = user.getId();
        DashboardResponse.DashboardResponseBuilder dashboard = DashboardResponse.builder();

        // ── Latest Assessment ──
        assessmentRepository.findLatestByUserId(userId).ifPresent(a -> {
            dashboard.currentRiskScore(a.getRiskScore())
                    .currentRiskCategory(a.getRiskCategory())
                    .prediction(a.getPrediction())
                    .lastAssessmentDate(a.getCreatedAt());

            // Top SHAP contributors
            List<AssessmentResponse.FeatureExplanationDto> topContributors =
                    assessmentFeatureRepository.findByAssessmentIdOrderByShapValueDesc(a.getId())
                            .stream()
                            .limit(5)
                            .map(f -> AssessmentResponse.FeatureExplanationDto.builder()
                                    .feature(f.getFeatureName())
                                    .value(f.getFeatureValue())
                                    .shapValue(f.getShapValue())
                                    .build())
                            .collect(Collectors.toList());
            dashboard.topContributors(topContributors);
        });

        // ── Today's Activity ──
        activityRepository.findByUserIdAndActivityDate(userId, LocalDate.now())
                .ifPresent(a -> dashboard.todayActivity(ActivityResponse.builder()
                        .id(a.getId())
                        .activityDate(a.getActivityDate())
                        .waterIntakeLiters(a.getWaterIntakeLiters())
                        .exerciseMinutes(a.getExerciseMinutes())
                        .sleepHours(a.getSleepHours())
                        .saltLevel(a.getSaltLevel())
                        .fastFood(a.getFastFood())
                        .sugaryDrinks(a.getSugaryDrinks())
                        .smoking(a.getSmoking())
                        .alcohol(a.getAlcohol())
                        .weightKg(a.getWeightKg())
                        .stressLevel(a.getStressLevel())
                        .build()));

        // ── Activity Trend (last 30 days) ──
        LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
        List<ActivityResponse> activityTrend = activityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(userId, thirtyDaysAgo, LocalDate.now())
                .stream()
                .map(a -> ActivityResponse.builder()
                        .activityDate(a.getActivityDate())
                        .waterIntakeLiters(a.getWaterIntakeLiters())
                        .exerciseMinutes(a.getExerciseMinutes())
                        .sleepHours(a.getSleepHours())
                        .weightKg(a.getWeightKg())
                        .build())
                .collect(Collectors.toList());
        dashboard.activityTrend(activityTrend);

        // ── Lifestyle Score ──
        List<Activity> recentActivities = activityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(userId,
                        LocalDate.now().minusDays(7), LocalDate.now());
        dashboard.lifestyleScore(LifestyleScoreCalculator.calculate(recentActivities));

        // ── Risk History ──
        List<DashboardResponse.RiskHistoryPoint> riskHistory = assessmentRepository
                .findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(a -> DashboardResponse.RiskHistoryPoint.builder()
                        .date(a.getCreatedAt().toLocalDate())
                        .riskScore(a.getRiskScore())
                        .riskCategory(a.getRiskCategory())
                        .build())
                .collect(Collectors.toList());
        dashboard.riskHistory(riskHistory);

        // ── Recent Recommendations ──
        List<RecommendationResponse> recentRecs = recommendationRepository
                .findRecentByUserId(userId, 5)
                .stream()
                .map(r -> RecommendationResponse.builder()
                        .id(r.getId())
                        .category(r.getCategory())
                        .triggerReason(r.getTriggerReason())
                        .recommendation(r.getRecommendation())
                        .priority(r.getPriority())
                        .source(r.getSource())
                        .build())
                .collect(Collectors.toList());
        dashboard.recentRecommendations(recentRecs);

        return dashboard.build();
    }
}
