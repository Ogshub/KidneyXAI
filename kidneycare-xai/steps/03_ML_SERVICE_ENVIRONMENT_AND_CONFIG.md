# Step 03: Machine Learning Service — Environment & Configuration

## 1. Overview & Objective
In this step, we configure the Python runtime environment, dependency manifests, Dockerfile, and Pydantic-based application settings for the Machine Learning and Explainable AI (XAI) microservice (`ml-service/`).

The ML service is responsible for:
- Loading the trained Chronic Kidney Disease (CKD) predictive model (e.g. XGBoost/Random Forest).
- Generating local feature attribution explanations using TreeSHAP.
- Serving low-latency HTTP predictions to the Spring Boot orchestrator.

---

## 2. Prerequisites
- Completed `01_PROJECT_SCAFFOLDING_AND_ROOT_CONFIG.md`
- Completed `02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md`
- Python 3.10+ installed locally (or Python 3.11)

---

## 3. Why This Is Created Now
Before writing Python endpoints or mathematical predictor routines, we must:
1. Lock specific compatible versions of `scikit-learn`, `xgboost`, and `shap` (which often have tight C-extension binary dependencies).
2. Establish dynamic configuration loading via `pydantic-settings` so model artifact paths and ports can be injected via environment variables in Docker or overridden in local development.

---

## 4. File Contents & Detailed Explanation

### 4.1 `ml-service/requirements.txt`
Create `kidneycare-xai/ml-service/requirements.txt`:
```txt
# ── Core ──
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.2
pydantic-settings==2.1.0

# ── ML ──
pandas==2.1.4
numpy==1.26.2
scikit-learn==1.3.2
xgboost==2.0.3
shap==0.44.0
joblib==1.3.2

# ── Utilities ──
python-dotenv==1.0.0
httpx==0.25.2

# ── Testing ──
pytest==7.4.3
pytest-asyncio==0.23.2
httpx==0.25.2
```

#### Why these libraries?
- `fastapi`: High-performance asynchronous REST API framework with native OpenAPI doc generation.
- `uvicorn`: ASGI server for running FastAPI asynchronously.
- `xgboost`: Gradient boosted decision trees, recognized as state-of-the-art for tabular clinical risk prediction.
- `shap`: Implements Lundberg & Lee's Shapley Additive Explanations. `TreeSHAP` computes exact local Shapley values in polynomial time $O(TLD^2)$.
- `pydantic-settings`: Reads system environment variables with type coercion and fallback defaults.

---

### 4.2 `ml-service/app/config.py`
Create `kidneycare-xai/ml-service/app/config.py`:
```python
"""
KidneyCare-XAI — ML Service Configuration
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Model paths ──
    model_path: str = "models"
    model_filename: str = "kidney_model.pkl"
    preprocessor_filename: str = "preprocessor.pkl"
    explainer_filename: str = "shap_explainer.pkl"
    feature_names_filename: str = "feature_names.json"
    model_version: str = "1.0"

    # ── Server ──
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"

    # ── CORS (only needed if called directly, normally behind Spring Boot) ──
    allowed_origins: list[str] = ["http://localhost:8080"]

    @property
    def model_dir(self) -> Path:
        return Path(self.model_path)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
```

#### Explanation of Logic:
- `BaseSettings`: Automatically maps environment variables (e.g. `MODEL_PATH=/custom/models`) to the typed class attributes.
- `model_dir`: Helper property returning a `pathlib.Path` instance for robust cross-platform path manipulation (Windows `\` vs Linux `/`).
- `allowed_origins`: Restricts incoming HTTP calls to the Spring Boot backend port (8080), preventing unauthorized direct browser access.

---

### 4.3 `ml-service/Dockerfile`
Create `kidneycare-xai/ml-service/Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/

# Create models directory (artifacts mounted at runtime)
RUN mkdir -p /app/models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 5. Verification
Create a local Python virtual environment and install dependencies:
```powershell
cd kidneycare-xai/ml-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -c "import fastapi, xgboost, shap; print('Dependencies successfully installed!')"
```
Verify that the print statement outputs without missing DLL or compilation errors.

---

## 6. Next Step Dependency
With the ML environment and configuration ready, proceed to **`04_ML_SERVICE_PYDANTIC_SCHEMAS.md`** to define the strict JSON request and response contracts for all 18 clinical input features and SHAP attribution payloads.
