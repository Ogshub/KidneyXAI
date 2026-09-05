package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Composite dashboard response — single payload for the dashboard page.
 * DashboardService is a read-only aggregator; it never writes.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {

    // ── Latest Assessment ──
    private Double currentRiskScore;
    private String currentRiskCategory;
    private String prediction;
    private LocalDateTime lastAssessmentDate;

    // ── Lifestyle Progress ──
    private Integer lifestyleScore;  // 0–100 app metric

    // ── Today's Activity ──
    private ActivityResponse todayActivity;

    // ── Top Model Contributors (from latest assessment SHAP) ──
    private List<AssessmentResponse.FeatureExplanationDto> topContributors;

    // ── Recent Recommendations ──
    private List<RecommendationResponse> recentRecommendations;

    // ── Trend Data (for Chart.js) ──
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
