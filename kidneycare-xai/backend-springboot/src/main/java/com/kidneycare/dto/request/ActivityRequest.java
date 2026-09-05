package com.kidneycare.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActivityRequest {

    @NotNull(message = "Activity date is required")
    private LocalDate activityDate;

    @Min(value = 0, message = "Water intake must be non-negative")
    private Double waterIntakeLiters;

    @Min(value = 0, message = "Exercise minutes must be non-negative")
    private Integer exerciseMinutes;

    @Min(value = 0, message = "Sleep hours must be non-negative")
    private Double sleepHours;

    private String saltLevel;       // Low / Medium / High
    private Boolean fastFood;
    private Integer sugaryDrinks;
    private Boolean smoking;
    private Boolean alcohol;

    @Min(value = 10, message = "Weight must be at least 10 kg")
    private Double weightKg;

    private String stressLevel;     // Low / Medium / High
}
