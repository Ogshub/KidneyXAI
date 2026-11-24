package com.kidneycare.dto.request;

import jakarta.validation.constraints.*;
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
    @Max(120)
    private Double age;

    @NotNull(message = "Blood pressure is required")
    @Min(value = 0, message = "Blood pressure must be non-negative")
    private Double bloodPressure;

    @DecimalMin("1.0") @DecimalMax("1.030")
    private Double specificGravity;
    @DecimalMin("0.0") @DecimalMax("5.0")
    private Double albumin;
    @DecimalMin("0.0") @DecimalMax("5.0")
    private Double sugar;
    @Pattern(regexp = "normal|abnormal", message = "Unsupported category")
    private String redBloodCells;
    @Pattern(regexp = "normal|abnormal", message = "Unsupported category")
    private String pusCell;
    @Pattern(regexp = "present|notpresent", message = "Unsupported category")
    private String pusCellClumps;
    @Pattern(regexp = "present|notpresent", message = "Unsupported category")
    private String bacteria;
    @DecimalMin("0.0")
    private Double bloodGlucoseRandom;
    @DecimalMin("0.0")
    private Double bloodUrea;
    @DecimalMin("0.0")
    private Double serumCreatinine;
    @DecimalMin("0.0")
    private Double sodium;
    @DecimalMin("0.0")
    private Double potassium;
    @DecimalMin("0.0")
    private Double hemoglobin;
    @DecimalMin("0.0")
    private Double packedCellVolume;
    @DecimalMin("0.0")
    private Double whiteBloodCellCount;
    @DecimalMin("0.0")
    private Double redBloodCellCount;
    @Pattern(regexp = "yes|no", message = "Unsupported category")
    private String hypertension;
    @Pattern(regexp = "yes|no", message = "Unsupported category")
    private String diabetesMellitus;
    @Pattern(regexp = "yes|no", message = "Unsupported category")
    private String coronaryArteryDisease;
    @Pattern(regexp = "good|poor", message = "Unsupported category")
    private String appetite;
    @Pattern(regexp = "yes|no", message = "Unsupported category")
    private String pedalEdema;
    @Pattern(regexp = "yes|no", message = "Unsupported category")
    private String anemia;
}
