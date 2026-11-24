package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Weekly/Monthly Lifestyle Summary Response.
 * All averages are computed strictly over recorded days (disclosing denominators).
 * Missing days are never treated as zero-value observations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivitySummaryResponse {

    private String period; // "weekly" or "monthly"
    private LocalDate startDate;
    private LocalDate endDate;
    private int totalDaysInPeriod;
    private int recordedDays;
    private int missingJournalDays;
    private double journalCompletionRate; // recordedDays / totalDaysInPeriod * 100

    // Per-field recording counts (denominators)
    private Map<String, Integer> fieldRecordingCounts;

    // Hydration summary
    private HydrationSummary hydration;

    // Sleep summary
    private SleepSummary sleep;

    // Physical activity summary
    private PhysicalActivitySummary physicalActivity;

    // Food habit summary
    private FoodHabitSummary foodHabits;

    // Medication adherence summary
    private Map<String, Integer> medicationAdherenceCounts;

    // Blood pressure summary
    private BloodPressureSummary bloodPressure;

    // Symptoms and notes recorded
    private List<SymptomEntry> recentSymptoms;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HydrationSummary {
        private Double averageLiters;
        private int recordedCount;
        private Double minLiters;
        private Double maxLiters;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SleepSummary {
        private Double averageHours;
        private int recordedCount;
        private Map<String, Integer> qualityDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PhysicalActivitySummary {
        private Double averageMinutes;
        private Integer totalMinutes;
        private int recordedCount;
        private Map<String, Integer> exerciseTypeDistribution;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FoodHabitSummary {
        private int recordedCount;
        private Map<String, Integer> saltLevelDistribution;
        private int fastFoodDays;
        private int totalSugaryDrinks;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BloodPressureSummary {
        private int readingsCount;
        private Double averageSystolic;
        private Double averageDiastolic;
        private List<BpReading> recentReadings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BpReading {
        private LocalDate date;
        private Integer systolic;
        private Integer diastolic;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SymptomEntry {
        private LocalDate date;
        private String symptom;
    }
}
