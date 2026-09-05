package com.kidneycare.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HealthProfileRequest {

    private String diabetes;         // Yes / No / Prefer not to say
    private String hypertension;     // Yes / No / Prefer not to say
    private String familyHistory;    // Yes / No / Don't know / Prefer not to say
    private String smoking;          // Never / Former / Occasional / Regular / Prefer not to say
    private String alcohol;          // Never / Occasionally / Monthly / Weekly / Prefer not to say
    private String painkillerUsage;  // Never / Occasionally / Frequently / Prefer not to say
}
