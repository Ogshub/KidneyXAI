package com.kidneycare.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;

public record AssistantPageContext(
        @NotBlank @Pattern(regexp = "dashboard|assessment|assessment-result|reports|report-detail|lab-history|report-comparison|tracker|recommendations|profile") String page,
        @Positive Long reportId,
        @Positive Long assessmentId) {
    @JsonIgnore
    @AssertTrue(message = "Record references must match the current page")
    public boolean isMatchingPage() {
        return (reportId == null || "report-detail".equals(page))
                && (assessmentId == null || "assessment-result".equals(page));
    }
}
