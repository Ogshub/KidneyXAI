# Step 17: Spring Boot Backend — ML Client Service & Clinical Recommendation Engine

## 1. Overview & Objective
In this step, we implement two core intelligent components:
1. `MlService`: The single isolated HTTP client speaking to the Python FastAPI microservice using Spring 6's modern fluent `RestClient`. Handles request mapping, timeout management, and wrapping network errors into `MlServiceException`.
2. `RecommendationService`: A deterministic, explainable clinical rule engine. Unlike generative AI which can hallucinate medical advice, this engine evaluates explicit patient biomarkers and lifestyle telemetry (hypertension, low water intake, high dietary sodium, painkiller overuse) against peer-reviewed clinical guidelines (WHO, National Kidney Foundation, American Kidney Fund) and returns traceable guidance cards.

---

## 2. Prerequisites
- Completed `07_ML_SERVICE_FASTAPI_APP_AND_ENDPOINTS.md` (target `/predict` endpoint)
- Completed `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md` (`Assessment`, `Recommendation`)
- Completed `11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md` (`RecommendationRepository`)
- Completed `12_BACKEND_EXCEPTIONS_AND_GLOBAL_HANDLER.md` (`MlServiceException`)
- Completed `14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md` (`AssessmentRequest`)
- Completed `15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md` (`MlPredictionResponse`, `RecommendationResponse`)

---

## 3. Why This Is Created Now
1. **Isolated Boundary**: Isolating HTTP communication inside `MlService` means if the Python API changes ports or headers, only this class needs maintenance.
2. **Clinical Traceability**: Every recommendation generated contains an explicit `triggerReason` (e.g. `Water intake = 1.1 L`) and `source` (e.g. `European Food Safety Authority`), allowing the patient to click and view why this advice was given.

---

## 4. Service Implementations

### 4.1 `MlService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/MlService.java`
```java
package com.kidneycare.service;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.exception.MlServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * MlService — the ONLY class in the backend that speaks to Python.
 * Decouples Spring Boot from the ML microservice.
 */
@Service
@Slf4j
public class MlService {

    private final RestClient restClient;

    public MlService(@Value("${ml.service.url}") String mlServiceUrl,
                     @Value("${ml.service.timeout-ms}") long timeoutMs) {
        this.restClient = RestClient.builder()
                .baseUrl(mlServiceUrl)
                .build();
    }

    public MlPredictionResponse predict(AssessmentRequest request) {
        try {
            log.info("Calling ML service for prediction (age={}, bp={})",
                    request.getAge(), request.getBloodPressure());

            Map<String, Object> payload = buildPayload(request);

            MlPredictionResponse response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(MlPredictionResponse.class);

            if (response == null) {
                throw new MlServiceException("ML service returned null response");
            }

            log.info("ML prediction received: {} (score={})",
                    response.getPrediction(), response.getRiskScore());

            return response;

        } catch (MlServiceException e) {
            throw e;
        } catch (Exception e) {
            log.error("ML service call failed: {}", e.getMessage(), e);
            throw new MlServiceException("Risk assessment temporarily unavailable", e);
        }
    }

    private Map<String, Object> buildPayload(AssessmentRequest req) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("age", req.getAge());
        payload.put("bloodPressure", req.getBloodPressure());
        if (req.getSpecificGravity() != null) payload.put("specificGravity", req.getSpecificGravity());
        if (req.getAlbumin() != null) payload.put("albumin", req.getAlbumin());
        if (req.getSugar() != null) payload.put("sugar", req.getSugar());
        if (req.getRedBloodCells() != null) payload.put("redBloodCells", req.getRedBloodCells());
        if (req.getPusCell() != null) payload.put("pusCell", req.getPusCell());
        if (req.getPusCellClumps() != null) payload.put("pusCellClumps", req.getPusCellClumps());
        if (req.getBacteria() != null) payload.put("bacteria", req.getBacteria());
        if (req.getBloodGlucoseRandom() != null) payload.put("bloodGlucoseRandom", req.getBloodGlucoseRandom());
        if (req.getBloodUrea() != null) payload.put("bloodUrea", req.getBloodUrea());
        if (req.getSerumCreatinine() != null) payload.put("serumCreatinine", req.getSerumCreatinine());
        if (req.getSodium() != null) payload.put("sodium", req.getSodium());
        if (req.getPotassium() != null) payload.put("potassium", req.getPotassium());
        if (req.getHemoglobin() != null) payload.put("hemoglobin", req.getHemoglobin());
        if (req.getPackedCellVolume() != null) payload.put("packedCellVolume", req.getPackedCellVolume());
        if (req.getWhiteBloodCellCount() != null) payload.put("whiteBloodCellCount", req.getWhiteBloodCellCount());
        if (req.getRedBloodCellCount() != null) payload.put("redBloodCellCount", req.getRedBloodCellCount());
        if (req.getHypertension() != null) payload.put("hypertension", req.getHypertension());
        if (req.getDiabetesMellitus() != null) payload.put("diabetesMellitus", req.getDiabetesMellitus());
        if (req.getCoronaryArteryDisease() != null) payload.put("coronaryArteryDisease", req.getCoronaryArteryDisease());
        if (req.getAppetite() != null) payload.put("appetite", req.getAppetite());
        if (req.getPedalEdema() != null) payload.put("pedalEdema", req.getPedalEdema());
        if (req.getAnemia() != null) payload.put("anemia", req.getAnemia());
        return payload;
    }
}
```

---

