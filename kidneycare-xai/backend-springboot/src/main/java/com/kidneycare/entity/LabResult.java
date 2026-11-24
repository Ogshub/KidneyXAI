package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "lab_results")
@Getter
@Setter
public class LabResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long reportId;
    private Long userId;
    private String parameterName;
    private BigDecimal originalValue;
    private String originalUnit;
    private BigDecimal normalizedValue;
    private String normalizedUnit;
    private BigDecimal referenceLow;
    private BigDecimal referenceHigh;
    private LocalDate recordedAt;
    private String source;
    private boolean transcriptionConfirmed;
    private Instant createdAt;
    private Instant updatedAt;
}
