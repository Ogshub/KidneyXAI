"""
Automated Tests for SHAP Correctness, Feature Mapping, and Additivity
KidneyCare-XAI — Phase 2 Research Integrity Verification

Tests:
1. Feature dimension alignment (transformed feature space matches SHAP explainer shape).
2. Original feature mapping (all transformed features map back to valid original features).
3. Positive and negative attribution aggregation (signed sum correctly combines attributions).
4. OneHotEncoder / dummy feature mapping simulation.
5. SHAP additivity within numerical tolerance (sum(SHAP) + expected_value == margin).
6. Robustness against unknown categories.
7. Robustness against missing input values.
"""
import math
import numpy as np
import pandas as pd
import pytest
from pathlib import Path

# Adjust path for ml-service imports
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.model_loader import artifacts
from app.predictor import predict, _compute_verified_shap, _request_to_feature_dict
from app.schemas import PredictionRequest


@pytest.fixture(scope="module", autouse=True)
def load_model_artifacts():
    """Ensure artifacts are loaded before running tests."""
    artifacts.load()
    assert artifacts.is_loaded, "Model artifacts must be loaded for SHAP verification tests"


def test_feature_dimension_alignment():
    """Verify that preprocessor transformed dimension matches model and SHAP explainer input dimension."""
    dummy = pd.DataFrame([{
        "age": 45, "blood_pressure": 80, "specific_gravity": 1.020,
        "albumin": 0, "sugar": 0, "blood_glucose_random": 110,
        "blood_urea": 36, "serum_creatinine": 1.1, "sodium": 138,
        "potassium": 4.5, "hemoglobin": 15.2, "packed_cell_volume": 44,
        "white_blood_cell_count": 7500, "red_blood_cell_count": 5.1,
        "red_blood_cells": "normal", "pus_cell": "normal",
        "pus_cell_clumps": "notpresent", "bacteria": "notpresent",
        "hypertension": "no", "diabetes_mellitus": "no",
        "coronary_artery_disease": "no", "appetite": "good",
        "pedal_edema": "no", "anemia": "no",
    }])

    x_transformed = artifacts.preprocessor.transform(dummy)
    transformed_dim = x_transformed.shape[1]

    # Verify model expectation
    expected_dim = getattr(artifacts.model, "n_features_in_", transformed_dim)
    assert transformed_dim == expected_dim, f"Transformed dim {transformed_dim} != model dim {expected_dim}"

    # Verify SHAP explainer output dimension
    shap_vals = artifacts.explainer.shap_values(x_transformed)
    if isinstance(shap_vals, list):
        shap_dim = shap_vals[0].shape[1]
    elif len(shap_vals.shape) == 3:
        shap_dim = shap_vals.shape[1]
    else:
        shap_dim = shap_vals.shape[1]
    assert transformed_dim == shap_dim, f"Transformed dim {transformed_dim} != SHAP dim {shap_dim}"


def test_original_feature_mapping():
    """Verify that every transformed feature maps back to an original clinical feature name."""
    assert artifacts.mapping_valid, "Feature mapping must be valid"
    assert len(artifacts.transformed_feature_names) == 24

    for t_col in artifacts.transformed_feature_names:
        orig_col = artifacts.feature_mapping.get(t_col)
        assert orig_col is not None, f"Transformed feature {t_col} has no mapping"
        assert orig_col in artifacts.feature_names, f"Mapped feature {orig_col} not in original feature names"


def test_positive_and_negative_attribution_aggregation():
    """
    Verify that signed sum aggregation preserves net positive and negative contributions
    when multi-column encodings are combined.
    """
    # Create synthetic mapped columns
    transformed_names = ["cat__htn_yes", "cat__htn_no", "num__creatinine"]
    mapping = {
        "cat__htn_yes": "hypertension",
        "cat__htn_no": "hypertension",
        "num__creatinine": "serum_creatinine"
    }

    # Synthetic SHAP values: htn_yes = +0.45, htn_no = -0.15 -> net should be +0.30
    synth_shap = np.array([0.45, -0.15, 0.80])

    grouped = {}
    for idx, t_col in enumerate(transformed_names):
        orig = mapping[t_col]
        grouped[orig] = grouped.get(orig, 0.0) + synth_shap[idx]

    assert math.isclose(grouped["hypertension"], 0.30, abs_tol=1e-6), (
        f"Signed sum mismatch: expected 0.30, got {grouped['hypertension']}"
    )
    assert math.isclose(grouped["serum_creatinine"], 0.80, abs_tol=1e-6)
    # Sum of grouped equals sum of raw
    assert math.isclose(sum(grouped.values()), sum(synth_shap), abs_tol=1e-6)


