package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthProfileResponse {

    private Long id;
    private Integer age;
    private String gender;
    private Double heightCm;
    private Double weightKg;
    private Double bmi;
    private String diabetes;
    private String hypertension;
    private String familyHistory;
    private String smoking;
    private String alcohol;
    private String painkillerUsage;
}
