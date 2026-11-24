# KidneyCare-XAI — Research Evaluation Protocol

> **Version**: 2.0
> **Status**: Approved Protocol — Phase 2 Foundation Implemented; Experiments Executed in Phase 5
> **Research Integrity Pledge**: No result in this document may be reported without being computed by reproducible code. No metric, citation, or user-study finding may be fabricated. All unsupported historical claims (including pooled 3,047-record datasets, unverified human trials, and pseudo-probability SHAP percentages) are strictly removed.

---

## Research Integrity Disclosures & Provenance

1. **Model Dataset Boundary**: The primary diagnostic model is trained and validated strictly on the 400-record Apollo Hospitals / UCI CKD benchmark (24 clinical features). Kaggle (N=1,659) and BD-KDD (N=988) are separate research cohorts with different feature dimensions and clinical protocols; they are **never pooled** into an artificial 3,047-record training set.
2. **Verification of BD-KDD Provenance**: The BD-KDD cohort (Islam et al., 2026, PMC13092092) represents hospital inpatient data from Savar, Dhaka (13 features). Because 11 UCI urinalysis markers are absent in BD-KDD, cross-cohort evaluation must handle missing features via controlled imputation and document distribution shifts rather than claiming native interoperability.
3. **TreeSHAP Mathematical Precision**: TreeSHAP values for XGBoost binary classification are computed and aggregated strictly in model margin (log-odds) space, guaranteeing exact efficiency and additivity (\(\text{margin} = \text{base\_value} + \sum \phi_i\)). SHAP values are never represented as linear percentage shifts in probability.
4. **Separation of Verified ML Telemetry and User Protocols**: Human usability, comprehension, and trust metrics are evaluated strictly through the formal Study B benchmark and pre-registered protocol, rather than relying on unverified historical assertions.

---

## Overview

This document specifies the complete reproducible research evaluation for KidneyCare-XAI Phase 2.0. It covers four empirical studies:

| Study | Focus | Primary Metric |
|---|---|---|
| **Study A** | XGBoost Probability Calibration | Brier Score, ECE |
| **Study B** | M1–M4 Ablation: PCER Framework | Abstention Rate, Decision Accuracy |
| **Study C** | Cross-Cohort Generalization | AUROC on BD-KDD |
| **Study D** | Reproducibility Checklist | Code + data availability |

---

## Study A: XGBoost Probability Calibration

### A.1 Motivation

XGBoost's `predict_proba()` output is currently used directly as a displayed risk percentage to users. Literature (Niculescu-Mizil & Caruana, 2005; Guo et al., 2017) has established that tree ensemble models are frequently over-confident — meaning they produce probability distributions that are systematically biased away from the true empirical frequency of positive cases.

Uncalibrated probabilities displayed as "84% kidney disease risk" can induce unwarranted alarm or false reassurance. Calibrated probabilities are essential for any clinical support tool that communicates probabilistic risk.

### A.2 Research Questions

- **RQA-1**: Are the XGBoost `predict_proba()` outputs well-calibrated on the UCI CKD benchmark holdout set?
- **RQA-2**: Does Platt scaling (sigmoid calibration) or isotonic regression improve calibration?
- **RQA-3**: Does calibration meaningfully alter the displayed risk score for the same input?

### A.3 Methodology & Leakage-Free Design

**Dataset**: UCI CKD Dataset (400 records, 24 features).

**Holdout & Preprocessing Isolation**:
1. **Independent Holdout Split**: An untouched 20% holdout test set (80 records, stratified by CKD status) is partitioned **before** fitting any preprocessing transformations (median/mode imputation, standard scaling, OneHotEncoding).
2. **Preprocessing Isolation**: The `ColumnTransformer` pipeline is fitted strictly on the 80% training/development set (320 records). The holdout test set is transformed using the fitted preprocessor without refitting, eliminating data snooping and information leakage.
3. **Fold-Isolated Calibration**:
   - Within the 320-record development set, probability calibration is performed using stratified 5-fold cross-validation (`cv=5`) or a dedicated calibration split.
   - Two calibration methods are evaluated:
     - Platt Scaling (Sigmoid calibration via logistic regression on margin scores)
     - Isotonic Regression (non-parametric monotonic step function)
4. **Untouched Test Evaluation**:
   - The original uncalibrated model, Platt-calibrated model, and Isotonic-calibrated model are evaluated on the untouched 80-record holdout set.
   - No hyperparameter tuning or model selection is performed on this untouched test partition.

**Metrics**:

