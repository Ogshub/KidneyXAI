"""
KidneyCare-XAI — Model Loader

Loads the trained ML model, preprocessing pipeline, and SHAP explainer
ONCE at application startup. Per-request loading would be unacceptably slow.
On startup, pre-computes global SHAP importance from global_importance.json.
"""
import json
import logging
from pathlib import Path
from typing import Optional

import joblib
import numpy as np

from .config import settings

logger = logging.getLogger(__name__)


class ModelArtifacts:
    """Container for all ML artifacts loaded at startup."""

    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names: list[str] = []
        self.global_importance: list[dict] = []   # pre-computed mean(|SHAP|)
        self.model_version: str = settings.model_version
        self.model_type: str = "unknown"
        self.is_loaded: bool = False

    def load(self) -> None:
        """Load all artifacts from disk. Called once at FastAPI startup."""
        model_dir = settings.model_dir

        if not model_dir.exists():
            logger.warning(
                f"Model directory '{model_dir}' does not exist. "
                "ML service will run in demo mode with synthetic predictions."
            )
            self._load_demo_mode()
            return

        try:
            # ── Load model ──
            model_path = model_dir / settings.model_filename
            if model_path.exists():
                self.model = joblib.load(model_path)
                self.model_type = type(self.model).__name__
                logger.info(f"Loaded model: {self.model_type} from {model_path}")
            else:
                logger.warning(f"Model file not found: {model_path}")

            # ── Load preprocessor ──
            preprocessor_path = model_dir / settings.preprocessor_filename
            if preprocessor_path.exists():
                self.preprocessor = joblib.load(preprocessor_path)
                logger.info(f"Loaded preprocessor from {preprocessor_path}")

            # ── Load SHAP explainer ──
            explainer_path = model_dir / settings.explainer_filename
            if explainer_path.exists():
                self.explainer = joblib.load(explainer_path)
                logger.info(f"Loaded SHAP explainer from {explainer_path}")

            # ── Load feature names ──
            feature_names_path = model_dir / settings.feature_names_filename
            if feature_names_path.exists():
                with open(feature_names_path, "r") as f:
                    self.feature_names = json.load(f)
                logger.info(f"Loaded {len(self.feature_names)} feature names")

            # ── Load pre-computed global importance ──
            global_importance_path = model_dir / "global_importance.json"
            if global_importance_path.exists():
                with open(global_importance_path, "r") as f:
                    self.global_importance = json.load(f)
                logger.info(f"Loaded global SHAP importance ({len(self.global_importance)} features)")

            self.is_loaded = self.model is not None
            if self.is_loaded:
                logger.info(
                    f"All artifacts loaded successfully. "
                    f"Model: {self.model_type}, Version: {self.model_version}"
                )
                # ── Warm-up: run one dummy prediction to pre-JIT ──
                self._warmup()
            else:
                logger.warning("Model not loaded — falling back to demo mode")
                self._load_demo_mode()

        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}")
            self._load_demo_mode()

    def _warmup(self) -> None:
        """
        Run a single dummy prediction at startup to warm up the JIT.
        Eliminates first-request latency penalty.
        """
        try:
            import pandas as pd
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
            if self.preprocessor is not None:
                x = self.preprocessor.transform(dummy)
            else:
                x = dummy.values
            _ = self.model.predict_proba(x)
            if self.explainer is not None:
                _ = self.explainer.shap_values(x)
            logger.info("Model warm-up complete — first request will be fast")
        except Exception as e:
            logger.warning(f"Warm-up failed (non-critical): {e}")

    def _load_demo_mode(self) -> None:
        """
        Set up demo mode with synthetic predictions.
        Used when model artifacts haven't been trained yet.
        """
        self.is_loaded = False
        self.model_version = "demo"
        self.model_type = "DemoMode"
        # UCI CKD dataset feature names (will be replaced after training)
        self.feature_names = [
            "age", "blood_pressure", "specific_gravity", "albumin", "sugar",
            "red_blood_cells", "pus_cell", "pus_cell_clumps", "bacteria",
            "blood_glucose_random", "blood_urea", "serum_creatinine",
            "sodium", "potassium", "hemoglobin", "packed_cell_volume",
            "white_blood_cell_count", "red_blood_cell_count",
            "hypertension", "diabetes_mellitus", "coronary_artery_disease",
            "appetite", "pedal_edema", "anemia"
        ]
        # Demo global importance based on medical literature
        self.global_importance = [
            {"feature": "serum_creatinine", "mean_abs_shap": 0.285},
            {"feature": "specific_gravity", "mean_abs_shap": 0.194},
            {"feature": "albumin", "mean_abs_shap": 0.176},
            {"feature": "blood_glucose_random", "mean_abs_shap": 0.142},
            {"feature": "hemoglobin", "mean_abs_shap": 0.128},
            {"feature": "blood_pressure", "mean_abs_shap": 0.115},
            {"feature": "hypertension", "mean_abs_shap": 0.098},
            {"feature": "diabetes_mellitus", "mean_abs_shap": 0.087},
            {"feature": "blood_urea", "mean_abs_shap": 0.076},
            {"feature": "age", "mean_abs_shap": 0.062},
        ]
        logger.info("Running in DEMO mode — predictions are synthetic")


# ── Singleton instance ──
artifacts = ModelArtifacts()