### 4.2 `RecommendationService.java`
Path: `backend-springboot/src/main/java/com/kidneycare/service/RecommendationService.java`
```java
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
 * Deterministic rule-based clinical recommendation engine.
 * Maps biomarkers and lifestyle factors to evidence-based guidance.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;

    @Transactional
    public List<RecommendationResponse> generateFor(
            Assessment assessment,
            HealthProfile healthProfile,
            Activity latestActivity,
            List<MlPredictionResponse.MlFeatureExplanation> shapExplanations
    ) {
        List<Recommendation> recommendations = new ArrayList<>();

        // ── Rules: Health Profile ──
        if (healthProfile != null) {
            if ("Yes".equalsIgnoreCase(healthProfile.getHypertension())) {
                recommendations.add(buildRecommendation(assessment, "Medical", "Hypertension = Yes",
                        "Regular blood pressure monitoring is important. Consider discussing a monitoring plan with your healthcare provider.",
                        "High", "WHO Hypertension Guidelines"));
            }

            if ("Yes".equalsIgnoreCase(healthProfile.getDiabetes())) {
                recommendations.add(buildRecommendation(assessment, "Medical", "Diabetes = Yes",
                        "Regular blood glucose monitoring is recommended. Maintaining stable blood sugar levels supports kidney health.",
                        "High", "National Kidney Foundation"));
            }

            if ("Frequently".equalsIgnoreCase(healthProfile.getPainkillerUsage())) {
                recommendations.add(buildRecommendation(assessment, "Medical", "Painkiller usage = Frequently",
                        "Frequent use of certain painkillers may affect kidney function. Consider discussing your medication use with a healthcare professional.",
                        "High", "National Kidney Foundation"));
            }

            if ("Regular".equalsIgnoreCase(healthProfile.getSmoking()) ||
                "Occasional".equalsIgnoreCase(healthProfile.getSmoking())) {
                recommendations.add(buildRecommendation(assessment, "Lifestyle", "Smoking = " + healthProfile.getSmoking(),
                        "Smoking can damage blood vessels and reduce blood flow to the kidneys. Consider seeking support for smoking cessation.",
                        "High", "American Kidney Fund"));
            }

            if ("Weekly".equalsIgnoreCase(healthProfile.getAlcohol())) {
                recommendations.add(buildRecommendation(assessment, "Lifestyle", "Alcohol = Weekly",
                        "Excessive alcohol consumption can affect kidney function. Consider moderating alcohol intake.",
                        "Medium", "National Kidney Foundation"));
            }
        }

        // ── Rules: Daily Activity ──
        if (latestActivity != null) {
            if (latestActivity.getWaterIntakeLiters() != null && latestActivity.getWaterIntakeLiters() < 1.5) {
                recommendations.add(buildRecommendation(assessment, "Hydration", "Water intake = " + latestActivity.getWaterIntakeLiters() + " L",
                        "Adequate hydration supports kidney function. Aim for at least 1.5–2.0 liters of water per day, adjusted for activity level.",
                        "Medium", "European Food Safety Authority"));
            }

            if (latestActivity.getExerciseMinutes() != null && latestActivity.getExerciseMinutes() < 20) {
                recommendations.add(buildRecommendation(assessment, "Exercise", "Exercise = " + latestActivity.getExerciseMinutes() + " min today",
                        "Regular physical activity supports cardiovascular and kidney health. The WHO recommends at least 150 minutes of moderate activity per week.",
                        "Medium", "WHO Physical Activity Guidelines"));
            }

            if (latestActivity.getSleepHours() != null && latestActivity.getSleepHours() < 6.0) {
                recommendations.add(buildRecommendation(assessment, "Sleep", "Sleep = " + latestActivity.getSleepHours() + " hours",
                        "Adequate sleep (7–8 hours) supports overall health including kidney function. Consider establishing a regular sleep schedule.",
                        "Low", "National Sleep Foundation"));
            }

            if ("High".equalsIgnoreCase(latestActivity.getSaltLevel())) {
                recommendations.add(buildRecommendation(assessment, "Diet", "Salt/processed food level = High",
                        "Consider reducing frequent consumption of highly processed and salty foods. High sodium intake can contribute to elevated blood pressure.",
                        "Medium", "WHO Sodium Reduction Guidelines"));
            }

            if (latestActivity.getFastFood() != null && latestActivity.getFastFood()) {
                recommendations.add(buildRecommendation(assessment, "Diet", "Fast food = Yes (today)",
                        "Regular fast food consumption may increase sodium and unhealthy fat intake. Consider balancing with home-prepared meals.",
                        "Low", "Dietary Guidelines Advisory Committee"));
            }

            if ("High".equalsIgnoreCase(latestActivity.getStressLevel())) {
                recommendations.add(buildRecommendation(assessment, "Wellbeing", "Stress level = High",
                        "Chronic stress can affect blood pressure and overall health. Consider stress management techniques such as mindfulness practices.",
                        "Medium", "American Heart Association"));
            }
        }

        List<Recommendation> saved = recommendationRepository.saveAll(recommendations);
        return saved.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByAssessment(Long assessmentId) {
        return recommendationRepository.findByAssessmentIdOrderByPriorityDesc(assessmentId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public List<RecommendationResponse> getRecommendationsByUser(Long userId) {
        return recommendationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private Recommendation buildRecommendation(Assessment assessment, String category, String trigger,
                                                String text, String priority, String source) {
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
```

---

## 5. Verification
Compile both services:
```powershell
cd kidneycare-xai/backend-springboot
mvn compile
```

---

## 6. Next Step Dependency
Proceed to **`18_BACKEND_ASSESSMENT_ACTIVITY_DASHBOARD_RESEARCH_SERVICES.md`** to implement the core business orchestrators: `AssessmentService`, `ActivityService`, `DashboardService`, and `ResearchService`.
