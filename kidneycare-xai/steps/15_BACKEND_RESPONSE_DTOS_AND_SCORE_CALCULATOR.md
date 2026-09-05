# Step 15: Spring Boot Backend — Response DTOs & Lifestyle Score Calculator

## 1. Overview & Objective
In this step, we implement the 8 Response DTO classes in package `com.kidneycare.dto.response` and the lifestyle scoring engine in `com.kidneycare.util.LifestyleScoreCalculator`:
1. `AuthResponse`: JWT token, user ID, name, email.
2. `HealthProfileResponse`: User's saved clinical profile attributes with computed BMI.
3. `MlPredictionResponse`: Intermediate deserialization DTO mapping Python FastAPI's JSON payload.
4. `AssessmentResponse`: The client-facing assessment outcome (`riskScore`, `riskCategory`, `prediction`, `modelVersion`, `explanations[]`, `recommendations[]`).
5. `ActivityResponse`: Serialized daily lifestyle log.
6. `RecommendationResponse`: Traceable clinical recommendation card (`category`, `triggerReason`, `recommendation`, `priority`, `source`).
7. `DashboardResponse`: High-level aggregated payload powering the main dashboard in a single network request.
8. `ProfileResponse`: User profile summary.
9. `LifestyleScoreCalculator`: Deterministic algorithm scoring user lifestyle adherence ($0–100$).

---

## 2. Prerequisites
- Completed `04_ML_SERVICE_PYDANTIC_SCHEMAS.md` (keys must match `MlPredictionResponse`)
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md`
- Completed `14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md`

---

## 3. Why This Is Created Now
1. **Aggregated Dashboard Performance**: Instead of making 6 round-trips from the React browser (latest assessment, lifestyle score, today's log, SHAP features, recommendations, trend history), `DashboardResponse` aggregates all dashboard widgets into a single fast JSON response.
2. **Deterministic Lifestyle Scoring**: `LifestyleScoreCalculator` provides positive reinforcement based on daily logged habits (water intake $\ge 2.0\text{L}$, exercise $\ge 30\text{ min}$, sleep $7–8\text{ hrs}$, low salt, no tobacco/alcohol).

---

## 4. Key DTO & Utility Implementations

### 4.1 `LifestyleScoreCalculator.java`
Path: `backend-springboot/src/main/java/com/kidneycare/util/LifestyleScoreCalculator.java`
```java
package com.kidneycare.util;

import com.kidneycare.entity.Activity;
import java.util.List;

/**
 * Calculates the Lifestyle Progress Score (0–100).
 * Application metric based on logged user behavioral adherence.
 */
public class LifestyleScoreCalculator {

    private LifestyleScoreCalculator() {}

    public static int calculate(List<Activity> recentActivities) {
        if (recentActivities == null || recentActivities.isEmpty()) {
            return 0;
        }

        double totalScore = 0;
        int dayCount = recentActivities.size();

        for (Activity activity : recentActivities) {
            double dayScore = 0;

            // Water: target >= 2.0 L (15 points)
            if (activity.getWaterIntakeLiters() != null) {
                dayScore += Math.min(activity.getWaterIntakeLiters() / 2.0 * 15, 15);
            }

            // Exercise: target >= 30 min/day (20 points)
            if (activity.getExerciseMinutes() != null) {
                dayScore += Math.min(activity.getExerciseMinutes() / 30.0 * 20, 20);
            }

            // Sleep: target 7–8 hours (15 points)
            if (activity.getSleepHours() != null) {
                if (activity.getSleepHours() >= 7 && activity.getSleepHours() <= 8) {
                    dayScore += 15;
                } else if (activity.getSleepHours() >= 6 && activity.getSleepHours() <= 9) {
                    dayScore += 10;
                } else {
                    dayScore += 5;
                }
            }

            // Tobacco abstinence (10 points)
            if (activity.getSmoking() != null && !activity.getSmoking()) {
                dayScore += 10;
            }

            // Alcohol abstinence (10 points)
            if (activity.getAlcohol() != null && !activity.getAlcohol()) {
                dayScore += 10;
            }

            // Low dietary sodium (10 points)
            if (activity.getSaltLevel() != null) {
                switch (activity.getSaltLevel().toLowerCase()) {
                    case "low" -> dayScore += 10;
                    case "medium" -> dayScore += 5;
                }
            }

            // Fast food abstinence (5 points)
            if (activity.getFastFood() != null && !activity.getFastFood()) {
                dayScore += 5;
            }

            // Low sugary drinks (5 points)
            if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() == 0) {
                dayScore += 5;
            } else if (activity.getSugaryDrinks() != null && activity.getSugaryDrinks() <= 1) {
                dayScore += 2;
            }

            totalScore += dayScore;
        }

        double avgDayScore = totalScore / dayCount;
        int normalizedScore = (int) Math.round(avgDayScore / 90.0 * 100);
        return Math.min(Math.max(normalizedScore, 0), 100);
    }
}
```

---

### 4.2 `MlPredictionResponse.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/response/MlPredictionResponse.java`
```java
package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MlPredictionResponse {

    private Double riskScore;
    private String prediction;
    private List<MlFeatureExplanation> explanations;
    private String modelVersion;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MlFeatureExplanation {
        private String feature;
        private Double value;
        private Double shapValue;
    }
}
```

---

### 4.3 `AssessmentResponse.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/response/AssessmentResponse.java`
```java
package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentResponse {

    private Long id;
    private Double riskScore;
    private String riskCategory;
    private String prediction;
    private String modelVersion;
    private LocalDateTime createdAt;
    private List<FeatureExplanationDto> explanations;
    private List<RecommendationResponse> recommendations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FeatureExplanationDto {
        private String feature;
        private Double value;
        private Double shapValue;
    }
}
```

---

### 4.4 `DashboardResponse.java`
Path: `backend-springboot/src/main/java/com/kidneycare/dto/response/DashboardResponse.java`
```java
package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    private Double currentRiskScore;
    private String currentRiskCategory;
    private String prediction;
    private LocalDateTime lastAssessmentDate;
    private Integer lifestyleScore;
    private ActivityResponse todayActivity;
    private List<AssessmentResponse.FeatureExplanationDto> topContributors;
    private List<RecommendationResponse> recentRecommendations;
    private List<RiskHistoryPoint> riskHistory;
    private List<ActivityResponse> activityTrend;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskHistoryPoint {
        private LocalDate date;
        private Double riskScore;
        private String riskCategory;
    }
}
```

---

### 4.5 `AuthResponse.java`, `HealthProfileResponse.java`, `ActivityResponse.java`, `RecommendationResponse.java`, `ProfileResponse.java`
- `AuthResponse`: `{ token, userId, name, email }`
- `HealthProfileResponse`: `{ id, age, gender, heightCm, weightKg, bmi, diabetes, hypertension, familyHistory, smoking, alcohol, painkillerUsage }`
- `ActivityResponse`: `{ id, activityDate, waterIntakeLiters, exerciseMinutes, sleepHours, saltLevel, fastFood, sugaryDrinks, smoking, alcohol, weightKg, stressLevel }`
- `RecommendationResponse`: `{ id, category, triggerReason, recommendation, priority, source }`
- `ProfileResponse`: `{ id, name, email, age, gender, heightCm, weightKg, bmi }`

---

## 5. Verification
Compile all response DTOs and utilities:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`16_BACKEND_AUTH_AND_PROFILE_SERVICES.md`** to implement the business logic for authentication and profile management.
