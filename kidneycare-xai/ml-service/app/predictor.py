"""
KidneyCare-XAI — Predictor (Phase 2)

Key improvements:
  - Strict transformed-to-original feature mapping using preprocessor metadata.
  - Dimension alignment checks (transformed features vs SHAP output).
  - Signed sum aggregation for encoded columns belonging to the same original feature.
  - Preserves SHAP additivity in log-odds model margin space.
  - Returns explicit 'model_unavailable' or 'explanation_unavailable' states instead of
    generating misleading synthetic SHAP values or silently substituting heuristics.
"""
import logging
from typing import Any, Tuple

import numpy as np
import pandas as pd

from .model_loader import artifacts
from .schemas import PredictionRequest, PredictionResponse, FeatureExplanation

logger = logging.getLogger(__name__)


def predict(request: PredictionRequest) -> PredictionResponse:
    """
    Generate risk prediction + SHAP explanations for a single clinical observation.
    Returns explicit error/unavailable states when artifacts are not loaded.
    """
    if not artifacts.is_loaded or artifacts.model is None or artifacts.preprocessor is None:
        logger.warning("Predict requested but model artifacts are not loaded.")
        return PredictionResponse(
            riskScore=0.0,
            prediction="unavailable",
            explanations=[],
            modelVersion="unavailable",
            isDemoMode=True,
            explanationStatus="model_unavailable",
        )

    return _predict_real(request)


def _predict_real(request: PredictionRequest) -> PredictionResponse:
    """Run real model inference and verified SHAP attribution mapping."""
    feature_dict = _request_to_feature_dict(request)
    feature_df = pd.DataFrame([feature_dict])

    # ── Preprocess ──
    try:
        feature_array = artifacts.preprocessor.transform(feature_df)
    except Exception as e:
        logger.error(f"Preprocessor transform failed: {e}", exc_info=True)
        return PredictionResponse(
            riskScore=0.0,
            prediction="error",
            explanations=[],
            modelVersion=artifacts.model_version,
            isDemoMode=False,
            explanationStatus="preprocessing_failed",
        )

    # ── Probability Prediction ──
    try:
        probabilities = artifacts.model.predict_proba(feature_array)
        # Class 1 = CKD
        risk_score = float(probabilities[0][1])
        prediction = "ckd" if risk_score >= 0.5 else "notckd"
    except Exception as e:
        logger.error(f"Model prediction failed: {e}", exc_info=True)
        return PredictionResponse(
            riskScore=0.0,
            prediction="error",
            explanations=[],
            modelVersion=artifacts.model_version,
            isDemoMode=False,
            explanationStatus="inference_failed",
        )

    # ── SHAP Attribution ──
    explanations, explanation_status = _compute_verified_shap(feature_array, feature_dict)

    return PredictionResponse(
        riskScore=round(risk_score, 4),
        prediction=prediction,
        explanations=explanations,
        modelVersion=artifacts.model_version,
        isDemoMode=False,
        explanationStatus=explanation_status,
    )


def _compute_verified_shap(
    feature_array: np.ndarray,
    feature_dict: dict[str, Any]
) -> Tuple[list[FeatureExplanation], str]:
    """
    Compute SHAP values, verify dimension alignment, and map encoded columns
    back to original features using signed sums.
    """
    if artifacts.explainer is None:
        logger.warning("SHAP explainer artifact is not loaded.")
        return [], "explanation_unavailable"

    if not artifacts.mapping_valid or not artifacts.transformed_feature_names:
        logger.warning("Feature mapping is invalid or uninitialized.")
        return [], "explanation_unavailable"

    try:
        shap_values = artifacts.explainer.shap_values(feature_array)

        # Normalize SHAP output shape
        if isinstance(shap_values, list):
            # Binary classification: index 1 corresponds to positive CKD class
            values = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
        elif len(np.shape(shap_values)) == 3:
            values = shap_values[0, :, 1]
        elif len(np.shape(shap_values)) == 2:
            values = shap_values[0]
        else:
            values = shap_values

        values = np.asarray(values).flatten()

        # Dimension verification
        expected_dim = len(artifacts.transformed_feature_names)
        if len(values) != expected_dim:
            logger.error(
                f"SHAP output dimension mismatch: got {len(values)}, expected {expected_dim}. "
                "Refusing to display misaligned feature explanations."
            )
            return [], "dimension_mismatch"

        # ── Group transformed attributions back to original features (Signed Sum) ──
        # Log-odds additivity: sum of signed contributions over all encoded columns
        # belonging to original feature f equals the net contribution of feature f.
        grouped_shap: dict[str, float] = {f: 0.0 for f in artifacts.feature_names}

        for idx, t_col in enumerate(artifacts.transformed_feature_names):
            orig_col = artifacts.feature_mapping.get(t_col, t_col)
            if orig_col not in grouped_shap:
                grouped_shap[orig_col] = 0.0
            grouped_shap[orig_col] += float(values[idx])

        explanations = []
        for feat in artifacts.feature_names:
            raw_val = feature_dict.get(feat, 0)
            numeric_val = (
                float(raw_val)
                if isinstance(raw_val, (int, float)) and not np.isnan(raw_val)
                else 0.0
            )
            explanations.append(
                FeatureExplanation(
                    feature=feat,
                    value=numeric_val,
                    shapValue=round(grouped_shap.get(feat, 0.0), 6),
                )
            )

        # Sort by absolute SHAP value descending (highest impact first)
        explanations.sort(key=lambda x: abs(x.shap_value), reverse=True)
        return explanations, "available"

    except Exception as e:
        logger.error(f"SHAP computation or mapping error: {e}", exc_info=True)
        return [], "explanation_unavailable"


def _request_to_feature_dict(request: PredictionRequest) -> dict[str, Any]:
    """Convert a PredictionRequest to a dictionary with exact model feature names."""
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