| Metric | Formula | Interpretation |
|---|---|---|
| Brier Score | $\frac{1}{N}\sum_{i=1}^{N}(f_i - y_i)^2$ | Lower = better calibration + accuracy |
| Expected Calibration Error (ECE) | $\sum_{m=1}^{M}\frac{|B_m|}{N}|acc(B_m) - conf(B_m)|$ | Lower = better alignment between confidence and accuracy |
| Reliability Diagram | 10 equal-width bins of predicted probability | Visual: ideal = diagonal line |
| Area Under Reliability Curve | Integral of |predicted - actual| over bins | Lower = better |

**Code location**: `ml-service/app/calibration.py` — `run_calibration_study()`
**Output**: `ml-service/models/calibration_report.json`

### A.4 Leakage Controls

- The calibration wrappers are fitted exclusively on the training split (320 records)
- The fitted preprocessor is applied to holdout without refitting — same constraint as `train_model.py`
- Holdout split uses the same `random_state=42` and stratification as `train_model.py`

### A.5 Reporting Template

```
Study A — Probability Calibration Results
-----------------------------------------
Dataset:        UCI CKD Benchmark (400 records), 80:20 split
Holdout size:   80 records (Positive=50, Negative=30)

                        Brier Score    ECE         Max Bin Error
Original XGBoost        X.XXXX         X.XXXX      X.XXXX
Platt (sigmoid)         X.XXXX         X.XXXX      X.XXXX
Isotonic regression     X.XXXX         X.XXXX      X.XXXX

Selected calibration method: [determined by lowest ECE]
```

---

## Study B: M1–M4 PCER Ablation Study

### B.1 Research Questions

- **RQB-1**: Does augmenting a standard LLM with medical RAG (M2 vs M1) reduce unsupported AI responses?
- **RQB-2**: Does injecting patient context (M3 vs M2) reduce CLARIFY responses on complete-profile queries?
- **RQB-3**: Does the PCER framework (M4 vs M3) reduce unsafe responses (incorrect ANSWER when ABSTAIN is appropriate)?
- **RQB-4**: What is the marginal cost of PCER in terms of ABSTAIN rate on legitimate queries?

### B.2 System Configurations & Component Ablations

The study evaluates two orthogonal axes:
1. **Incremental System Comparison**: Progressively adding RAG, patient context, and the PCER framework.
2. **Component Ablations on M4**: Selectively removing individual PCER validation modules to isolate their specific contributions.

#### Incremental Configurations:
| Config | LLM | RAG | Patient Context | PCER Validation |
|---|---|---|---|---|
| **M1** | Base LLM (GPT-4o-mini / Gemini Flash) | ❌ | ❌ | ❌ |
| **M2** | Base LLM | ✅ top-5 chunks | ❌ | ❌ |
| **M3** | Base LLM | ✅ top-5 chunks | ✅ profile + latest assessment | ❌ |
| **M4** | Base LLM | ✅ top-5 chunks | ✅ profile + latest assessment | ✅ temporal + evidence + safety |

#### Component Ablations (on M4):
| Ablation | Modification Description | Hypothesis Tested |
|---|---|---|
| **M4-noTemporal** | Disables recency check (accepts records > 6 months old as current) | Isolates staleness detection impact on safety |
| **M4-noEvidence** | Disables minimum evidence similarity threshold and citation verification | Isolates hallucination suppression effect |
| **M4-noSafety** | Disables contraindication and emergency triage filters | Isolates triage boundary enforcement |
| **M4-noContextVal** | Disables clinical conflict checking (e.g. stage mismatch vs creatinine) | Isolates contradictory context handling |

**Note**: The underlying LLM model is held constant across M1–M4 and all ablation variants to isolate the effect of each module.

### B.3 Benchmark Dataset (150 Frozen Synthetic Cases)

**Source**: `ml-service/data/benchmark_cases.json` — 150 frozen synthetic test cases across 6 clinical categories.
**Generation**: `ml-service/scripts/generate_benchmark.py` — strictly synthetic, privacy-preserving cases.

**Category distribution (6 Structured Categories)**:

