"""
KidneyCare-XAI — Model Loader

Loads the trained ML model, preprocessing pipeline, SHAP explainer,
feature mappings, and evaluation reports ONCE at application startup.
Per-request loading would be unacceptably slow.
"""
import hashlib
import json
import logging
from pathlib import Path
from typing import Optional, Any

import joblib
import numpy as np

from .config import settings

logger = logging.getLogger(__name__)


class ModelArtifacts:
    """Container for all ML artifacts loaded at startup."""

    def __init__(self):
        self._reset()

    def _reset(self) -> None:
        self.model = None
        self.preprocessor = None
        self.explainer = None
        self.feature_names: list[str] = []
        self.transformed_feature_names: list[str] = []
        self.feature_mapping: dict[str, str] = {}  # transformed_col -> original_col
        self.global_importance: list[dict] = []   # pre-computed mean(|SHAP|)
        self.model_version: str = settings.model_version
        self.model_type: str = "unknown"
        self.is_loaded: bool = False
        self.mapping_valid: bool = False
        self.evaluation_fingerprint: str | None = None

    def current_evaluation_fingerprint(self) -> str:
        model = settings.model_dir / settings.model_filename
        preprocessor = settings.model_dir / settings.preprocessor_filename
        with model.open("rb") as stream:
            model_hash = hashlib.file_digest(stream, "sha256").hexdigest()
        with preprocessor.open("rb") as stream:
            preprocessor_hash = hashlib.file_digest(stream, "sha256").hexdigest()
        return f"model:{model_hash}_prep:{preprocessor_hash}"

    def load(self) -> None:
        """Load all artifacts from disk. Called once at FastAPI startup."""
        self._reset()
        model_dir = settings.model_dir

        if not model_dir.exists():
            logger.warning(
                f"Model directory '{model_dir}' does not exist. "
                "ML service will report model_unavailable."
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
                with open(feature_names_path, "r", encoding="utf-8") as f:
                    self.feature_names = json.load(f)
                logger.info(f"Loaded {len(self.feature_names)} original feature names")

            # ── Build or load transformed feature mapping ──
            self._build_feature_mapping()

            # ── Load pre-computed global importance ──
            global_importance_path = model_dir / "global_importance.json"
            if global_importance_path.exists():
                with open(global_importance_path, "r", encoding="utf-8") as f:
                    self.global_importance = json.load(f)
                logger.info(f"Loaded global SHAP importance ({len(self.global_importance)} features)")

            self.is_loaded = (self.model is not None and self.preprocessor is not None)
            if self.is_loaded:
                self.evaluation_fingerprint = self.current_evaluation_fingerprint()
                logger.info(
                    f"All artifacts loaded successfully. "
                    f"Model: {self.model_type}, Version: {self.model_version}, "
                    f"Mapping valid: {self.mapping_valid}"
                )
                self._warmup()
            else:
                logger.warning("Model or preprocessor not loaded — demo mode only")
                self._load_demo_mode()

        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}", exc_info=True)
            self._load_demo_mode()

    def _build_feature_mapping(self) -> None:
        """
        Derive mapping from transformed columns back to original feature names.
        Inspects preprocessor ColumnTransformer transformers_ metadata and handles
        both OneHotEncoder and OrdinalEncoder cleanly.
        """
        if self.preprocessor is None:
            self.mapping_valid = False
            return

        try:
            # Try getting feature names out directly from preprocessor
            if hasattr(self.preprocessor, "get_feature_names_out"):
                self.transformed_feature_names = list(self.preprocessor.get_feature_names_out())
            else:
                self.transformed_feature_names = list(self.feature_names)

            mapping = {}
            # Inspect transformers in ColumnTransformer
            if hasattr(self.preprocessor, "transformers_"):
                for name, trans, cols in self.preprocessor.transformers_:
                    if name == "remainder" and trans == "drop":
                        continue
                    # Check if the transformer has an inner encoder with get_feature_names_out
                    if hasattr(trans, "named_steps"):
                        inner_last = trans.steps[-1][1]
                        if hasattr(inner_last, "get_feature_names_out"):
                            sub_names = inner_last.get_feature_names_out(cols)
                            for sub_name in sub_names:
                                # Find which original col this belongs to
                                for c in cols:
                                    if sub_name == c or sub_name.startswith(c + "_") or f"__{c}" in sub_name:
                                        mapping[sub_name] = c
                                        break
                                else:
                                    # Fallback
                                    mapping[sub_name] = cols[0]
                                continue

                    # Direct or prefix matching for transformed names
                    for col in cols:
                        prefixed = f"{name}__{col}"
                        mapping[prefixed] = col
                        mapping[col] = col

            # Fallback pass for any unmapped transformed columns
            for t_col in self.transformed_feature_names:
                if t_col not in mapping:
                    clean = t_col.split("__", 1)[-1] if "__" in t_col else t_col
                    # Match against raw feature names
                    matched = None
                    for orig in self.feature_names:
                        if clean == orig or clean.startswith(orig + "_"):
                            matched = orig
                            break
                    mapping[t_col] = matched if matched else clean

            self.feature_mapping = mapping
            self.mapping_valid = len(self.transformed_feature_names) > 0
            logger.info(
                f"Feature mapping built: {len(self.transformed_feature_names)} transformed -> "
                f"{len(set(mapping.values()))} original features"
            )
        except Exception as e:
            logger.error(f"Failed to build feature mapping: {e}")
            self.mapping_valid = False

    def _warmup(self) -> None:
        """Run dummy prediction to warm up JIT and verify pipeline."""
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
            logger.info("Model warm-up complete — pipeline verified")
        except Exception as e:
            logger.warning(f"Warm-up failed: {e}")

    def _load_demo_mode(self) -> None:
        """Set up demo state. Model is flagged NOT loaded."""
        self.is_loaded = False
        self.mapping_valid = False
        self.model_version = "demo"
        self.model_type = "DemoMode"
        self.feature_names = [
            "age", "blood_pressure", "specific_gravity", "albumin", "sugar",
            "red_blood_cells", "pus_cell", "pus_cell_clumps", "bacteria",
            "blood_glucose_random", "blood_urea", "serum_creatinine",
            "sodium", "potassium", "hemoglobin", "packed_cell_volume",
            "white_blood_cell_count", "red_blood_cell_count",
            "hypertension", "diabetes_mellitus", "coronary_artery_disease",
            "appetite", "pedal_edema", "anemia"
        ]
        self.global_importance = []
        logger.info("ModelArtifacts initialized in unverified demo mode")


# ── Singleton instance ──
artifacts = ModelArtifacts()
