package com.kidneycare.service;

import com.kidneycare.dto.request.AssessmentRequest;
import com.kidneycare.dto.response.MlPredictionResponse;
import com.kidneycare.exception.MlServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * MlService — the ONLY class in the whole backend that speaks to Python.
 * Nothing else calls the ML service directly.
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

    /**
     * Call the Python ML service's /predict endpoint.
     *
     * @param request clinical feature values
     * @return ML prediction with SHAP explanations
     * @throws MlServiceException if the service is down, times out, or returns garbage
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
                throw new MlServiceException("ML service returned null response");
            }

            log.info("ML prediction received: {} (score={})",
                    response.getPrediction(), response.getRiskScore());

            return response;
        } catch (Exception e) {
            log.error("ML service call failed: {}", e.getMessage(), e);
            throw new MlServiceException("ML prediction service unavailable: " + e.getMessage());
        }
    }

    public Map<String, Object> getModelEvaluation() {
        try {
            return restClient.get()
                    .uri("/evaluate")
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .body(Map.class);
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
