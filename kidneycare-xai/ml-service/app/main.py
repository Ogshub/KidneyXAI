"""
KidneyCare-XAI — ML Service (FastAPI)

Endpoints:
  POST /predict     → risk prediction + SHAP explanations
  GET  /model-info  → global feature importance + model metadata
  GET  /evaluate    → structured evaluation metrics from evaluation_report.json
  GET  /health      → health check

This service is called ONLY by Spring Boot's MlService (Java HTTP client).
React never calls this directly.

Security: If ML_INTERNAL_SECRET is set, all non-/health requests require
the X-Internal-Secret header to match (SEC-02).
"""
import json
import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .config import settings
from .model_loader import artifacts
from .predictor import predict
from .schemas import (
    PredictionRequest,
    PredictionResponse,
    ModelInfoResponse,
    HealthResponse,
    FeatureExplanation,
    ModelEvaluationResponse,
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
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── SEC-02: Internal secret middleware ──
@app.middleware("http")
async def internal_secret_middleware(request: Request, call_next):
    """
    Reject requests that don't carry the correct X-Internal-Secret header
    when ML_INTERNAL_SECRET is configured.
    Health check is always public so orchestration tools can poll it.
    """
    if request.url.path == "/health":
        return await call_next(request)

    secret = settings.ml_internal_secret
    if secret:  # enforcement only when secret is configured
        provided = request.headers.get("X-Internal-Secret", "")
        if provided != secret:
            logger.warning(
                f"Rejected unauthenticated request to {request.url.path} "
                f"from {request.client.host if request.client else 'unknown'}"
            )
            return JSONResponse(
                status_code=403,
                content={"detail": "Forbidden: missing or invalid internal secret"},
            )

    return await call_next(request)


# ── Helper: load evaluation report JSON ──────────────────────────────────────

def _load_evaluation_report() -> Optional[dict]:
    """Return evaluation data only when it describes the loaded artifact pair."""
    if not artifacts.is_loaded:
        return None

    try:
        data = json.loads((settings.model_dir / "evaluation_report.json").read_text(encoding="utf-8"))
        metrics = data["metrics"]
        if (
            data["model_version"] != artifacts.model_version
            or data["model_type"] != artifacts.model_type
            or data["status"] != "available"
            or not isinstance(data["dataset"]["name"], str)
            or type(data["dataset"]["record_count"]) is not int
            or not isinstance(data["dataset"]["class_distribution"], dict)
            or not isinstance(data["training"]["validation_protocol"], str)
            or type(data["training"]["cv_folds"]) is not int
            or any(
                type(metrics[key]) not in (int, float) or not 0 <= metrics[key] <= 1
                for key in ("accuracy", "f1_score", "precision", "recall", "auroc", "specificity")
            )
            or data["artifact_hash"] != artifacts.evaluation_fingerprint
            or data["artifact_hash"] != artifacts.current_evaluation_fingerprint()
        ):
            logger.warning("Evaluation report does not match the loaded model artifacts")
            return None
        return data
    except (OSError, ValueError, KeyError, TypeError):
        logger.warning("Evaluation report unavailable or malformed")
        return None

# ── Endpoints ──────────────────────────────────────────────


@app.post("/predict", response_model=PredictionResponse)
async def predict_risk(request: PredictionRequest):
    """
    Run ML prediction + SHAP explanation for a single patient's clinical features.

    Called by Spring Boot's MlService via HTTP.

    Returns:
        - riskScore (0.0–1.0): probability of CKD
        - prediction: "ckd" or "notckd"
        - explanations: per-feature SHAP values sorted by |SHAP| descending
        - modelVersion: version of the model that produced this result
        - isDemoMode: true when no trained model is available
    """
    if not artifacts.is_loaded:
        raise HTTPException(status_code=503, detail="Trained model artifact is unavailable")

    try:
        result = predict(request)
        logger.info(f"Prediction: {result.prediction}, score={result.risk_score}, demo={result.is_demo_mode}")
        return result
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.get("/model-info", response_model=ModelInfoResponse)
async def get_model_info():
    """
    Return global model metadata and pre-computed feature importance.
    Uses mean(|SHAP|) values computed during training (from global_importance.json).
    Used for the research paper's global SHAP analysis and dashboard.
    """
    global_importance = []
    for item in artifacts.global_importance:
        global_importance.append(
            FeatureExplanation(
                feature=item["feature"],
                value=0.0,
                shapValue=round(item["mean_abs_shap"], 6),
            )
        )

    return ModelInfoResponse(
        modelVersion=artifacts.model_version if artifacts.is_loaded else "demo",
        modelType=artifacts.model_type if artifacts.is_loaded else "DemoMode",
        featureNames=artifacts.feature_names,
        globalFeatureImportance=global_importance,
        isDemoMode=not artifacts.is_loaded,
    )


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for Docker/deployment monitoring."""
    return HealthResponse(
        status="healthy",
        modelLoaded=artifacts.is_loaded,
        modelVersion=artifacts.model_version if artifacts.is_loaded else "demo",
    )


@app.get("/evaluate", response_model=ModelEvaluationResponse)
async def evaluate_model():
    """
    Return structured evaluation metrics loaded from evaluation_report.json.
    This file is generated by the training pipeline — no values are hardcoded.

    Returns metrics_unavailable status when:
    - evaluation_report.json is absent
    - The file is malformed
    - The report's model_version does not match the loaded model
    """
    report = _load_evaluation_report()

    if report is None:
        # Return explicit unavailable status — never substitute hardcoded values
        return ModelEvaluationResponse(
            status="metrics_unavailable",
            modelVersion=artifacts.model_version if artifacts.is_loaded else "demo",
            modelType=artifacts.model_type if artifacts.is_loaded else "unknown",
            datasetName=None,
            datasetRecordCount=None,
            classDistribution=None,
            validationProtocol=None,
            cvFolds=None,
            accuracy=None,
            auroc=None,
            f1Score=None,
            precision=None,
            recall=None,
            specificity=None,
            artifactHash=None,
            trainingDate=None,
            isDemoMode=not artifacts.is_loaded,
        )

    # Extract metrics from report (all Optional — no defaults if key missing)
    metrics = report.get("metrics", {})
    dataset_info = report.get("dataset", {})
    training_info = report.get("training", {})

    top_features = []
    for item in artifacts.global_importance[:10]:
        top_features.append(FeatureExplanation(
            feature=item["feature"],
            value=0.0,
            shapValue=round(item["mean_abs_shap"], 6),
        ))

    return ModelEvaluationResponse(
        status="available",
        modelVersion=report.get("model_version"),
        modelType=report.get("model_type"),
        datasetName=dataset_info.get("name"),
        datasetRecordCount=dataset_info.get("record_count"),
        classDistribution=dataset_info.get("class_distribution"),
        validationProtocol=training_info.get("validation_protocol"),
        cvFolds=training_info.get("cv_folds"),
        accuracy=metrics.get("accuracy"),
        auroc=metrics.get("auroc"),
        f1Score=metrics.get("f1_score"),
        precision=metrics.get("precision"),
        recall=metrics.get("recall"),
        specificity=metrics.get("specificity"),
        artifactHash=report.get("artifact_hash"),
        trainingDate=report.get("training_date"),
        isDemoMode=not artifacts.is_loaded,
        topGlobalFeatures=top_features if top_features else None,
    )
