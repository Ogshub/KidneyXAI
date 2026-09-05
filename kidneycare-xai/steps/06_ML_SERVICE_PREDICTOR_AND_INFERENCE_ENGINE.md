# Step 06: Machine Learning Service — Predictor & TreeSHAP Inference Engine

## 1. Overview & Objective
In this step, we construct `ml-service/app/predictor.py`.

This module houses the core algorithmic calculation routines of KidneyCare-XAI:
1. Transforming incoming raw clinical JSON dictionaries into numeric feature arrays aligned with trained preprocessors.
2. Executing probability estimation (`model.predict_proba(X)`) to determine the exact continuous risk likelihood ($0.0 \le \text{risk\_score} \le 1.0$) and binary classification (`ckd` vs `notckd`).
3. Computing exact Shapley feature attributions using the cached TreeSHAP explainer (`explainer.shap_values(X)`).
4. Sorting features by their absolute attribution magnitude ($|\phi_i|$) in descending order so the clinical dashboard immediately surfaces the top risk contributors at the top.

---

## 2. Prerequisites
- Completed `04_ML_SERVICE_PYDANTIC_SCHEMAS.md`
- Completed `05_ML_SERVICE_MODEL_LOADER_AND_TREE_SHAP.md`

---

## 3. Why This Is Created Now
1. **Explainability Algorithm**: Standard AI models are black boxes. In nephrology, a clinician will not trust a risk score unless they can see *why* (e.g. $+0.21$ from Serum Creatinine $2.4\text{ mg/dL}$, $+0.14$ from Systolic Blood Pressure $150\text{ mmHg}$, $-0.10$ protective effect from high Hemoglobin).
2. **Matrix Slicing & Multi-class Handling**: TreeSHAP output matrices vary across model architectures (Binary XGBoost returns a 1D array or 2D list; Random Forest returns a 3D tensor). This module safely unifies these diverse tensor representations into a clean, typed list of `FeatureExplanation`.

---

## 4. File Content: `ml-service/app/predictor.py`

Create `kidneycare-xai/ml-service/app/predictor.py`:

