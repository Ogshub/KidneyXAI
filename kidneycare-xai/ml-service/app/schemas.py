"""
KidneyCare-XAI — Pydantic Request/Response Schemas

Defines the contract between Spring Boot (MlService) and this Python service.
Feature names will be finalized once Dataset A is selected.
"""
from pydantic import BaseModel, Field
from typing import Optional


# ── Request ──────────────────────────────────────────────

class PredictionRequest(BaseModel):
    """
    Clinical features submitted for risk prediction.
    Field names match the trained model's expected feature names.
    These will be updated once Dataset A (e.g. UCI CKD) is finalized.
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
    """Global model information — used for paper/dashboard global SHAP."""
    model_version: str = Field(..., alias="modelVersion")
    model_type: str = Field(..., alias="modelType")
    feature_names: list[str] = Field(..., alias="featureNames")
    global_feature_importance: list[FeatureExplanation] = Field(
        ..., alias="globalFeatureImportance"
    )

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
    """Evaluation metrics for the XGBoost model on validation cohort (H1)."""
    model_version: str = Field(..., alias="modelVersion")
    model_type: str = Field(..., alias="modelType")
    dataset_name: str = Field(..., alias="datasetName")
    accuracy: float
    auroc: float
    f1_score: float = Field(..., alias="f1Score")
    precision: float
    recall: float
    cv_folds: int = Field(..., alias="cvFolds")
    inference_latency_ms: float = Field(..., alias="inferenceLatencyMs")
    top_global_features: list[FeatureExplanation] = Field(..., alias="topGlobalFeatures")

    class Config:
        populate_by_name = True
