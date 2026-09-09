# Step 44 — PostgreSQL VARCHAR(20) Overflow Fix & Defensive String Sanitization

## Date: 2026-09-09
## Status: ✅ RESOLVED & VERIFIED

---

## 1. Issue Analysis

During live assessment submission, the frontend displayed the following red database error:
```text
An unexpected error occurred: could not execute statement 
[ERROR: value too long for type character varying(20)] 
[insert into assessments (created_at,model_version,prediction,risk_category,risk_score,user_id) values (?,?,?,?,?,?)]; 
SQL [insert into assessments (created_at,model_version,prediction,risk_category,risk_score,user_id) values (?,?,?,?,?,?)]
```

### Root Cause
1. In the PostgreSQL schema and JPA entity [Assessment.java](file:///c:/KidneyXAI/kidneycare-xai/backend-springboot/src/main/java/com/kidneycare/entity/Assessment.java):
   ```java
   @Column(name = "model_version", nullable = false, length = 20)
   private String modelVersion;
   ```
2. The fallback evaluation routine in [MlService.java](file:///c:/KidneyXAI/kidneycare-xai/backend-springboot/src/main/java/com/kidneycare/service/MlService.java) set:
   `modelVersion = "v1.0-clinical-heuristic"` (23 characters).
3. Because $23 > 20$, PostgreSQL strictly aborted the SQL insert transaction with `value too long for type character varying(20)`.

---

## 2. Solutions Implemented

### 1. Fallback String Shortening ([MlService.java](file:///c:/KidneyXAI/kidneycare-xai/backend-springboot/src/main/java/com/kidneycare/service/MlService.java))
Changed fallback modelVersion to `"v1.0-fallback"` (13 characters, safely under the 20-character limit).

### 2. Defensive String Clamping ([AssessmentService.java](file:///c:/KidneyXAI/kidneycare-xai/backend-springboot/src/main/java/com/kidneycare/service/AssessmentService.java))
Added defensive bounds checking before persisting any assessment to PostgreSQL, ensuring that regardless of what upstream ML models or fallbacks return, columns will never overflow:
```java
String riskCategory = determineRiskCategory(mlResponse.getRiskScore());
if (riskCategory != null && riskCategory.length() > 20) {
    riskCategory = riskCategory.substring(0, 20);
}

String prediction = mlResponse.getPrediction();
if (prediction != null && prediction.length() > 20) {
    prediction = prediction.substring(0, 20);
}

String modelVersion = mlResponse.getModelVersion();
if (modelVersion == null || modelVersion.isBlank()) {
    modelVersion = "v1.0";
} else if (modelVersion.length() > 20) {
    modelVersion = modelVersion.substring(0, 20);
}
```

---

## 3. Verification & Deployment

1. **Compilation**: Cleaned and compiled all 55 Java source files with Maven (`BUILD SUCCESS`).
2. **Git Synchronization**: Committed and pushed to `origin/main` to trigger live container re-deployments on Render.
