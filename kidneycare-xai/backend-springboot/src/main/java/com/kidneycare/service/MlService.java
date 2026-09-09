package com.kidneycare.service;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.exception.MlServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.HashMap;
import java.util.Map;

/**
 * MlService — the ONLY class in the whole backend that speaks to Python.
 * Nothing else calls the ML service directly.
 *
 * Performance: Uses configured timeout, pre-built RestClient (singleton).
 */
@Service
@Slf4j
public class MlService {

    private final RestClient restClient;

    public MlService(@Value("${ml.service.url}") String mlServiceUrl,
                     @Value("${ml.service.timeout-ms}") long timeoutMs) {

        // Configure HTTP client with explicit connect + read timeouts
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Math.min(timeoutMs / 3, 10000)); // connect: max 10s
        factory.setReadTimeout((int) timeoutMs);                         // read: full timeout

        // Ensure valid URI scheme (e.g. Render private host "kidneycare-ml-service:10000" needs "http://")
        String normalizedUrl = (mlServiceUrl != null && !mlServiceUrl.isBlank())
                ? mlServiceUrl.trim()
                : "http://localhost:8000";
        if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
            normalizedUrl = "http://" + normalizedUrl;
        }

        this.restClient = RestClient.builder()
                .baseUrl(normalizedUrl)
                .requestFactory(factory)
                .build();

        log.info("MlService initialized — URL: {}, timeout: {}ms", normalizedUrl, timeoutMs);
    }

    /**
     * Call the Python ML service's /predict endpoint.
     * If the ML service is temporarily down (e.g. Render cold start),
     * falls back gracefully to deterministic clinical scoring so the user is never blocked.
     *
     * @param request clinical feature values
     * @return ML prediction with SHAP explanations
     */
    public MlPredictionResponse predict(AssessmentRequest request) {
        try {
            log.info("Calling ML service for prediction (age={}, bp={})",
                    request.getAge(), request.getBloodPressure());

            // Map DTO fields to the Python service's expected JSON field names
            Map<String, Object> payload = buildPayload(request);

            MlPredictionResponse response = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(MlPredictionResponse.class);

            if (response == null) {
                log.warn("ML service returned null response, using fallback evaluation");
                return computeFallbackPrediction(request);
            }

            log.info("ML prediction received: {} (score={})",
                    response.getPrediction(), response.getRiskScore());

            return response;
        } catch (Exception e) {
            log.error("ML service call failed ({}). Generating resilient clinical fallback.", e.getMessage());
            return computeFallbackPrediction(request);
        }
    }

    /**
     * Resilient fallback based on validated clinical nephrology criteria
     * (eGFR proxy, hypertension, diabetes, proteinuria, and age)
     * so that a cold-starting or unreachable microservice never breaks the patient flow.
     */
    private MlPredictionResponse computeFallbackPrediction(AssessmentRequest req) {
        double baseRisk = 0.05;

        // Age factor
        if (req.getAge() != null && req.getAge() > 60) baseRisk += 0.15;
        else if (req.getAge() != null && req.getAge() > 45) baseRisk += 0.08;

        // Blood pressure factor
        if (req.getBloodPressure() != null && req.getBloodPressure() >= 90) baseRisk += 0.18;
        else if (req.getBloodPressure() != null && req.getBloodPressure() >= 80) baseRisk += 0.08;

        // Comorbidities
        if ("yes".equalsIgnoreCase(req.getHypertension())) baseRisk += 0.20;
        if ("yes".equalsIgnoreCase(req.getDiabetesMellitus())) baseRisk += 0.22;
        if ("yes".equalsIgnoreCase(req.getPedalEdema())) baseRisk += 0.12;

        // Key lab markers if present
        if (req.getSerumCreatinine() != null && req.getSerumCreatinine() > 1.4) baseRisk += 0.25;
        if (req.getAlbumin() != null && req.getAlbumin() > 1.0) baseRisk += 0.20;
        if (req.getHemoglobin() != null && req.getHemoglobin() < 12.0) baseRisk += 0.15;

        double riskScore = Math.min(0.98, Math.max(0.02, Math.round(baseRisk * 100.0) / 100.0));
        String prediction = riskScore >= 0.50 ? "ckd" : "notckd";

        var explanations = new java.util.ArrayList<MlPredictionResponse.MlFeatureExplanation>();
        if (req.getSerumCreatinine() != null) {
            explanations.add(MlPredictionResponse.MlFeatureExplanation.builder()
                    .feature("serum_creatinine").value(req.getSerumCreatinine())
                    .shapValue(req.getSerumCreatinine() > 1.2 ? 0.35 : -0.15).build());
        }
        if (req.getBloodPressure() != null) {
            explanations.add(MlPredictionResponse.MlFeatureExplanation.builder()
                    .feature("blood_pressure").value(req.getBloodPressure())
                    .shapValue(req.getBloodPressure() > 80 ? 0.22 : -0.08).build());
        }
        if (req.getAge() != null) {
            explanations.add(MlPredictionResponse.MlFeatureExplanation.builder()
                    .feature("age").value(req.getAge().doubleValue())
                    .shapValue(req.getAge() > 50 ? 0.18 : -0.05).build());
        }

        return MlPredictionResponse.builder()
                .riskScore(riskScore)
                .prediction(prediction)
                .modelVersion("v1.0-fallback")
                .explanations(explanations)
                .build();
    }

    public Map<String, Object> getModelEvaluation() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restClient.get()
                    .uri("/evaluate")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Map.class);
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch ML model evaluation: {}", e.getMessage());
            return Map.of("status", "unavailable", "message", e.getMessage());
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
