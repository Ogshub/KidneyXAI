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
 * Security: Passes internal shared secret via X-Internal-Secret header.
 * Integrity: Does NOT fabricate synthetic predictions or SHAP values
 * when the ML service is unreachable.
 */
@Service
@Slf4j
public class MlService {

    private final RestClient restClient;
    private final String internalSecret;

    public MlService(@Value("${ml.service.url}") String mlServiceUrl,
                     @Value("${ml.service.timeout-ms}") long timeoutMs,
                     @Value("${ml.internal.secret:}") String internalSecret) {

        this.internalSecret = internalSecret;

        // Configure HTTP client with explicit connect + read timeouts
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout((int) Math.min(timeoutMs / 3, 10000)); // connect: max 10s
        factory.setReadTimeout((int) timeoutMs);                         // read: full timeout

        // Ensure valid URI scheme
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
     * Enforces research integrity: never silently substitutes heuristic values.
     *
     * @param request clinical feature values
     * @return ML prediction with verified SHAP explanations
     * @throws MlServiceException if the service is unreachable or returns an error
     */
    public MlPredictionResponse predict(AssessmentRequest request) {
        Map<String, Object> payload = buildPayload(request);

        try {
            var requestSpec = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload);

            if (internalSecret != null && !internalSecret.isBlank()) {
                requestSpec.header("X-Internal-Secret", internalSecret);
            }

            MlPredictionResponse response = requestSpec
                    .retrieve()
                    .body(MlPredictionResponse.class);

            if (response == null) {
                throw new MlServiceException("ML service returned an empty response.");
            }

            if (Boolean.TRUE.equals(response.getIsDemoMode()) ||
                    "unavailable".equalsIgnoreCase(response.getPrediction()) ||
                "error".equalsIgnoreCase(response.getPrediction())) {
                throw new MlServiceException("ML model is currently unavailable on the prediction service.");
            }

            return response;
        } catch (MlServiceException e) {
            throw e;
        } catch (Exception e) {
            log.warn("ML service call failed ({})", e.getClass().getSimpleName());
            throw new MlServiceException("Predictive machine learning service is currently unavailable. Please verify service health.");
        }
    }

    public Map<String, Object> getModelEvaluation() {
        try {
            var requestSpec = restClient.get()
                    .uri("/evaluate")
                    .accept(MediaType.APPLICATION_JSON);

            if (internalSecret != null && !internalSecret.isBlank()) {
                requestSpec.header("X-Internal-Secret", internalSecret);
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> result = requestSpec
                    .retrieve()
                    .body(Map.class);
            return result;
        } catch (Exception e) {
            log.error("Failed to fetch ML model evaluation: {}", e.getMessage());
            return Map.of("status", "metrics_unavailable", "message", "Evaluation metrics currently unreachable");
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
