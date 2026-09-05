package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ActivityResponse {

    private Long id;
    private LocalDate activityDate;
    private Double waterIntakeLiters;
    private Integer exerciseMinutes;
    private Double sleepHours;
    private String saltLevel;
    private Boolean fastFood;
    private Integer sugaryDrinks;
    private Boolean smoking;
    private Boolean alcohol;
    private Double weightKg;
    private String stressLevel;
}
