import secrets

from fastapi.testclient import TestClient

from app.main import app, settings


def test_predict_fails_closed_when_artifacts_disappear(monkeypatch, tmp_path):
    secret = secrets.token_hex(32)
    monkeypatch.setattr(settings, "ml_internal_secret", secret)
    headers = {"X-Internal-Secret": secret}

    with TestClient(app) as client:
        assert client.get("/health").json()["modelLoaded"] is True
        assert client.get("/evaluate").status_code == 403
        assert client.get("/evaluate", headers=headers).json()["status"] == "available"

    monkeypatch.setattr(settings, "model_path", str(tmp_path))
    with TestClient(app) as client:
        assert client.get("/health").json()["modelLoaded"] is False
        assert client.get("/evaluate", headers=headers).json()["status"] == "metrics_unavailable"
        response = client.post("/predict", headers=headers, json={"age": 42, "bloodPressure": 80})
        assert response.status_code == 503
