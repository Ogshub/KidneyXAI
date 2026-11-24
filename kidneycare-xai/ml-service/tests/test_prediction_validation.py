import pytest
from pydantic import ValidationError

from app.schemas import PredictionRequest


def test_missing_measurements_stay_missing():
    request = PredictionRequest(age=42, bloodPressure=80)
    assert request.serum_creatinine is None
    assert request.hypertension is None


@pytest.mark.parametrize("field,value", [
    ("hypertension", "unknown-condition"),
    ("redBloodCells", "yes"),
    ("bacteria", "normal"),
    ("serumCreatinine", -1),
    ("specificGravity", 2),
])
def test_invalid_measurements_rejected(field, value):
    with pytest.raises(ValidationError):
        PredictionRequest.model_validate({"age": 42, "bloodPressure": 80, field: value})
