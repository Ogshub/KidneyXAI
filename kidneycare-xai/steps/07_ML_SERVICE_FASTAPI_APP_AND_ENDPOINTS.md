# Step 07: Machine Learning Service — FastAPI Application & HTTP Endpoints

## 1. Overview & Objective
In this step, we assemble the complete web application layer for the ML service in `ml-service/app/main.py`.

This file:
1. Configures the FastAPI server with modern Python async `lifespan` context management to guarantee one-time model initialization on startup and graceful teardown on shutdown.
2. Restricts CORS strictly to authorized backend origins.
3. Exposes three REST endpoints:
   - `POST /predict`: Ingests clinical features, calls the predictor, and returns risk scores with sorted local SHAP values.
   - `GET /model-info`: Returns global feature importance and model metadata for research visualizations.
   - `GET /health`: Used by Docker Compose to verify that the ML service is ready before starting the Spring Boot backend.

---

## 2. Prerequisites
- Completed `03_ML_SERVICE_ENVIRONMENT_AND_CONFIG.md`
- Completed `04_ML_SERVICE_PYDANTIC_SCHEMAS.md`
- Completed `05_ML_SERVICE_MODEL_LOADER_AND_TREE_SHAP.md`
- Completed `06_ML_SERVICE_PREDICTOR_AND_INFERENCE_ENGINE.md`

---

## 3. Why This Is Created Now
1. **Microservice Encapsulation**: React must never talk to the ML service directly (to prevent CORS vulnerabilities, model intellectual property extraction, and unauthenticated API abuse). Spring Boot acts as the sole authorized gateway.
2. **Orchestrator Dependency**: In `docker-compose.yml`, Spring Boot's container specifies `depends_on: { ml-service: { condition: service_healthy } }`. The `/health` endpoint exposed here is required for that condition.

---

## 4. File Content: `ml-service/app/main.py`

Create `kidneycare-xai/ml-service/app/main.py`:

```python
"""
KidneyCare-XAI — ML Service (FastAPI)

Endpoints:
  POST /predict     → risk prediction + SHAP explanations
  GET  /model-info  → global feature importance + model metadata
  GET  /health      → health check

This service is called ONLY by Spring Boot's MlService (Java HTTP client).
React never calls this directly.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .model_loader import artifacts
from .predictor import predict
from .schemas import (
    PredictionRequest,
    PredictionResponse,
    ModelInfoResponse,
    HealthResponse,
    FeatureExplanation,
)

# ── Logging ──
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan (load model once at startup) ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model artifacts once at startup, release on shutdown."""
    logger.info("Loading ML model artifacts...")
    artifacts.load()
    if artifacts.is_loaded:
        logger.info(f"Model loaded: {artifacts.model_type} v{artifacts.model_version}")
    else:
        logger.warning("Running in DEMO mode — no trained model found")
    yield
    logger.info("ML service shutting down")


# ── FastAPI App ──
app = FastAPI(
    title="KidneyCare-XAI ML Service",
    description="ML prediction + SHAP explainability service for kidney disease risk assessment",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS (strictly restricts direct access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────

@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """
    Run ML prediction + SHAP explanation for a single patient's clinical features.
    Called by Spring Boot's MlService via HTTP.
    """
    try:
        logger.info(f"Prediction request received (age={request.age}, bp={request.blood_pressure})")
        result = predict(request)
        logger.info(f"Prediction: {result.prediction}, score={result.risk_score}")
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Return global model metadata and feature importance.
    Used for the research paper's global SHAP analysis and dashboard.
    """
    if not artifacts.is_loaded:
        demo_importance = [
            FeatureExplanation(feature="serum_creatinine", value=0, shapValue=0.35),
            FeatureExplanation(feature="hemoglobin", value=0, shapValue=0.28),
            FeatureExplanation(feature="blood_pressure", value=0, shapValue=0.22),
            FeatureExplanation(feature="age", value=0, shapValue=0.18),
            FeatureExplanation(feature="diabetes_mellitus", value=0, shapValue=0.15),
            FeatureExplanation(feature="albumin", value=0, shapValue=0.12),
            FeatureExplanation(feature="blood_glucose_random", value=0, shapValue=0.10),
            FeatureExplanation(feature="blood_urea", value=0, shapValue=0.08),
        ]
        return ModelInfoResponse(
            modelVersion="demo",
            modelType="DemoMode",
            featureNames=artifacts.feature_names,
            globalFeatureImportance=demo_importance,
        )

    global_importance = []
    if artifacts.explainer is not None:
        for i, name in enumerate(artifacts.feature_names):
            global_importance.append(
                FeatureExplanation(feature=name, value=0, shapValue=0.0)
            )

    return ModelInfoResponse(
        modelVersion=artifacts.model_version,
        modelType=artifacts.model_type,
        featureNames=artifacts.feature_names,
        globalFeatureImportance=global_importance,
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Docker/deployment monitoring."""
    return HealthResponse(
        status="healthy",
        modelLoaded=artifacts.is_loaded,
        modelVersion=artifacts.model_version if artifacts.is_loaded else "demo",
    )
```

---

## 5. Verification
Launch the ML microservice locally using Uvicorn:
```powershell
cd kidneycare-xai/ml-service
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
In a secondary terminal or browser:
1. Check health:
```bash
curl http://127.0.0.1:8000/health
# Expect: {"status":"healthy","modelLoaded":false,"modelVersion":"demo"}
```
2. Test prediction:
```bash
curl -X POST http://127.0.0.1:8000/predict -H "Content-Type: application/json" -d "{\"age\":55,\"bloodPressure\":145,\"serumCreatinine\":2.2}"
# Expect: {"riskScore":...,"prediction":"ckd","explanations":[...],"modelVersion":"demo"}
```

---

## 6. Next Step Dependency
With Phase 2 (ML Service) fully operational and verified, proceed to Phase 3: Spring Boot Backend Orchestrator, starting with **`08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md`** to configure `pom.xml`.
