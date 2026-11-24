"""Re-fit UCI models and calibration without using deployed artifacts."""
import hashlib
import json
from pathlib import Path
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (accuracy_score, brier_score_loss, f1_score, log_loss, precision_score,
                             recall_score, roc_auc_score)
from sklearn.model_selection import StratifiedKFold, train_test_split

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT.parent / "ml-service"))
from train_model import _normalize_column_names, build_pipeline, preprocess


def split_indices(y):
    return train_test_split(np.arange(len(y)), test_size=.2, random_state=42, stratify=y)


def calibration_error(y, probability):
    bins = np.minimum((probability * 10).astype(int), 9)
    return sum(np.sum(bins == b) * abs(np.mean(y[bins == b]) - np.mean(probability[bins == b]))
               for b in range(10) if np.any(bins == b)) / len(y)


def metrics(y, probability):
    positive = probability >= .5
    return dict(accuracy=accuracy_score(y, positive), precision=precision_score(y, positive, zero_division=0),
                recall=recall_score(y, positive), specificity=recall_score(y, positive, pos_label=0),
                f1=f1_score(y, positive), auroc=roc_auc_score(y, probability), brier=brier_score_loss(y, probability),
                log_loss=log_loss(y, probability), positive_class_ece=calibration_error(y, probability))


def run():
    source = ROOT.parent / "ml-service/data/01_uci_ckd_benchmark_2015.csv"
    x, y = preprocess(_normalize_column_names(pd.read_csv(source)))
    development, evaluation = split_indices(y)
    y_test = y.iloc[evaluation].to_numpy()
    estimates = pd.DataFrame({"row_index": evaluation, "label": y_test})
    results, curves = {}, {}
    rng = np.random.default_rng(42)
    samples = [rng.choice(len(y_test), size=len(y_test), replace=True) for _ in range(1000)]
    for name in ("uncalibrated", "sigmoid", "isotonic"):
        pipeline, _ = build_pipeline()
        estimator = pipeline if name == "uncalibrated" else CalibratedClassifierCV(
            pipeline, method=name, cv=StratifiedKFold(5, shuffle=True, random_state=42), ensemble=False)
        estimator.fit(x.iloc[development], y.iloc[development])
        probability = estimator.predict_proba(x.iloc[evaluation])[:, 1]
        estimates[name] = probability
        intervals = [brier_score_loss(y_test[index], probability[index]) for index in samples]
        results[name] = {"metrics": metrics(y_test, probability), "brier_bootstrap_ci95": list(np.quantile(intervals, [.025, .975]))}
        curves[name] = calibration_curve(y_test, probability, n_bins=10)
    output = ROOT / "results"
    figures = ROOT / "figures"
    output.mkdir(exist_ok=True)
    figures.mkdir(exist_ok=True)
    report = {"dataset": "UCI CKD", "dataset_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "development_n": len(development), "evaluation_n": len(evaluation), "seed": 42,
              "pipeline": "fresh XGBoost; fold-local preprocessing; five-fold development-only calibration",
              "limitations": "Previously used dataset. Internal split. Brier intervals are conditional on fitted models.",
              "methods": results}
    (output / "calibration_report.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    estimates.to_csv(output / "calibration_predictions.csv", index=False)
    fig, ax = plt.subplots(figsize=(6, 5))
    ax.plot([0, 1], [0, 1], "--", color="grey")
    for name, (observed, predicted) in curves.items():
        ax.plot(predicted, observed, marker="o", label=name)
    ax.set(xlabel="Mean predicted probability", ylabel="Observed positive fraction", title="UCI held-out reliability")
    ax.legend()
    fig.savefig(figures / "reliability_diagram.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    fig, ax = plt.subplots(figsize=(6, 4))
    names = list(results)
    for i, name in enumerate(names):
        point = results[name]["metrics"]["brier"]
        low, high = results[name]["brier_bootstrap_ci95"]
        ax.errorbar(i, point, yerr=[[max(0, point-low)], [max(0, high-point)]], fmt="o", capsize=5)
    ax.set_xticks(range(len(names)), names)
    ax.set(ylabel="Brier score", title="Conditional 95% bootstrap intervals")
    fig.savefig(figures / "calibration_comparison.png", dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    run()
