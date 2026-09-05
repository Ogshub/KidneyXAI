package com.kidneycare.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Clinical features submitted for ML risk assessment.
 * Field names match the Spring Boot → Python ML contract.
 * Will be finalized once Dataset A is selected.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentRequest {

    @NotNull(message = "Age is required")
    @Min(value = 0, message = "Age must be non-negative")
    private Double age;

    @NotNull(message = "Blood pressure is required")
    @Min(value = 0, message = "Blood pressure must be non-negative")
    private Double bloodPressure;

    private Double specificGravity;
    private Double albumin;
    private Double sugar;
    private String redBloodCells;
    private String pusCell;
    private String pusCellClumps;
    private String bacteria;
    private Double bloodGlucoseRandom;
    private Double bloodUrea;
    private Double serumCreatinine;
    private Double sodium;
    private Double potassium;
    private Double hemoglobin;
    private Double packedCellVolume;
    private Double whiteBloodCellCount;
    private Double redBloodCellCount;
    private String hypertension;
    private String diabetesMellitus;
    private String coronaryArteryDisease;
    private String appetite;
    private String pedalEdema;
    private String anemia;
}
