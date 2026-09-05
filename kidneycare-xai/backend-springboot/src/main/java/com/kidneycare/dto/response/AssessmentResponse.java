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
