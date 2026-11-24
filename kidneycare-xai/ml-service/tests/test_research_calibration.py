import importlib.util
from pathlib import Path

import numpy as np
import pytest

pytest.importorskip("matplotlib")
path = Path(__file__).resolve().parents[2] / "research/experiments/calibration.py"
spec = importlib.util.spec_from_file_location("calibration_experiment", path)
study = importlib.util.module_from_spec(spec)
spec.loader.exec_module(study)


def test_evaluation_indices_are_disjoint_and_stratified():
    labels = np.repeat([0, 1], [150, 250])
    development, evaluation = study.split_indices(labels)
    assert not set(development) & set(evaluation)
    assert len(evaluation) == 80 and labels[evaluation].sum() == 50


def test_positive_class_calibration_metrics():
    scores = study.metrics(np.array([0, 1]), np.array([.2, .8]))
    assert scores["brier"] == pytest.approx(.04)
    assert scores["positive_class_ece"] == pytest.approx(.2)