def test_one_hot_encoder_feature_mapping_simulation():
    """Verify that mock OneHotEncoder columns are properly grouped by prefix."""
    from sklearn.preprocessing import OneHotEncoder

    categories = [["no", "yes"], ["normal", "abnormal"]]
    ohe = OneHotEncoder(categories=categories, sparse_output=False)
    ohe.fit([["no", "normal"], ["yes", "abnormal"]])
    out_names = ohe.get_feature_names_out(["hypertension", "red_blood_cells"])

    # Simulate mapping derivation
    mapping = {}
    for name in out_names:
        for orig in ["hypertension", "red_blood_cells"]:
            if name.startswith(orig + "_"):
                mapping[name] = orig

    assert len(mapping) == 4
    assert mapping["hypertension_yes"] == "hypertension"
    assert mapping["hypertension_no"] == "hypertension"
    assert mapping["red_blood_cells_normal"] == "red_blood_cells"


def test_shap_additivity_within_numerical_tolerance():
    """
    Verify that local SHAP values satisfy the Efficiency Axiom:
    sum(phi_i) + expected_value == model margin output (log-odds).
    """
    req = PredictionRequest(
        age=52,
        bloodPressure=140,
        specificGravity=1.015,
        albumin=2,
        sugar=1,
        serumCreatinine=2.4,
        bloodUrea=55,
        bloodGlucoseRandom=160,
        hemoglobin=10.5,
        packedCellVolume=32,
        whiteBloodCellCount=9200,
        redBloodCellCount=3.8,
        hypertension="yes",
        diabetesMellitus="yes",
    )

    feature_dict = _request_to_feature_dict(req)
    feature_df = pd.DataFrame([feature_dict])
    x_transformed = artifacts.preprocessor.transform(feature_df)

    # Margin prediction from XGBoost
    margin = artifacts.model.predict(x_transformed, output_margin=True)[0]

    # Compute raw SHAP
    shap_vals = artifacts.explainer.shap_values(x_transformed)
    if isinstance(shap_vals, list):
        raw_vals = shap_vals[1][0] if len(shap_vals) > 1 else shap_vals[0][0]
    elif len(shap_vals.shape) == 3:
        raw_vals = shap_vals[0, :, 1]
    else:
        raw_vals = shap_vals[0]

    ev = artifacts.explainer.expected_value
    if isinstance(ev, (list, np.ndarray)):
        ev = float(ev[1] if len(ev) > 1 else ev[0])

    sum_raw_shap = float(np.sum(raw_vals))
    reconstructed_margin = ev + sum_raw_shap

    # Efficiency axiom verification in log-odds space
    assert math.isclose(reconstructed_margin, margin, abs_tol=1e-4), (
        f"SHAP Efficiency Axiom failed: ev ({ev}) + sum_shap ({sum_raw_shap}) = "
        f"{reconstructed_margin} != margin ({margin})"
    )

    # Now verify that grouped attributions in predictor preserve the exact same sum
    res = predict(req)
    assert res.explanation_status == "available"
    sum_grouped = sum(e.shap_value for e in res.explanations)
    assert math.isclose(sum_grouped, sum_raw_shap, abs_tol=1e-4), (
        f"Grouped sum {sum_grouped} != raw sum {sum_raw_shap}"
    )


def test_unknown_categories():
    """Verify preprocessor handles unexpected category values without crashing."""
    req = PredictionRequest(age=40, bloodPressure=120)
    feature_dict = _request_to_feature_dict(req)
    # Exercise the fitted transform independently of the stricter API boundary.
    feature_dict["hypertension"] = "unrecognized_category_value"
    feature_dict["appetite"] = "strange_input"
    feature_df = pd.DataFrame([feature_dict])

    # Should not raise exception
    x = artifacts.preprocessor.transform(feature_df)
    assert x.shape[0] == 1
    assert not np.isnan(x).any(), "Transformed features must not contain NaN"


def test_missing_input_values():
    """Verify that predictions and SHAP work cleanly when optional values are None."""
    req = PredictionRequest(
        age=35,
        bloodPressure=80
        # All optional lab values omitted
    )
    res = predict(req)
    assert res.prediction in ("ckd", "notckd")
    assert 0.0 <= res.risk_score <= 1.0
    assert res.explanation_status == "available"
    assert len(res.explanations) == 24
