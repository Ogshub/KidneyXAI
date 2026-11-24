package com.kidneycare.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record MedicalReportResponse(Long id, LocalDate reportDate, String reportType, String labName,
        String doctorName, String notes, String fileName, Instant updatedAt, List<LabResultResponse> measurements) {
}
