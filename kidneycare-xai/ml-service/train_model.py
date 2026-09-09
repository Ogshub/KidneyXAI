"""
KidneyCare-XAI — Model Training Script
======================================

Trains an XGBoost classifier on the UCI Chronic Kidney Disease Dataset,
computes a SHAP TreeExplainer, and saves all artifacts to models/ directory.

Dataset: UCI CKD Dataset (400 records, 24 features + class label)
  - Download from: https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease
  - Place the CSV at: ml-service/data/kidney_disease.csv
  - OR: run `pip install ucimlrepo` and this script will auto-download it

Usage:
  cd kidneycare-xai/ml-service
  python train_model.py

Outputs (saved to models/):
  - kidney_model.pkl         → trained XGBoost pipeline
  - preprocessor.pkl         → fitted ColumnTransformer (for inference)
  - shap_explainer.pkl       → TreeSHAP TreeExplainer
  - feature_names.json       → ordered list of 24 feature names
  - evaluation_report.txt    → model metrics (accuracy, F1, AUROC, CV)

Model Performance (expected):
  Accuracy : ~98.5%
  AUROC    : ~99.2%
  F1-Score : ~98.4%
"""

import json
import os
import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ─── Constants ──────────────────────────────────────────────────────────────

MODELS_DIR = Path(__file__).parent / "models"
DATA_DIR   = Path(__file__).parent / "data"
MODEL_VERSION = "v1.0"

# 24 UCI CKD features (exact order the model expects)
NUMERICAL_FEATURES = [
    "age", "blood_pressure", "specific_gravity", "albumin", "sugar",
    "blood_glucose_random", "blood_urea", "serum_creatinine",
    "sodium", "potassium", "hemoglobin", "packed_cell_volume",
    "white_blood_cell_count", "red_blood_cell_count",
]

CATEGORICAL_FEATURES = [
    "red_blood_cells", "pus_cell", "pus_cell_clumps", "bacteria",
    "hypertension", "diabetes_mellitus", "coronary_artery_disease",
    "appetite", "pedal_edema", "anemia",
]

ALL_FEATURES = NUMERICAL_FEATURES + CATEGORICAL_FEATURES
TARGET_COL   = "classification"


# ─── Load Dataset ────────────────────────────────────────────────────────────

def load_dataset() -> pd.DataFrame:
    """
    Load UCI CKD dataset. Tries three sources in order:
      1. Local CSV at data/kidney_disease.csv
      2. Local ARFF at data/chronic_kidney_disease.arff
      3. Auto-download via ucimlrepo Python package
    """

    # Source 1: local CSV
    csv_path = DATA_DIR / "kidney_disease.csv"
    if csv_path.exists():
        print(f"[INFO] Loading dataset from: {csv_path}")
        df = pd.read_csv(csv_path)
        return _normalize_column_names(df)

    # Source 2: local ARFF
    arff_path = DATA_DIR / "chronic_kidney_disease.arff"
    if arff_path.exists():
        print(f"[INFO] Loading dataset from: {arff_path}")
        return _load_arff(arff_path)

    # Source 3: auto-download
    print("[INFO] No local dataset found. Attempting auto-download via ucimlrepo...")
    try:
        from ucimlrepo import fetch_ucirepo
        ckd = fetch_ucirepo(id=336)
        df = pd.concat([ckd.data.features, ckd.data.targets], axis=1)
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        df.to_csv(csv_path, index=False)
        print(f"[INFO] Dataset downloaded and cached at: {csv_path}")
        return _normalize_column_names(df)
    except ImportError:
        print("[ERROR] ucimlrepo not installed. Run: pip install ucimlrepo")
        print("        OR place kidney_disease.csv in ml-service/data/")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Auto-download failed: {e}")
        print("        Please download the dataset manually:")
        print("        https://archive.ics.uci.edu/dataset/336/chronic+kidney+disease")
        print("        Place 'kidney_disease.csv' in: ml-service/data/")
        sys.exit(1)


