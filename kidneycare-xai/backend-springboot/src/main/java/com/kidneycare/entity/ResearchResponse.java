package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "research_responses")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResearchResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ── Demographics ──
    @Column(name = "participant_id", nullable = false, length = 20)
    private String participantId;

    @Column(nullable = false, length = 20)
    private String role;

    @Column(name = "age_group", nullable = false, length = 20)
    private String ageGroup;

    @Column(length = 20)
    private String gender;

    // ── Health Information ──
    @Column(length = 30)
    private String diabetes;

    @Column(length = 30)
    private String hypertension;

    @Column(name = "family_history", length = 30)
    private String familyHistory;

    @Column(name = "painkiller_usage", length = 30)
    private String painkillerUsage;

    // ── Lifestyle ──
    @Column(name = "water_intake", length = 30)
    private String waterIntake;

    @Column(length = 30)
    private String exercise;

    @Column(name = "sleep_hours", length = 30)
    private String sleepHours;

    @Column(name = "salty_processed", length = 30)
    private String saltyProcessed;

    @Column(name = "fast_food", length = 30)
    private String fastFood;

    @Column(name = "sugary_drinks", length = 30)
    private String sugaryDrinks;

    @Column(length = 30)
    private String smoking;

    @Column(length = 30)
    private String alcohol;

    // ── Awareness ──
    @Column(name = "aware_early_symptoms")
    private Boolean awareEarlySymptoms;

    @Column(name = "aware_risk_factors")
    private Boolean awareRiskFactors;

    @Column(name = "monitors_bp")
    private Boolean monitorsBp;

    @Column(name = "received_kidney_info")
    private Boolean receivedKidneyInfo;

    // ── XAI & Provenance Evaluation (H2 & H3 User Study) ──
    @Column(name = "shap_comprehension_score")
    private Integer shapComprehensionScore;

    @Column(name = "narrative_preference_score")
    private Integer narrativePreferenceScore;

    @Column(name = "guideline_trust_score")
    private Integer guidelineTrustScore;

    @Column(name = "actionability_score")
    private Integer actionabilityScore;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    // Note: No foreign key to users — intentionally decoupled (Dataset B)
}
