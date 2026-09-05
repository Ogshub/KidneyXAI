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