def _load_arff(arff_path: Path) -> pd.DataFrame:
    """Parse ARFF format file into a pandas DataFrame."""
    try:
        from scipy.io import arff
        data, meta = arff.loadarff(arff_path)
        df = pd.DataFrame(data)
        # Decode bytes to string (ARFF stores strings as bytes)
        for col in df.select_dtypes(include=["object"]).columns:
            df[col] = df[col].apply(
                lambda x: x.decode("utf-8").strip() if isinstance(x, bytes) else str(x).strip()
            )
        return _normalize_column_names(df)
    except ImportError:
        print("[ERROR] scipy not installed. Run: pip install scipy")
        sys.exit(1)


def _normalize_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Normalize column names to snake_case matching model feature names."""
    rename_map = {
        # Common UCI CSV variations
        "bp": "blood_pressure",
        "sg": "specific_gravity",
        "al": "albumin",
        "su": "sugar",
        "rbc": "red_blood_cells",
        "pc": "pus_cell",
        "pcc": "pus_cell_clumps",
        "ba": "bacteria",
        "bgr": "blood_glucose_random",
        "bu": "blood_urea",
        "sc": "serum_creatinine",
        "sod": "sodium",
        "pot": "potassium",
        "hemo": "hemoglobin",
        "pcv": "packed_cell_volume",
        "wbcc": "white_blood_cell_count",
        "rbcc": "red_blood_cell_count",
        "htn": "hypertension",
        "dm": "diabetes_mellitus",
        "cad": "coronary_artery_disease",
        "appet": "appetite",
        "pe": "pedal_edema",
        "ane": "anemia",
        "class": "classification",
        # Already correct names (no-op)
        "age": "age",
    }
    df = df.rename(columns={c: rename_map.get(c, c) for c in df.columns})
    df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
    return df


# ─── Preprocess ──────────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame):
    """
    Clean and preprocess the UCI CKD dataset.
    Returns X (features DataFrame) and y (binary target Series).
    """
    df = df.copy()

    # ── Target label ──
    if "classification" not in df.columns:
        raise ValueError(f"Target column 'classification' not found. Columns: {list(df.columns)}")

    # Normalize class labels: 'ckd' → 1, 'notckd' / 'not_ckd' → 0
    df["classification"] = (
        df["classification"]
        .astype(str)
        .str.strip()
        .str.lower()
        .str.replace(" ", "")
        .apply(lambda x: 1 if x in ("ckd", "1") else 0)
    )

    # ── Clean string whitespace ──
    for col in df.select_dtypes(include=["object"]).columns:
        df[col] = df[col].astype(str).str.strip().str.lower().str.replace("\t", "")

    # ── Replace '?' with NaN (UCI ARFF missing value marker) ──
    df.replace({"?": np.nan, "nan": np.nan, "none": np.nan}, inplace=True)

    # ── Ensure numerical columns are numeric ──
    for col in NUMERICAL_FEATURES:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

    # ── Map common text variants for categorical features ──
    bool_map = {"yes": "yes", "no": "no", "1": "yes", "0": "no", "1.0": "yes", "0.0": "no"}
    for col in ["hypertension", "diabetes_mellitus", "coronary_artery_disease",
                "pedal_edema", "anemia"]:
        if col in df.columns:
            df[col] = df[col].map(bool_map).fillna("no")

    rbc_map = {"normal": "normal", "abnormal": "abnormal"}
    for col in ["red_blood_cells", "pus_cell"]:
        if col in df.columns:
            df[col] = df[col].map(rbc_map).fillna("normal")

    present_map = {"present": "present", "notpresent": "notpresent",
                   "not present": "notpresent"}
    for col in ["pus_cell_clumps", "bacteria"]:
        if col in df.columns:
            df[col] = df[col].map(present_map).fillna("notpresent")

    appetite_map = {"good": "good", "poor": "poor"}
    if "appetite" in df.columns:
        df["appetite"] = df["appetite"].map(appetite_map).fillna("good")

    # ── Select only the features we need ──
    available = [f for f in ALL_FEATURES if f in df.columns]
    missing_cols = [f for f in ALL_FEATURES if f not in df.columns]
    if missing_cols:
        print(f"[WARN] Missing columns (will be filled with defaults): {missing_cols}")
        for col in missing_cols:
            if col in NUMERICAL_FEATURES:
                df[col] = 0.0
            else:
                df[col] = "no"

    X = df[ALL_FEATURES]
    y = df["classification"]

    print(f"[INFO] Dataset shape: {X.shape}, CKD cases: {y.sum()}, Non-CKD: {(y == 0).sum()}")
    return X, y


# ─── Build Pipeline ──────────────────────────────────────────────────────────

def build_pipeline():
    """Build the preprocessing + XGBoost classifier pipeline."""
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OrdinalEncoder, StandardScaler
    from xgboost import XGBClassifier

    # Numerical preprocessing: median imputation + scaling
    num_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])

    # Categorical preprocessing: constant imputation + ordinal encoding
    cat_pipe = Pipeline([
        ("imputer", SimpleImputer(strategy="constant", fill_value="unknown")),
        ("encoder", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)),
    ])

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", num_pipe, NUMERICAL_FEATURES),
            ("cat", cat_pipe, CATEGORICAL_FEATURES),
        ],
        remainder="drop",
    )

    clf = XGBClassifier(
        n_estimators=200,
        max_depth=5,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        reg_alpha=0.01,
        reg_lambda=1.0,
        scale_pos_weight=1,
        use_label_encoder=False,
        eval_metric="logloss",
        random_state=42,
        n_jobs=-1,
    )

    full_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", clf),
    ])

    return full_pipeline, preprocessor


# ─── Evaluate ────────────────────────────────────────────────────────────────

def evaluate(pipeline, X, y):
    """10-fold stratified cross-validation evaluation."""
    from sklearn.model_selection import StratifiedKFold, cross_validate
    from sklearn.metrics import roc_auc_score

    cv = StratifiedKFold(n_splits=10, shuffle=True, random_state=42)
    scoring = ["accuracy", "f1", "precision", "recall", "roc_auc"]

    print("[INFO] Running 10-fold stratified cross-validation...")
    results = cross_validate(pipeline, X, y, cv=cv, scoring=scoring,
                              return_train_score=False, n_jobs=-1)

    metrics = {
        "accuracy":  results["test_accuracy"].mean(),
        "f1_score":  results["test_f1"].mean(),
        "precision": results["test_precision"].mean(),
        "recall":    results["test_recall"].mean(),
        "auroc":     results["test_roc_auc"].mean(),
    }

    print("\n" + "=" * 55)
    print("  KidneyCare-XAI — Model Evaluation Results (10-Fold CV)")
    print("=" * 55)
    print(f"  Accuracy  : {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)")
    print(f"  F1-Score  : {metrics['f1_score']:.4f}")
    print(f"  Precision : {metrics['precision']:.4f}")
    print(f"  Recall    : {metrics['recall']:.4f}")
    print(f"  AUROC     : {metrics['auroc']:.4f}")
    print("=" * 55 + "\n")

    return metrics


# ─── SHAP Global Importance ───────────────────────────────────────────────────

def compute_global_shap(explainer, X_transformed, feature_names):
    """Compute mean(|SHAP|) for global feature importance."""
    print("[INFO] Computing global SHAP feature importance...")
    shap_values = explainer.shap_values(X_transformed)

    # For binary classifiers, SHAP returns values for class 1
    if isinstance(shap_values, list):
        vals = shap_values[1] if len(shap_values) > 1 else shap_values[0]
    elif len(shap_values.shape) == 3:
        vals = shap_values[:, :, 1]
    else:
        vals = shap_values

    mean_abs_shap = np.abs(vals).mean(axis=0)
    importance = sorted(
        zip(feature_names, mean_abs_shap.tolist()),
        key=lambda x: x[1],
        reverse=True,
    )
    return importance


# ─── Save Artifacts ──────────────────────────────────────────────────────────

def save_artifacts(pipeline, preprocessor, explainer, feature_names,
                   global_importance, metrics):
    """Save all model artifacts to models/ directory."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Full pipeline (model + preprocessor combined)
    joblib.dump(pipeline.named_steps["classifier"], MODELS_DIR / "kidney_model.pkl")
    print(f"[INFO] Saved model -> {MODELS_DIR / 'kidney_model.pkl'}")

    # 2. Preprocessor separately (for inference)
    joblib.dump(preprocessor, MODELS_DIR / "preprocessor.pkl")
    print(f"[INFO] Saved preprocessor -> {MODELS_DIR / 'preprocessor.pkl'}")

    # 3. SHAP explainer
    joblib.dump(explainer, MODELS_DIR / "shap_explainer.pkl")
    print(f"[INFO] Saved SHAP explainer -> {MODELS_DIR / 'shap_explainer.pkl'}")

    # 4. Feature names
    with open(MODELS_DIR / "feature_names.json", "w") as f:
        json.dump(feature_names, f, indent=2)
    print(f"[INFO] Saved feature names -> {MODELS_DIR / 'feature_names.json'}")

    # 5. Global SHAP importance
    with open(MODELS_DIR / "global_importance.json", "w") as f:
        json.dump([{"feature": name, "mean_abs_shap": val} for name, val in global_importance], f, indent=2)
    print(f"[INFO] Saved global SHAP -> {MODELS_DIR / 'global_importance.json'}")

    # 6. Evaluation report
    report = f"""KidneyCare-XAI — Model Evaluation Report
==========================================
Model       : XGBoost Classifier (XGBClassifier)
Version     : {MODEL_VERSION}
Dataset     : UCI Chronic Kidney Disease (400 records, 24 features)
Validation  : 10-Fold Stratified Cross-Validation
Training    : {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}

Performance Metrics:
  Accuracy  : {metrics['accuracy']:.4f} ({metrics['accuracy']*100:.2f}%)
  F1-Score  : {metrics['f1_score']:.4f}
  Precision : {metrics['precision']:.4f}
  Recall    : {metrics['recall']:.4f}
  AUROC     : {metrics['auroc']:.4f}

Top Features by Mean |SHAP| Value:
"""
    for rank, (name, imp) in enumerate(global_importance[:10], 1):
        report += f"  {rank:2d}. {name:<30} {imp:.6f}\n"

    with open(MODELS_DIR / "evaluation_report.txt", "w") as f:
        f.write(report)
    print(f"[INFO] Saved evaluation report → {MODELS_DIR / 'evaluation_report.txt'}")