```python
"""
KidneyCare-XAI — Predictor

Runs model.predict_proba() + SHAP explanations for a single patient instance.
Handles both real trained models and resilient demo mode.
"""
import logging
from typing import Any

import numpy as np
import pandas as pd

from .model_loader import artifacts
from .schemas import PredictionRequest, PredictionResponse, FeatureExplanation

logger = logging.getLogger(__name__)


def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Generate a risk prediction + SHAP explanations for a single patient.

    If a real model is loaded, uses predict_proba + SHAP.
    If in demo mode, generates defensible synthetic predictions.
    """
    if artifacts.is_loaded:
        return _predict_real(request)
    else:
        return _predict_demo(request)


def _predict_real(request: PredictionRequest) -> PredictionResponse:
    """Run the real trained model + SHAP explainer."""

    # ── Build feature vector ──
    feature_dict = _request_to_feature_dict(request)
    feature_df = pd.DataFrame([feature_dict])

    # ── Preprocess (use the fitted pipeline from training) ──
    if artifacts.preprocessor is not None:
        feature_array = artifacts.preprocessor.transform(feature_df)
    else:
        feature_array = feature_df.values

    # ── Predict ──
    probabilities = artifacts.model.predict_proba(feature_array)
    # Class 1 = CKD probability
    risk_score = float(probabilities[0][1])
    prediction = "ckd" if risk_score >= 0.5 else "notckd"

    # ── SHAP ──
    explanations = _compute_shap(feature_array, feature_dict)

    return PredictionResponse(
        riskScore=round(risk_score, 4),
        prediction=prediction,
        explanations=explanations,
        modelVersion=artifacts.model_version
    )


def _predict_demo(request: PredictionRequest) -> PredictionResponse:
    """
    Generate synthetic predictions for development and integration testing.
    Uses clinical heuristics based on input features to produce
    clinically plausible risk scores and SHAP values.
    """
    feature_dict = _request_to_feature_dict(request)

    risk_factors = 0.0
    total_weight = 0.0

    # Age contribution
    age = feature_dict.get("age", 30)
    if age > 60:
        risk_factors += 0.15
    elif age > 45:
        risk_factors += 0.08
    total_weight += 0.15

    # Creatinine contribution (primary biomarker of glomerular filtration)
    creatinine = feature_dict.get("serum_creatinine", 1.0)
    if creatinine is not None:
        if creatinine > 3.0:
            risk_factors += 0.25
        elif creatinine > 1.5:
            risk_factors += 0.15
        elif creatinine > 1.2:
            risk_factors += 0.05
    total_weight += 0.25

    # Blood pressure contribution
    bp = feature_dict.get("blood_pressure", 120)
    if bp is not None:
        if bp > 140:
            risk_factors += 0.12
        elif bp > 130:
            risk_factors += 0.06
    total_weight += 0.12

    # Hemoglobin contribution (low = higher risk/anemia)
    hemo = feature_dict.get("hemoglobin", 14.0)
    if hemo is not None:
        if hemo < 10:
            risk_factors += 0.18
        elif hemo < 12:
            risk_factors += 0.08
    total_weight += 0.18

    # Diabetes contribution
    diabetes = feature_dict.get("diabetes_mellitus", "no")
    if diabetes and str(diabetes).lower() == "yes":
        risk_factors += 0.10
    total_weight += 0.10

    # Hypertension contribution
    hypertension = feature_dict.get("hypertension", "no")
    if hypertension and str(hypertension).lower() == "yes":
        risk_factors += 0.08
    total_weight += 0.08

    # Normalize to [0.05, 0.95] range
    risk_score = min(max(risk_factors / max(total_weight, 0.01), 0.05), 0.95)
    prediction = "ckd" if risk_score >= 0.5 else "notckd"

    # Generate synthetic SHAP-like explanations
    explanations = _generate_demo_shap(feature_dict, risk_score)

    return PredictionResponse(
        riskScore=round(risk_score, 4),
        prediction=prediction,
        explanations=explanations,
        modelVersion="demo"
    )


def _request_to_feature_dict(request: PredictionRequest) -> dict[str, Any]:
    """Convert a PredictionRequest to a flat feature dictionary using model feature names."""
    return {
        "age": request.age,
        "blood_pressure": request.blood_pressure,
        "specific_gravity": request.specific_gravity,
        "albumin": request.albumin,
        "sugar": request.sugar,
        "red_blood_cells": request.red_blood_cells,
        "pus_cell": request.pus_cell,
        "pus_cell_clumps": request.pus_cell_clumps,
        "bacteria": request.bacteria,
        "blood_glucose_random": request.blood_glucose_random,
        "blood_urea": request.blood_urea,
        "serum_creatinine": request.serum_creatinine,
        "sodium": request.sodium,
        "potassium": request.potassium,
        "hemoglobin": request.hemoglobin,
        "packed_cell_volume": request.packed_cell_volume,
        "white_blood_cell_count": request.white_blood_cell_count,
        "red_blood_cell_count": request.red_blood_cell_count,
        "hypertension": request.hypertension,
        "diabetes_mellitus": request.diabetes_mellitus,
        "coronary_artery_disease": request.coronary_artery_disease,
        "appetite": request.appetite,
        "pedal_edema": request.pedal_edema,
        "anemia": request.anemia,
    }


def _compute_shap(feature_array: np.ndarray, feature_dict: dict) -> list[FeatureExplanation]:
    """Compute SHAP values for a single instance using the loaded explainer."""
    if artifacts.explainer is None:
        logger.warning("SHAP explainer not loaded, returning empty explanations")
        return []

    try:
        shap_values = artifacts.explainer.shap_values(feature_array)

        # Handle diverse SHAP output tensor formats
        if isinstance(shap_values, list):
            # Multi-class output: take positive CKD class (index 1)
            values = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(shap_values.shape) == 3:
            values = shap_values[0, :, 1]
        else:
            values = shap_values[0]

        feature_names = artifacts.feature_names
        explanations = []
        for i, name in enumerate(feature_names):
            if i < len(values):
                val = feature_dict.get(name, 0)
                explanations.append(FeatureExplanation(
                    feature=name,
                    value=float(val) if isinstance(val, (int, float)) and val is not None else 0.0,
                    shapValue=round(float(values[i]), 6)
                ))

        # Sort by absolute impact descending
        explanations.sort(key=lambda x: abs(x.shap_value), reverse=True)
        return explanations

    except Exception as e:
        logger.error(f"SHAP computation failed: {e}")
        return []


def _generate_demo_shap(feature_dict: dict, risk_score: float) -> list[FeatureExplanation]:
    """Generate proportional SHAP explanations for demo mode."""
    demo_contributions = {
        "serum_creatinine": 0.21 * risk_score,
        "blood_pressure": 0.14 * risk_score,
        "hemoglobin": -0.10 * (1 - risk_score),
        "blood_glucose_random": 0.08 * risk_score,
        "age": 0.06 * risk_score,
        "albumin": -0.05 * (1 - risk_score),
        "diabetes_mellitus": 0.07 * risk_score,
        "hypertension": 0.05 * risk_score,
        "blood_urea": 0.04 * risk_score,
        "sodium": -0.03 * (1 - risk_score),
    }

    explanations = []
    for feature, shap_val in demo_contributions.items():
        val = feature_dict.get(feature, 0)
        explanations.append(FeatureExplanation(
            feature=feature,
            value=float(val) if isinstance(val, (int, float)) and val is not None else 0.0,
            shapValue=round(shap_val, 6)
        ))

    explanations.sort(key=lambda x: abs(x.shap_value), reverse=True)
    return explanations
```

---

## 5. Verification
Run an end-to-end inference test in Python:
```python
from app.schemas import PredictionRequest
from app.predictor import predict

sample = PredictionRequest(
    age=58,
    bloodPressure=155,
    serumCreatinine=2.6,
    hemoglobin=10.2,
    diabetesMellitus="yes"
)

result = predict(sample)
print(f"Risk Score: {result.risk_score}")
print(f"Prediction: {result.prediction}")
print(f"Top Contributing Feature: {result.explanations[0].feature} (SHAP={result.explanations[0].shap_value})")

assert 0.0 <= result.risk_score <= 1.0
assert result.prediction in ["ckd", "notckd"]
assert len(result.explanations) > 0
```

---

## 6. Next Step Dependency
Now proceed to **`07_ML_SERVICE_FASTAPI_APP_AND_ENDPOINTS.md`** to wrap this predictor in a high-performance FastAPI application with endpoints for `/predict`, `/model-info`, and `/health`.
