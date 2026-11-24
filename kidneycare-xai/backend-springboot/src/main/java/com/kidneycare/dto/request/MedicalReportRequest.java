package com.kidneycare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record MedicalReportRequest(
        @NotNull @PastOrPresent LocalDate reportDate,
        @NotBlank @Pattern(regexp = "bloodwork|urinalysis|imaging|other") String reportType,
        @Size(max = 255) String labName,
        @Size(max = 255) String doctorName,
        @Size(max = 8000) String notes) {
}
