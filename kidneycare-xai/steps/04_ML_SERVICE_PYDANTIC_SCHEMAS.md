# Step 04: Machine Learning Service — Pydantic Request & Response Schemas

## 1. Overview & Objective
In this step, we write `ml-service/app/schemas.py`.

In microservices architectures, services must agree on strict JSON contracts before writing business logic. The schemas define:
1. `PredictionRequest`: All 24 laboratory, demographic, and clinical biomarker inputs (age, blood pressure, serum creatinine, hemoglobin, albumin, etc.) with field constraints and camelCase aliases for Java/JavaScript compatibility.
2. `FeatureExplanation`: The local SHAP attribution score (`feature`, `value`, `shapValue`) indicating whether an individual biomarker increases or decreases risk.
3. `PredictionResponse`: The complete response contract returned to Spring Boot (`riskScore`, `prediction`, `explanations[]`, `modelVersion`).
4. `ModelInfoResponse`: Global feature importance and model metadata for research transparency.
5. `HealthResponse`: Microservice liveness and model loading status for Docker/orchestrator health checks.

---

## 2. Prerequisites
- Completed `02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md` (specifically tables `assessments` and `assessment_features`)
- Completed `03_ML_SERVICE_ENVIRONMENT_AND_CONFIG.md`

---

## 3. Why This Is Created Now
1. **Pydantic Validation**: Python is dynamically typed. Using Pydantic guarantees that invalid inputs (e.g. negative age, blood pressure of 900, invalid categorical strings) are rejected with HTTP 422 *before* reaching the mathematical model.
2. **Contract Alignment**: Spring Boot's `MlPredictionResponse.java` and React's `AssessmentResult.jsx` depend directly on the JSON keys (`riskScore`, `shapValue`, `explanations`) defined here.
3. **CamelCase Aliasing**: Java and JavaScript conventions use camelCase (e.g. `bloodPressure`), while Python uses snake_case (e.g. `blood_pressure`). Pydantic's `Field(..., alias="bloodPressure")` and `populate_by_name = True` bridge this divide seamlessly.

---

## 4. File Content: `ml-service/app/schemas.py`

Create `kidneycare-xai/ml-service/app/schemas.py`:

```python
"""
KidneyCare-XAI — Pydantic Request/Response Schemas

Defines the contract between Spring Boot (MlService) and this Python service.
Feature names match standard clinical CKD datasets (e.g. UCI Machine Learning Repository).
"""
from pydantic import BaseModel, Field
from typing import Optional


# ── Request ──────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """
    Clinical features submitted for risk prediction.
    Field names match the trained model's expected feature names.
    """
    age: float = Field(..., description="Patient age in years", ge=0, le=120)
    blood_pressure: float = Field(..., alias="bloodPressure", description="Blood pressure (mm/Hg)", ge=0)
    specific_gravity: Optional[float] = Field(None, alias="specificGravity", ge=1.0, le=1.030)
    albumin: Optional[float] = Field(None, ge=0, le=5)
    sugar: Optional[float] = Field(None, ge=0, le=5)
    red_blood_cells: Optional[str] = Field(None, alias="redBloodCells")
    pus_cell: Optional[str] = Field(None, alias="pusCell")
    pus_cell_clumps: Optional[str] = Field(None, alias="pusCellClumps")
    bacteria: Optional[str] = Field(None)
    blood_glucose_random: Optional[float] = Field(None, alias="bloodGlucoseRandom", ge=0)
    blood_urea: Optional[float] = Field(None, alias="bloodUrea", ge=0)
    serum_creatinine: Optional[float] = Field(None, alias="serumCreatinine", ge=0)
    sodium: Optional[float] = Field(None, ge=0)
    potassium: Optional[float] = Field(None, ge=0)
    hemoglobin: Optional[float] = Field(None, alias="hemoglobin", ge=0)
    packed_cell_volume: Optional[float] = Field(None, alias="packedCellVolume", ge=0)
    white_blood_cell_count: Optional[float] = Field(None, alias="whiteBloodCellCount", ge=0)
    red_blood_cell_count: Optional[float] = Field(None, alias="redBloodCellCount", ge=0)
    hypertension: Optional[str] = Field(None)
    diabetes_mellitus: Optional[str] = Field(None, alias="diabetesMellitus")
    coronary_artery_disease: Optional[str] = Field(None, alias="coronaryArteryDisease")
    appetite: Optional[str] = Field(None)
    pedal_edema: Optional[str] = Field(None, alias="pedalEdema")
    anemia: Optional[str] = Field(None)

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "age": 45,
                "bloodPressure": 150,
                "specificGravity": 1.020,
                "albumin": 3,
                "sugar": 0,
                "bloodGlucoseRandom": 130,
                "bloodUrea": 36,
                "serumCreatinine": 2.1,
                "sodium": 135,
                "potassium": 4.5,
                "hemoglobin": 12.5,
                "packedCellVolume": 38,
                "whiteBloodCellCount": 7800,
                "redBloodCellCount": 4.5,
                "hypertension": "yes",
                "diabetesMellitus": "yes",
                "coronaryArteryDisease": "no",
                "appetite": "good",
                "pedalEdema": "no",
                "anemia": "no"
            }
        }


# ── Response ─────────────────────────────────────────────

class FeatureExplanation(BaseModel):
    """SHAP explanation for a single feature."""
    feature: str
    value: float
    shap_value: float = Field(..., alias="shapValue")

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    """
    ML prediction result with SHAP explanations.
    This is the contract that Spring Boot's MlService deserializes.
    """
    risk_score: float = Field(..., alias="riskScore", description="Probability of CKD (0.0–1.0)")
    prediction: str = Field(..., description="ckd or notckd")
    explanations: list[FeatureExplanation] = Field(
        ..., description="Per-feature SHAP values for this prediction, sorted by |SHAP| descending"
    )
    model_version: str = Field(..., alias="modelVersion")

    class Config:
        populate_by_name = True


class ModelInfoResponse(BaseModel):
    """Global model information — used for research paper and dashboard global SHAP."""
    model_version: str = Field(..., alias="modelVersion")
    model_type: str = Field(..., alias="modelType")
    feature_names: list[str] = Field(..., alias="featureNames")
    global_feature_importance: list[FeatureExplanation] = Field(
        ..., alias="globalFeatureImportance"
    )

    class Config:
        populate_by_name = True


class HealthResponse(BaseModel):
    """Health check response for Docker and orchestrator."""
    status: str = "healthy"
    model_loaded: bool = Field(..., alias="modelLoaded")
    model_version: Optional[str] = Field(None, alias="modelVersion")

    class Config:
        populate_by_name = True
```

---

## 5. Verification
Run this quick schema parsing test in your Python terminal:
```python
from app.schemas import PredictionRequest, PredictionResponse

# Test camelCase parsing
payload = {"age": 52, "bloodPressure": 140, "serumCreatinine": 2.4}
req = PredictionRequest.model_validate(payload)
assert req.age == 52
assert req.blood_pressure == 140
assert req.serum_creatinine == 2.4
print("Pydantic schema validation works perfectly!")
```

---

## 6. Next Step Dependency
Now proceed to **`05_ML_SERVICE_MODEL_LOADER_AND_TREE_SHAP.md`** to implement `app/model_loader.py`. The model loader safely imports serialised `.pkl` models or generates robust heuristic fallbacks if no trained file is present.
