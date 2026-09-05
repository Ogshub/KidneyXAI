package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "daily_activities",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "activity_date"}))
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "water_intake_liters")
    private Double waterIntakeLiters;

    @Column(name = "exercise_minutes")
    private Integer exerciseMinutes;

    @Column(name = "sleep_hours")
    private Double sleepHours;

    @Column(name = "salt_level", length = 20)
    private String saltLevel;

    @Column(name = "fast_food")
    @Builder.Default
    private Boolean fastFood = false;

    @Column(name = "sugary_drinks")
    @Builder.Default
    private Integer sugaryDrinks = 0;

    @Builder.Default
    private Boolean smoking = false;

    @Builder.Default
    private Boolean alcohol = false;

    @Column(name = "weight_kg")
    private Double weightKg;

    @Column(name = "stress_level", length = 20)
    private String stressLevel;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
