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

    # ── Internal authentication (SEC-02) ──
    # Shared secret sent by Spring Boot in X-Internal-Secret header.
    # If set, any request missing or not matching this header is rejected.
    # Leave empty string to disable (development only).
    ml_internal_secret: str = ""

    # ── CORS (only needed if called directly, normally behind Spring Boot) ──
    allowed_origins: list[str] = ["http://localhost:8080"]

    @property
    def model_dir(self) -> Path:
        p = Path(self.model_path)
        if p.exists():
            return p
        # Check relative to ml-service folder (where app/ lives)
        ml_base = Path(__file__).resolve().parent.parent / self.model_path
        if ml_base.exists():
            return ml_base
        return p

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
