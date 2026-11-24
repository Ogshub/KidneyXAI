package com.kidneycare.dto.request;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LabResultRequest(
        @NotBlank @Size(max = 100) String parameterName,
        @NotNull @PositiveOrZero @Digits(integer = 10, fraction = 8) BigDecimal value,
        @NotBlank @Size(max = 30) String unit,
        @PositiveOrZero @Digits(integer = 10, fraction = 8) BigDecimal referenceLow,
        @PositiveOrZero @Digits(integer = 10, fraction = 8) BigDecimal referenceHigh,
        @NotNull @PastOrPresent LocalDate recordedAt,
        @NotBlank @Size(max = 255) String source,
        boolean transcriptionConfirmed) {
}
