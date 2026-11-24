package com.kidneycare.dto.response;

import com.kidneycare.entity.LabResult;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record LabResultResponse(Long id, Long reportId, String parameterName, BigDecimal value,
        String unit, BigDecimal normalizedValue, String normalizedUnit,
        BigDecimal referenceLow, BigDecimal referenceHigh, LocalDate recordedAt,
        String source, boolean transcriptionConfirmed, Instant updatedAt) {

    public static LabResultResponse from(LabResult result) {
        return new LabResultResponse(result.getId(), result.getReportId(), result.getParameterName(),
                result.getOriginalValue(), result.getOriginalUnit(), result.getNormalizedValue(),
                result.getNormalizedUnit(), result.getReferenceLow(), result.getReferenceHigh(),
                result.getRecordedAt(), result.getSource(), result.isTranscriptionConfirmed(), result.getUpdatedAt());
    }
}
