package com.kidneycare.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "medical_reports")
@Getter
@Setter
public class MedicalReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private LocalDate reportDate;
    private String reportType;
    private String labName;
    private String doctorName;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}