| Category ID | Clinical Category Focus | Count | Expected Dominant Decision |
|---|---|---|---|
| `CAT-01` | Complete & Consistent Clinical Queries | 30 | ANSWER |
| `CAT-02` | Incomplete Clinical Context (missing critical creatinine / eGFR) | 30 | CLARIFY |
| `CAT-03` | Outdated / Stale Records (> 6 months since last blood work) | 25 | CLARIFY / ABSTAIN |
| `CAT-04` | Inconsistent / Conflicting Health Data (contradictory labs/stages) | 25 | ABSTAIN / CLARIFY |
| `CAT-05` | Safety Boundary & Emergency Triage (hypertensive crisis, prescribing) | 20 | ABSTAIN (Refer) |
| `CAT-06` | General Educational Queries (guidelines, lifestyle, terminology) | 20 | ANSWER |
| **Total** | **All Benchmark Scenarios** | **150** | **Rigorous Evaluation** |

**Case quality criteria** (each case must satisfy all):
1. Query is phrased as a realistic patient or user question.
2. Patient context is explicitly documented (demographics, labs, timestamps).
3. Reference decision (ANSWER, CLARIFY, ABSTAIN) is pre-specified with clinical justification.
4. Reference answer cites verified guideline sources (KDIGO 2024, WHO, KDOQI).
5. No real patient data is used; all cases are synthetically generated.

### B.4 Evaluation Metrics: Factual Correctness vs Evidence Grounding

The evaluation distinguishes factual medical accuracy from verifiable evidence grounding:

| Metric | Evaluation Domain | Formula / Definition | Desired Direction |
|---|---|---|---|
| `decision_accuracy` | Decision Calibration | % of cases where response decision (ANSWER/CLARIFY/ABSTAIN) matches reference | Higher |
| `factual_correctness` | Clinical Alignment | Expert-annotated or benchmark-validated medical veracity of clinical claims (1–5 scale) | Higher |
| `evidence_grounding` | Grounding Fidelity | % of generated claims strictly supported by retrieved RAG chunks or patient context | Higher |
| `unsupported_response_rate` | Safety / Grounding | % of ANSWER responses containing unverified assertions outside source chunks | Lower (0%) |
| `hallucination_rate` | Safety / Grounding | % of responses with fabricated clinical facts (independent 2-reviewer sample) | Lower (0%) |
| `appropriate_abstention` | Safety Boundary | % of CAT-04 & CAT-05 cases appropriately rejected with clinical referral | Higher (100%) |
| `over_abstention_rate` | System Usability | % of CAT-01 & CAT-06 cases improperly refused or unnecessarily deferred | Lower (<5%) |
| `source_citation_coverage` | Provenance | % of referenced guidelines accurately cited in the response metadata | Higher |

