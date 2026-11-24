package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecommendationResponse {

    private Long id;
    private String ruleId;
    private String category;
    private String triggerReason;
    private String observationPeriod;
    private String recommendation;
    private String priority;
    private String source;
    private String knownLimitations;
    private String contraindications;
    private LocalDateTime createdAt;
}
