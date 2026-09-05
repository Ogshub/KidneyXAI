# Step 18: Spring Boot Backend — Assessment, Activity, Dashboard & Research Services

## 1. Overview & Objective
In this step, we implement the primary orchestrating services in package `com.kidneycare.service`:
1. `AssessmentService`: The central pipeline orchestrator. Executes:
   - Calling Python ML for prediction & local SHAP values.
   - Categorizing risk score into defensible medical thresholds (`Low`: $<0.3$, `Moderate`: $0.3–0.6$, `High`: $>0.6$).
   - Persisting the assessment and its individual SHAP feature records.
   - Passing assessment results and patient habits to `RecommendationService`.
2. `ActivityService`: Handles daily habit logging, updating existing date entries (UPSERT), and range querying (7-day and 30-day slices).
3. `DashboardService`: A dedicated read-only aggregator assembling current risk, today's log, 30-day lifestyle trend, top 5 SHAP risk contributors, and recent recommendations into a single response.
4. `ResearchService`: Anonymously persists research survey submissions (Dataset B) with participant ID auto-generation (`P001`, `P002`, ...).

---

## 2. Prerequisites
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md`
- Completed `11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md`
- Completed `15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md`
- Completed `16_BACKEND_AUTH_AND_PROFILE_SERVICES.md`
- Completed `17_BACKEND_ML_CLIENT_AND_CLINICAL_RECOMMENDATION_ENGINE.md`

---

## 3. Why This Is Created Now
1. **Architectural Purity**:
   - `DashboardService` NEVER writes data. It only aggregates across multiple repositories to prevent side-effects during dashboard page refreshes.
   - `AssessmentService` isolates the exact transaction sequence: **ML predicts $\rightarrow$ SHAP explains $\rightarrow$ Rules recommend**.
2. **Defensible Risk Categorization**: Instead of arbitrary numbers, clinical thresholds are defined systematically in `determineRiskCategory()`.

---

## 4. Service Implementations

### 4.1 `AssessmentService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/AssessmentService.java`
```java
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

        // 5. Generate recommendations
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

        return buildAssessmentResponse(savedAssessment, mlResponse, recommendationResponses);
    }

    public List<AssessmentResponse> getAssessmentHistory(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return assessmentRepository.findByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponseWithFeatures)
                .collect(Collectors.toList());
    }

    public AssessmentResponse getAssessmentById(String email, Long id) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Assessment assessment = assessmentRepository.findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Assessment", "id", id));

        return mapToResponseWithFeatures(assessment);
    }

    private String determineRiskCategory(Double score) {
        if (score == null) return "Unknown";
        if (score < 0.30) return "Low";
        if (score < 0.60) return "Moderate";
        return "High";
    }

    private AssessmentResponse buildAssessmentResponse(
            Assessment assessment,
            MlPredictionResponse mlResponse,
            List<RecommendationResponse> recommendations
    ) {
        List<AssessmentResponse.FeatureExplanationDto> explanations = mlResponse.getExplanations() != null
                ? mlResponse.getExplanations().stream()
                .map(e -> AssessmentResponse.FeatureExplanationDto.builder()
                        .feature(e.getFeature())
                        .value(e.getValue())
                        .shapValue(e.getShapValue())
                        .build())
                .collect(Collectors.toList())
                : List.of();

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

    private AssessmentResponse mapToResponseWithFeatures(Assessment assessment) {
        List<AssessmentResponse.FeatureExplanationDto> explanations =
                assessmentFeatureRepository.findByAssessmentIdOrderByShapValueDesc(assessment.getId())
                        .stream()
                        .map(f -> AssessmentResponse.FeatureExplanationDto.builder()
                                .feature(f.getFeatureName())
                                .value(f.getFeatureValue())
                                .shapValue(f.getShapValue())
                                .build())
                        .collect(Collectors.toList());

        List<RecommendationResponse> recommendations =
                recommendationService.getRecommendationsByAssessment(assessment.getId());

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
}
```

---

### 4.2 `ActivityService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/ActivityService.java`
```java
package com.kidneycare.service;

import com.kidneycare.dto.request.ActivityRequest;
import com.kidneycare.dto.response.ActivityResponse;
import com.kidneycare.entity.Activity;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.ActivityRepository;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public ActivityResponse logActivity(String email, ActivityRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        Activity activity = activityRepository
                .findByUserIdAndActivityDate(user.getId(), request.getActivityDate())
                .orElseGet(() -> Activity.builder()
                        .user(user)
                        .activityDate(request.getActivityDate())
                        .build());

        activity.setWaterIntakeLiters(request.getWaterIntakeLiters());
        activity.setExerciseMinutes(request.getExerciseMinutes());
        activity.setSleepHours(request.getSleepHours());
        activity.setSaltLevel(request.getSaltLevel());
        activity.setFastFood(request.getFastFood() != null ? request.getFastFood() : false);
        activity.setSugaryDrinks(request.getSugaryDrinks() != null ? request.getSugaryDrinks() : 0);
        activity.setSmoking(request.getSmoking() != null ? request.getSmoking() : false);
        activity.setAlcohol(request.getAlcohol() != null ? request.getAlcohol() : false);
        activity.setWeightKg(request.getWeightKg());
        activity.setStressLevel(request.getStressLevel());

        activity = activityRepository.save(activity);
        return mapToResponse(activity);
    }

    public ActivityResponse getActivityByDate(String email, LocalDate date) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return activityRepository.findByUserIdAndActivityDate(user.getId(), date)
                .map(this::mapToResponse)
                .orElse(null);
    }

    public List<ActivityResponse> getActivities(String email, LocalDate from, LocalDate to) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return activityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(user.getId(), from, to)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private ActivityResponse mapToResponse(Activity a) {
        return ActivityResponse.builder()
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
                .build();
    }
}
```

---

### 4.3 `DashboardService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/DashboardService.java`
```java
package com.kidneycare.service;

