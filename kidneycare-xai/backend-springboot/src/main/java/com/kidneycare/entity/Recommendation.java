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

    @Column(nullable = false, length = 50)
    private String category;

    @Column(name = "trigger_reason", nullable = false, length = 255)
    private String triggerReason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recommendation;

    @Column(nullable = false, length = 20)
    private String priority;

    @Column(length = 255)
    private String source;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
