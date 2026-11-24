package com.kidneycare.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Component
public class LabParameterRegistry {
    public record Parameter(String name, String label, String canonicalUnit,
                            List<String> units, String assessmentField) {}
    public record Normalized(BigDecimal value, String unit) {}

    private static final List<Parameter> PARAMETERS = List.of(
            new Parameter("serum_creatinine", "Serum creatinine", "mg/dL", List.of("mg/dL", "µmol/L"), "serumCreatinine"),
            new Parameter("hemoglobin", "Hemoglobin", "g/dL", List.of("g/dL", "g/L"), "hemoglobin"),
            new Parameter("blood_urea", "Blood urea", "mg/dL", List.of("mg/dL"), "bloodUrea"),
            new Parameter("blood_glucose_random", "Random blood glucose", "mg/dL", List.of("mg/dL"), "bloodGlucoseRandom"),
            new Parameter("sodium", "Sodium", "mEq/L", List.of("mEq/L", "mmol/L"), "sodium"),
            new Parameter("potassium", "Potassium", "mEq/L", List.of("mEq/L", "mmol/L"), "potassium"),
            new Parameter("egfr", "Reported eGFR", "mL/min/1.73m²", List.of("mL/min/1.73m²"), null),
            new Parameter("urine_acr", "Urine albumin-to-creatinine ratio", "mg/g", List.of("mg/g"), null)
    );
    private static final Map<String, BigDecimal> DIVISORS = Map.of(
            "µmol/L", new BigDecimal("88.4"),
            "g/L", BigDecimal.TEN
    );

    public List<Parameter> all() {
        return PARAMETERS;
    }

    public Parameter require(String name) {
        return PARAMETERS.stream().filter(parameter -> parameter.name().equals(name)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported laboratory parameter"));
    }

    public Normalized normalize(String name, BigDecimal value, String unit) {
        Parameter parameter = require(name);
        if (!parameter.units().contains(unit)) {
            throw new IllegalArgumentException("Unsupported unit for this parameter");
        }
        BigDecimal divisor = DIVISORS.getOrDefault(unit, BigDecimal.ONE);
        return new Normalized(value.divide(divisor, 10, RoundingMode.HALF_UP), parameter.canonicalUnit());
    }
}
