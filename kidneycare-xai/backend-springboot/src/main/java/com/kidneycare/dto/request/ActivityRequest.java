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

    private String exerciseType;

    @Min(value = 0, message = "Sleep hours must be non-negative")
    private Double sleepHours;

    private String sleepQuality;

    private String saltLevel;       // Low / Medium / High
    private Boolean fastFood;
    private Integer sugaryDrinks;
    private Boolean smoking;
    private Boolean alcohol;

    @Min(value = 10, message = "Weight must be at least 10 kg")
    private Double weightKg;

    private String stressLevel;     // Low / Medium / High

    @Min(value = 40, message = "Systolic BP must be at least 40")
    private Integer systolicBp;

    @Min(value = 30, message = "Diastolic BP must be at least 30")
    private Integer diastolicBp;

    private String medicationStatus; // TAKEN_AS_PRESCRIBED / MISSED / PARTIALLY_TAKEN / NOT_APPLICABLE / NOT_RECORDED
    private String symptoms;
    private String personalNotes;
    private String doctorRestrictions;
}