import com.kidneycare.dto.response.*;
import com.kidneycare.entity.User;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.*;
import com.kidneycare.util.LifestyleScoreCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

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

        // 1. Latest Assessment
        assessmentRepository.findLatestByUserId(userId).ifPresent(a -> {
            dashboard.currentRiskScore(a.getRiskScore())
                    .currentRiskCategory(a.getRiskCategory())
                    .prediction(a.getPrediction())
                    .lastAssessmentDate(a.getCreatedAt());

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

        // 2. Today's Activity
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

        // 3. Activity Trend (last 30 days)
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

        // 4. Lifestyle Score (last 7 days)
        LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
        var last7Days = activityRepository
                .findByUserIdAndActivityDateBetweenOrderByActivityDateAsc(userId, sevenDaysAgo, LocalDate.now());
        dashboard.lifestyleScore(LifestyleScoreCalculator.calculate(last7Days));

        // 5. Recent Recommendations (up to 3)
        List<RecommendationResponse> recentRecs = recommendationRepository.findRecentByUserId(userId, 3)
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

        // 6. Risk History Points
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

        return dashboard.build();
    }
}
```

---

### 4.4 `ResearchService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/ResearchService.java`
```java
package com.kidneycare.service;

import com.kidneycare.dto.request.ResearchSubmissionRequest;
import com.kidneycare.entity.ResearchResponse;
import com.kidneycare.repository.ResearchResponseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class ResearchService {

    private final ResearchResponseRepository researchResponseRepository;

    @Transactional
    public Map<String, Object> submitResponse(ResearchSubmissionRequest request) {
        long count = researchResponseRepository.count() + 1;
        String participantId = request.getParticipantId() != null && !request.getParticipantId().isBlank()
                ? request.getParticipantId()
                : String.format("P%03d", count);

        ResearchResponse response = ResearchResponse.builder()
                .participantId(participantId)
                .role(request.getRole())
                .ageGroup(request.getAgeGroup())
                .gender(request.getGender())
                .diabetes(request.getDiabetes())
                .hypertension(request.getHypertension())
                .familyHistory(request.getFamilyHistory())
                .painkillerUsage(request.getPainkillerUsage())
                .waterIntake(request.getWaterIntake())
                .exercise(request.getExercise())
                .sleepHours(request.getSleepHours())
                .saltyProcessed(request.getSaltyProcessed())
                .fastFood(request.getFastFood())
                .sugaryDrinks(request.getSugaryDrinks())
                .smoking(request.getSmoking())
                .alcohol(request.getAlcohol())
                .awareEarlySymptoms(request.getAwareEarlySymptoms())
                .awareRiskFactors(request.getAwareRiskFactors())
                .monitorsBp(request.getMonitorsBp())
                .receivedKidneyInfo(request.getReceivedKidneyInfo())
                .build();

        researchResponseRepository.save(response);

        return Map.of(
                "status", "success",
                "participantId", participantId,
                "message", "Research survey submitted successfully"
        );
    }
}
```

---

## 5. Verification
Compile all services:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`19_BACKEND_REST_CONTROLLERS_API_LAYER.md`** to create the 8 REST controllers exposing these services to HTTP clients.
