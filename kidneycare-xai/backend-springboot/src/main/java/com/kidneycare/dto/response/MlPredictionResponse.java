package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * ML service prediction response.
 * Deserialized from the Python ML service's JSON response.
 */
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
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MlFeatureExplanation {
        private String feature;
        private Double value;
        private Double shapValue;
    }
}
