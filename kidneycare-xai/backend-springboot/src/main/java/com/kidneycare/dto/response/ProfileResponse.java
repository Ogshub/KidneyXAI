package com.kidneycare.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private Long id;
    private String name;
    private String email;
    private Integer age;
    private String gender;
    private Double heightCm;
    private Double weightKg;
    private Double bmi;

    // New profile fields
    private String profilePictureUrl;
    private String bio;
    private String phone;
    private String affiliation;
    private String timezone;
}