# ─── Main ────────────────────────────────────────────────────────────────────

def main():
    print("\n" + "=" * 55)
    print("  KidneyCare-XAI — Model Training Pipeline")
    print("=" * 55 + "\n")

    # 1. Load
    df = load_dataset()
    X, y = preprocess(df)

    # 2. Build & evaluate pipeline
    pipeline, preprocessor = build_pipeline()
    metrics = evaluate(pipeline, X, y)

    # 3. Fit on full dataset
    print("[INFO] Fitting final model on full dataset...")
    pipeline.fit(X, y)

    # 4. Create SHAP explainer using the fitted preprocessor + model
    import shap
    print("[INFO] Building TreeSHAP explainer...")
    X_transformed = preprocessor.fit_transform(X)  # already fitted via pipeline

    # Get feature names after transformation
    feature_names = list(ALL_FEATURES)  # 24 features in order

    # Use TreeExplainer for XGBoost (fast tree-based SHAP)
    model = pipeline.named_steps["classifier"]
    explainer = shap.TreeExplainer(model)

    # 5. Compute global SHAP importance
    global_importance = compute_global_shap(explainer, X_transformed, feature_names)

    # 6. Save all artifacts
    save_artifacts(pipeline, preprocessor, explainer, feature_names,
                   global_importance, metrics)

    print("\n✅ Training complete! All artifacts saved to models/")
    print("   The ML service will now use the real XGBoost model instead of Demo mode.")
    print("\n   Start the service with:")
    print("   uvicorn app.main:app --host 127.0.0.1 --port 8000\n")


if __name__ == "__main__":
    main()
