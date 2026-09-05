package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "health_profiles")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class HealthProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private Integer age;

    @Column(length = 20)
    private String gender;

    @Column(name = "height_cm")
    private Double heightCm;

    @Column(name = "weight_kg")
    private Double weightKg;

    private Double bmi;

    @Column(length = 30)
    private String diabetes;

    @Column(length = 30)
    private String hypertension;

    @Column(name = "family_history", length = 30)
    private String familyHistory;

    @Column(length = 30)
    private String smoking;

    @Column(length = 30)
    private String alcohol;

    @Column(name = "painkiller_usage", length = 30)
    private String painkillerUsage;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Auto-calculate BMI from height (cm) and weight (kg).
     * BMI = weight / (height_m)^2
     */
    @PrePersist
    public void calculateBmi() {
        if (heightCm != null && weightKg != null && heightCm > 0) {
            double heightM = heightCm / 100.0;
            this.bmi = Math.round((weightKg / (heightM * heightM)) * 100.0) / 100.0;
        }
    }
}
