package com.kidneycare.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;

    @Min(value = 1, message = "Age must be at least 1")
    @Max(value = 120, message = "Age must be at most 120")
    private Integer age;

    private String gender;

    @Min(value = 50, message = "Height must be at least 50 cm")
    @Max(value = 300, message = "Height must be at most 300 cm")
    private Double heightCm;

    @Min(value = 10, message = "Weight must be at least 10 kg")
    @Max(value = 500, message = "Weight must be at most 500 kg")
    private Double weightKg;
}
