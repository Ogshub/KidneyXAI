"""
KidneyCare-XAI — Pydantic Request/Response Schemas (Phase 2)

Changes from Phase 1:
  - PredictionResponse: added isDemoMode field
  - ModelInfoResponse: added isDemoMode field
  - ModelEvaluationResponse: fully restructured — no hardcoded fields;
    all metrics are Optional and sourced from evaluation_report.json
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
    """SHAP explanation for a single (original) feature."""
    feature: str
    value: float
    shap_value: float = Field(..., alias="shapValue")

    class Config:
        populate_by_name = True


class PredictionResponse(BaseModel):
    """
    ML prediction result with SHAP explanations.
    This is the contract that Spring Boot's MlService deserializes.

    isDemoMode: true when no trained model is loaded — frontend should
    display a prominent warning and must NOT persist demo results as research data.
    """
    risk_score: float = Field(..., alias="riskScore", description="Probability of CKD (0.0–1.0)")
    prediction: str = Field(..., description="ckd or notckd")
    explanations: list[FeatureExplanation] = Field(
        ..., description="Per-feature SHAP values for this prediction, sorted by |SHAP| descending"
    )
    model_version: str = Field(..., alias="modelVersion")
    is_demo_mode: bool = Field(False, alias="isDemoMode",
                                description="True when predictions are synthetic — not from trained model")
    explanation_status: str = Field(
        "available",
        alias="explanationStatus",
        description="available | unavailable | demo — indicates reliability of SHAP values"
    )

    class Config:
        populate_by_name = True


class ModelInfoResponse(BaseModel):
    """Global model information — used for paper/dashboard global SHAP."""
    model_version: str = Field(..., alias="modelVersion")
    model_type: str = Field(..., alias="modelType")
    feature_names: list[str] = Field(..., alias="featureNames")
    global_feature_importance: list[FeatureExplanation] = Field(
        ..., alias="globalFeatureImportance"
    )
    is_demo_mode: bool = Field(False, alias="isDemoMode")

    class Config:
        populate_by_name = True


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    model_loaded: bool = Field(..., alias="modelLoaded")
    model_version: Optional[str] = Field(None, alias="modelVersion")

    class Config:
        populate_by_name = True


class ModelEvaluationResponse(BaseModel):
    """
    Structured evaluation metrics loaded from evaluation_report.json.
    All metric fields are Optional — they are absent (not zero) when unavailable.
    'status' indicates whether metrics are available, unavailable, or pending.

    IMPORTANT: This schema replaces the previous hardcoded version.
    No default numeric values are ever substituted for missing metrics.
    """
    status: str = Field(..., description="available | metrics_unavailable | demo")
    model_version: Optional[str] = Field(None, alias="modelVersion")
    model_type: Optional[str] = Field(None, alias="modelType")

    # Dataset provenance
    dataset_name: Optional[str] = Field(None, alias="datasetName")
    dataset_record_count: Optional[int] = Field(None, alias="datasetRecordCount")
    class_distribution: Optional[dict] = Field(None, alias="classDistribution")

    # Validation protocol
    validation_protocol: Optional[str] = Field(None, alias="validationProtocol")
    cv_folds: Optional[int] = Field(None, alias="cvFolds")
    training_date: Optional[str] = Field(None, alias="trainingDate")
    artifact_hash: Optional[str] = Field(None, alias="artifactHash")

    # Computed metrics — all Optional, never substituted with defaults
    accuracy: Optional[float] = Field(None)
    auroc: Optional[float] = Field(None)
    f1_score: Optional[float] = Field(None, alias="f1Score")
    precision: Optional[float] = Field(None)
    recall: Optional[float] = Field(None)
    specificity: Optional[float] = Field(None)

    is_demo_mode: bool = Field(False, alias="isDemoMode")
    top_global_features: Optional[list[FeatureExplanation]] = Field(None, alias="topGlobalFeatures")

    class Config:
        populate_by_name = True
