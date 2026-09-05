package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResearchAnalyticsResponse {

    private long totalResponses;
    private Map<String, Long> roleDistribution;
    private Map<String, Long> ageDistribution;
    private Map<String, Long> hydrationDistribution;
    private Map<String, Long> exerciseDistribution;

    // H2 & H3 Research Evaluation Metrics (Mean scores on 1-5 scale)
    private Double meanShapComprehension;
    private Double meanNarrativePreference;
    private Double meanGuidelineTrust;
    private Double meanActionability;

    // Awareness Indicators
    private Double awarenessEarlySymptomsPercent;
    private Double awarenessRiskFactorsPercent;
    private Double monitorsBpPercent;
    private Double receivedKidneyInfoPercent;
}
