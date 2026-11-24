package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", nullable = false)
    private Assessment assessment;

    @Column(name = "rule_id", length = 50)
    private String ruleId;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "trigger_reason", nullable = false, length = 255)
    private String triggerReason;

    @Column(name = "observation_period", length = 50)
    private String observationPeriod;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(length = 255)
    private String source;

    @Column(name = "known_limitations", columnDefinition = "TEXT")
    private String knownLimitations;

    @Column(name = "contraindications", columnDefinition = "TEXT")
    private String contraindications;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