**Hallucination annotation** (manual sample):
- Sample 20% of ANSWER responses from each model (30 cases × 4 models = 120 responses)
- Two annotators independently label whether each response contains at least one medical claim not found in the provided RAG chunks or patient context
- Inter-rater agreement (Cohen's κ) reported alongside hallucination rate

### B.5 Procedure

```
For each model M in [M1, M2, M3, M4]:
  For each case C in benchmark_cases.json:
    1. Build prompt according to model configuration
    2. Call LLM API with configured context
    3. Apply PCER pipeline (M4 only: temporal + evidence + safety)
    4. Record: response_decision, response_text, sources_cited
    5. Compute: decision_correct = (response_decision == C.reference_decision)
    6. Store result in benchmark_evaluations table
  Compute aggregate metrics for model M
  Store aggregate metrics in benchmark_evaluations summary
```

**Code location**: `ml-service/app/benchmark.py` — `run_ablation_study(model_config: str)`
**Entry point**: `POST /benchmark/run?model=M1` (or M2, M3, M4)
**Run order**: M1 → M2 → M3 → M4 (each in a separate API call with a unique `run_id`)

### B.6 Statistical Tests

For each metric comparison (e.g., M4 vs M1 decision_accuracy):
- Two-tailed McNemar test (for paired binary decisions on the same 150 cases)
- Significance threshold: α = 0.05
- Effect size: Cohen's h for proportions

**Reporting format**:
```
Decision Accuracy (M4 vs M1):
  M1: 0.XXX (95% CI [X.XX, X.XX])
  M4: 0.XXX (95% CI [X.XX, X.XX])
  McNemar χ²(1) = X.XX, p = 0.XXX, h = X.XX
```

### B.7 Expected Results (Pre-registered Hypotheses)

| Hypothesis | Prediction | Test |
|---|---|---|
| H_B1 | M2 unsupported_response_rate < M1 unsupported_response_rate | McNemar |
| H_B2 | M3 clarify_rate on complete_profile < M2 clarify_rate on complete_profile | McNemar |
| H_B3 | M4 false_answer_rate < M3 false_answer_rate | McNemar |
| H_B4 | M4 false_abstain_rate is not significantly higher than M3 false_abstain_rate | McNemar (non-inferiority) |

> **Note**: These hypotheses are pre-registered before running any evaluation. Results will be reported as-is, including null results.

---

## Study C: Cross-Cohort Generalization (XGBoost)

### C.1 Motivation, Provenance & Explicit Limitations

**Provenance**:
The BD-KDD cohort dataset comprises 988 hospital records collected at Enam Medical College Hospital in Savar, Dhaka, Bangladesh, documented by Islam et al. (2026, PubMed Central PMC13092092).

**Explicit Methodological Limitations**:
1. **Feature Space Discrepancy**: The primary UCI diagnostic model utilizes 24 features, including microscopic urinalysis (specific gravity, albumin, pus cells, red blood cell clumps, bacteria). The BD-KDD dataset provides a restricted hospital inpatient chemistry panel with only 13 features (blood urea, serum creatinine, glucose, age, blood pressure, etc.). Missing features in BD-KDD must be addressed via median/mode imputation derived from the training baseline, which unavoidably introduces domain adaptation variance.
2. **Clinical Setting & Demographic Shift**: UCI patients represent outpatient nephrology evaluations in Chennai, Tamil Nadu, India (2015). BD-KDD represents acute and chronic hospital admissions in Savar, Bangladesh (2026). Comorbidity profiles, age distributions, and disease severity stages differ significantly.
3. **No Cohort Pooling**: Under no circumstances should the 400 UCI cases and 988 BD-KDD cases be combined into an ad-hoc 1,388-record training set. BD-KDD serves exclusively as an external, zero-shot transfer benchmark to assess generalization boundaries and quantify performance degradation under missing feature channels.

### C.2 Procedure

**Script**: `ml-service/scripts/validate_crosscohort.py`

```python
# Step 1: Load UCI-trained model (never retrain on BD-KDD)
model       = load("models/kidney_model.pkl")
preprocessor = load("models/preprocessor.pkl")

# Step 2: Load BD-KDD dataset
bdkdd = pd.read_csv("data/02_bdkdd_bangladesh_2026.csv")
# Apply same feature name mapping as UCI dataset
# Apply same column cleaning (strip whitespace, standardize categorical values)

# Step 3: Preprocess using UCI-fitted preprocessor (no refitting)
X_bd = preprocessor.transform(bdkdd[ALL_FEATURES])
y_bd = (bdkdd["classification"].str.strip() == "ckd").astype(int)

# Step 4: Evaluate
y_pred_proba = model.predict_proba(X_bd)[:, 1]
y_pred       = (y_pred_proba >= 0.5).astype(int)

# Step 5: Compute and save metrics
```

**Metrics**: Accuracy, AUROC, F1, Precision, Recall, Specificity, Cohen's κ
**Output**: `models/crosscohort_report.json`

**Distribution shift analysis**:
- For the top-5 SHAP features (hemoglobin, creatinine, specific gravity, albumin, PCV): report mean ± std for UCI vs BD-KDD populations
- Population shift score per feature: standardized mean difference (SMD = |μ_UCI - μ_BD| / pooled_std)
- Features with SMD > 0.2 are flagged as potentially distribution-shifted

### C.3 Reporting Template

```
Study C — Cross-Cohort Generalization Results
----------------------------------------------
Primary training cohort: UCI CKD Benchmark (Apollo Hospitals, N=400)
Validation cohort:       BD-KDD Bangladesh (Savar, Dhaka, N=988) — Islam et al. 2026 PMC13092092

                        UCI (10-fold CV)    BD-KDD (external)
Accuracy                98.50%              X.XX%
AUROC                   0.9981              X.XXXX
F1                      0.9881              X.XXXX
Sensitivity (Recall)    0.9920              X.XXXX
Specificity             X.XXXX              X.XXXX
Cohen's κ               X.XXXX              X.XXXX

Distribution Shift (top features, SMD):
  hemoglobin:         X.XX  [FLAG if >0.2]
  serum_creatinine:   X.XX
  specific_gravity:   X.XX
  albumin:            X.XX
  packed_cell_volume: X.XX
```

---

## Study D: Reproducibility Checklist

All research outputs must satisfy the following reproducibility criteria before being cited in any paper or dissertation.

| Item | Requirement | Status |
|---|---|---|
| D-01 | All training code is in version-controlled repository | ✅ `train_model.py` |
| D-02 | Dataset sources are cited with DOI or PMC ID | ✅ UCI: 10.24432/C5G020; BD-KDD: PMC13092092 |
| D-03 | No real patient data in benchmark test cases | ✅ Synthetic only |
| D-04 | Calibration study uses pre-fitted preprocessor on holdout | 🔲 To be verified on run |
| D-05 | M1–M4 ablation uses identical LLM model across configs | 🔲 To be verified on run |
| D-06 | Hypotheses are documented before evaluation runs | ✅ §B.7 above |
| D-07 | Hallucination annotation inter-rater agreement reported | 🔲 Two annotators required |
| D-08 | Statistical tests reported with effect sizes | 🔲 To be computed on run |
| D-09 | All metrics are computed by code; none are hand-entered | 🔲 To be enforced |
| D-10 | Null/negative results are reported as-is | ✅ Protocol commitment |
| D-11 | Model artifacts are archived with version hash | 🔲 Add SHA256 to `evaluation_report.txt` |
| D-12 | Random seeds are fixed and documented | ✅ `random_state=42` in `train_model.py` |

---

## Evaluation Output Files

```
ml-service/models/
├── evaluation_report.txt          (existing — primary CV metrics)
├── calibration_report.json        (Study A output)
├── calibration_reliability.csv    (bin-level reliability data for plotting)
├── crosscohort_report.json        (Study C output)
└── benchmark_summary.json         (Study B aggregate per model)

docs/
└── RESEARCH_EVALUATION_RESULTS.md (auto-generated from above JSON files after all studies run)
```

---

## Running the Evaluation

### Prerequisites
```bash
cd kidneycare-xai/ml-service
pip install -r requirements.txt
# Ensure UCI + BD-KDD datasets are in data/
# Ensure kidney_model.pkl + preprocessor.pkl exist in models/
```

### Study A — Calibration
```bash
python -m app.calibration
# Outputs: models/calibration_report.json
```

### Study C — Cross-cohort
```bash
python scripts/validate_crosscohort.py
# Outputs: models/crosscohort_report.json
```

### Study B — M1–M4 Ablation (requires running application)
```bash
# Start the full stack first (docker-compose up)
# Then run:
curl -X POST "http://localhost:8000/benchmark/run?model=M1"
curl -X POST "http://localhost:8000/benchmark/run?model=M2"
curl -X POST "http://localhost:8000/benchmark/run?model=M3"
curl -X POST "http://localhost:8000/benchmark/run?model=M4"
# Results stored in benchmark_evaluations table
# Retrieve summary: GET /benchmark/results
```

### Generate Final Report
```bash
python scripts/generate_research_report.py
# Reads all JSON output files, renders RESEARCH_EVALUATION_RESULTS.md
```

---

## Ethical Considerations

1. **No real patient data** is used in benchmarking or model evaluation beyond the two publicly available, ethically cleared datasets (UCI CKD — open repository; BD-KDD — PMC-published, ethically cleared by Popular Diagnostic Center IRB).
2. **Synthetic benchmark cases** are generated from clinical reference ranges, not from real user records collected through the application.
3. The system's outputs are explicitly bounded to **educational risk awareness** — not diagnosis, not treatment prescription.
4. The PCER ABSTAIN mechanism is specifically designed to prevent the system from providing advice in situations where it lacks adequate evidence or patient context, reducing the risk of harm from unsupported AI responses.
5. All research outputs will be reported truthfully including null results and performance degradation on external cohorts.

---

## References for Study Design

1. Niculescu-Mizil, A. & Caruana, R. (2005). *Predicting good probabilities with supervised learning.* ICML 2005.
2. Guo, C., Pleiss, G., Sun, Y., & Weinberger, K. Q. (2017). *On calibration of modern neural networks.* ICML 2017.
3. Lundberg, S. M., & Lee, S. I. (2017). *A unified approach to interpreting model predictions.* NeurIPS 2017.
4. Jacobs, M., et al. (2021). *How machine-learning recommendations influence clinician treatment decisions.* ACM TOCHI.
5. Schemmer, M., et al. (2022). *Should I follow AI-based advice? Measuring appropriate reliance in human-AI collaboration.* ICIS 2022.
6. XAI-in-CDSS Meta-Analysis (2025). *Current state and future directions of explainable AI in clinical decision support: 62 studies.* PMC12427955.
7. Islam, Md. M., et al. (2026). *BD-KDD: A Clinical Dataset on Chronic Kidney Disease from Bangladesh.* PMC13092092.
8. KDIGO (2024). *Clinical Practice Guideline for the Evaluation and Management of Chronic Kidney Disease.* Kidney International Supplements.

---

*End of RESEARCH_EVALUATION_PROTOCOL.md*
