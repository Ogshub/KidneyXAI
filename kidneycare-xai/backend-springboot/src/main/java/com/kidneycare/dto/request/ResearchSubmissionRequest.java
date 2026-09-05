package com.kidneycare.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * College research survey submission (Dataset B).
 * Public endpoint — no JWT required.
 * No personal identifiers (name, email, phone).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResearchSubmissionRequest {

    @NotBlank(message = "Participant ID is required")
    private String participantId;

    @NotBlank(message = "Role is required")
    private String role;                // Student / Faculty

    @NotBlank(message = "Age group is required")
    private String ageGroup;

    private String gender;              // Optional

    // ── Health ──
    private String diabetes;
    private String hypertension;
    private String familyHistory;
    private String painkillerUsage;

    // ── Lifestyle ──
    private String waterIntake;
    private String exercise;
    private String sleepHours;
    private String saltyProcessed;
    private String fastFood;
    private String sugaryDrinks;
    private String smoking;
    private String alcohol;

    // ── Awareness ──
    private Boolean awareEarlySymptoms;
    private Boolean awareRiskFactors;
    private Boolean monitorsBp;
    private Boolean receivedKidneyInfo;

    // ── XAI & Provenance Evaluation (H2 & H3 User Study) ──
    private Integer shapComprehensionScore;
    private Integer narrativePreferenceScore;
    private Integer guidelineTrustScore;
    private Integer actionabilityScore;
}
