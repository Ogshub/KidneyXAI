import json
import shutil

import pytest
from fastapi.testclient import TestClient

from app.main import app, settings


@pytest.mark.parametrize("failure", ["missing", "malformed", "invalid_shape", "model", "preprocessor", "version"])
def test_evaluation_fails_closed(monkeypatch, tmp_path, failure):
    source = settings.model_dir
    for name in (settings.model_filename, settings.preprocessor_filename, "evaluation_report.json"):
        shutil.copy2(source / name, tmp_path / name)
    monkeypatch.setattr(settings, "model_path", str(tmp_path))
    monkeypatch.setattr(settings, "ml_internal_secret", "")

    with TestClient(app) as client:
        assert client.get("/evaluate").json()["status"] == "available"
        report = tmp_path / "evaluation_report.json"
        if failure == "missing":
            report.unlink()
        elif failure == "malformed":
            report.write_text("{", encoding="utf-8")
        elif failure == "invalid_shape":
            report.write_text("[]", encoding="utf-8")
        elif failure == "version":
            data = json.loads(report.read_text(encoding="utf-8"))
            data["model_version"] = "different"
            report.write_text(json.dumps(data), encoding="utf-8")
        else:
            filename = settings.model_filename if failure == "model" else settings.preprocessor_filename
            with (tmp_path / filename).open("ab") as artifact:
                artifact.write(b"tampered")
        response = client.get("/evaluate")
        assert response.status_code == 200
        assert response.json()["status"] == "metrics_unavailable"
        assert response.json()["accuracy"] is None
