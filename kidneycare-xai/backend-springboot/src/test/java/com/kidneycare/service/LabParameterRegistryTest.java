package com.kidneycare.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

class LabParameterRegistryTest {
    private final LabParameterRegistry registry = new LabParameterRegistry();

    @Test
    void normalizesOnlyRegisteredUnitsAndKeepsUnsupportedMeasurementsOutOfAssessment() {
        assertEquals(new BigDecimal("1.0000000000"),
                registry.normalize("serum_creatinine", new BigDecimal("88.4"), "µmol/L").value());
        assertEquals(new BigDecimal("14.0000000000"),
                registry.normalize("hemoglobin", new BigDecimal("140"), "g/L").value());
        assertEquals("mEq/L", registry.normalize("sodium", new BigDecimal("140"), "mmol/L").unit());
        assertEquals("serumCreatinine", registry.require("serum_creatinine").assessmentField());
        assertNull(registry.require("egfr").assessmentField());
        assertNull(registry.require("urine_acr").assessmentField());
        assertThrows(IllegalArgumentException.class, () -> registry.normalize("hemoglobin", BigDecimal.ONE, "mg/dL"));
        assertThrows(IllegalArgumentException.class, () -> registry.require("unknown"));
    }

    @Test
    void validatesAttachmentExtensionMediaTypeAndSignature() {
        byte[] pdf = "%PDF-1.7\n".getBytes(java.nio.charset.StandardCharsets.US_ASCII);
        assertEquals("application/pdf", PrivateReportStorage.validateContent("report.pdf", "application/pdf", pdf));
        assertThrows(IllegalArgumentException.class,
                () -> PrivateReportStorage.validateContent("report.png", "image/png", pdf));
        assertThrows(IllegalArgumentException.class,
                () -> PrivateReportStorage.validateContent("report.pdf", "image/png", pdf));
        assertThrows(IllegalArgumentException.class,
                () -> PrivateReportStorage.validateContent("report.pdf", "application/pdf", new byte[0]));
    }
}
