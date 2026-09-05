# Step 05: Machine Learning Service — Model Loader & Artifact Singleton

## 1. Overview & Objective
In this step, we build `ml-service/app/model_loader.py`.

In production ML serving, disk I/O and deserialization of heavy Scikit-Learn/XGBoost trees (`joblib.load()`) are expensive operations taking hundreds of milliseconds.
This module creates a **Singleton artifact cache** (`ModelArtifacts`) that:
1. Deserializes the trained model pipeline, feature scalers, encoders, and TreeSHAP explainer exactly **once** upon application startup.
2. Caches the artifacts in memory for instantaneous $O(1)$ reuse across concurrent HTTP requests.
3. Implements an automated **Demo / Fallback Mode** so that the entire full-stack platform runs seamlessly even before research training is performed or model files are generated.

---

## 2. Prerequisites
- Completed `03_ML_SERVICE_ENVIRONMENT_AND_CONFIG.md` (specifically `app/config.py`)
- Completed `04_ML_SERVICE_PYDANTIC_SCHEMAS.md`

---

## 3. Why This Is Created Now
1. **Performance Requirement**: If model loading occurred inside the `/predict` route, every user submitting a health assessment would trigger disk reads, serial unpickling, and garbage collection, causing response times to skyrocket and crashing the service under load.
2. **Resilience & Developer Experience**: By providing a graceful fallback (`_load_demo_mode`), frontend developers and backend engineers can build and test without having to train machine learning models first.

---

## 4. File Content: `ml-service/app/model_loader.py`

Create `kidneycare-xai/ml-service/app/model_loader.py`:

```python
"""
KidneyCare-XAI — Model Loader

Loads the trained ML model, preprocessing pipeline, and SHAP explainer
ONCE at application startup. Per-request loading would be unacceptably slow.
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

            self.is_loaded = self.model is not None
            if self.is_loaded:
                logger.info(
                    f"All artifacts loaded successfully. "
                    f"Model: {self.model_type}, Version: {self.model_version}"
                )
            else:
                logger.warning("Model not loaded — falling back to demo mode")
                self._load_demo_mode()

        except Exception as e:
            logger.error(f"Error loading model artifacts: {e}")
            self._load_demo_mode()

    def _load_demo_mode(self) -> None:
        """
        Set up demo mode with synthetic predictions.
        Used when model artifacts haven't been trained yet.
        """
        self.is_loaded = False
        self.model_version = "demo"
        self.model_type = "DemoMode"
        # 24 UCI CKD dataset clinical feature names
        self.feature_names = [
            "age", "blood_pressure", "specific_gravity", "albumin", "sugar",
            "red_blood_cells", "pus_cell", "pus_cell_clumps", "bacteria",
            "blood_glucose_random", "blood_urea", "serum_creatinine",
            "sodium", "potassium", "hemoglobin", "packed_cell_volume",
            "white_blood_cell_count", "red_blood_cell_count",
            "hypertension", "diabetes_mellitus", "coronary_artery_disease",
            "appetite", "pedal_edema", "anemia"
        ]
        logger.info("Running in DEMO mode — predictions are synthetic")


# ── Singleton instance ──
artifacts = ModelArtifacts()
```

---

## 5. Verification
Test artifact initialization in Python:
```python
from app.model_loader import artifacts

artifacts.load()
assert len(artifacts.feature_names) == 24
assert artifacts.model_version in ["1.0", "demo"]
print("ModelLoader correctly initialized singleton in memory!")
```

---

## 6. Next Step Dependency
Now that `artifacts` is ready to serve models and features from memory, proceed to **`06_ML_SERVICE_PREDICTOR_AND_INFERENCE_ENGINE.md`** to implement `app/predictor.py` which computes model probabilities and exact SHAP attributions.
