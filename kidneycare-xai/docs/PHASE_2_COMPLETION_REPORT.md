# KidneyCare-XAI — Phase 2 Completion Report
## Foundation, Research Integrity and Lifestyle Tracker

> **Document Version**: 1.0.0
> **Date**: November 24, 2026
> **Branch**: `phase-2-foundation`
> **Status**: Implemented; verification findings in section 10

---

## 1. Executive Summary

Phase 2 establishes the architectural foundation, security hardening, research integrity controls, and upgraded lifestyle tracking framework for KidneyCare-XAI. All tasks specified in the Phase 2 prompt and implementation plan were executed without rewriting working modules or introducing unverified chatbot functionality.

### Key Milestones Achieved:
1. **Security Hardening**: Remediated SEC-01, BUG-05, and SEC-02. Removed hardcoded JWT fallbacks, segregated credentials into clean `.env.example` templates, added internal mutual authentication (`X-Internal-Secret`) between Spring Boot and FastAPI, and documented credential rotation requirements.
2. **Model Evaluation Integrity (BUG-01)**: Replaced the hardcoded `/evaluate` endpoint with an artifact-backed dynamic system reading `evaluation_report.json`. Bound metrics strictly to the verified 400-record Apollo Hospitals / UCI benchmark (AUROC 0.9981, Accuracy 98.50%, F1 0.9881). Completely excised the unsupported 3,047-record multi-cohort claim across backend, ML service, and frontend.
3. **TreeSHAP Correctness & Alignment (BUG-07)**: Developed metadata-driven transformed-to-original feature mapping using `ColumnTransformer` inspection and `get_feature_names_out()`. Implemented signed sum aggregation for grouped one-hot-encoded features. Formally established that TreeSHAP margin attributions preserve exact additivity in log-odds space (\(\text{margin} = \text{base\_value} + \sum \phi_i\)), while stopping the presentation of raw margin values as pseudo-probability percentages. Added automated test suite (`7 passed`).
4. **Elimination of Fallback Predictions**: Removed silent synthetic and heuristic prediction fallbacks in `predictor.py` and `MlService.java`. Replaced with explicit `model_unavailable` and `explanation_unavailable` error states, and added demo banners to prevent unverified data from contaminating clinical research records.
5. **Lifestyle Tracker & Clinical Rule Upgrade**: Extended the daily lifestyle tracking schema with 11 clinical fields (blood pressure, medication adherence status, sleep quality, exercise type, symptoms, personal notes, doctor restrictions). Added a non-zero denominator summary endpoint (`GET /api/activities/summary`). Redesigned the lifestyle score away from an unvalidated numerical score to 7-day journal adherence. Overhauled the recommendation engine with stable rule IDs, triage referrals, and contraindication guards.
6. **Research Protocol Governance**: Amended `RESEARCH_EVALUATION_PROTOCOL.md` and `FINAL_IMPLEMENTATION_PLAN.md` with leakage-free holdout calibration protocols (Study A), a 150-case benchmark protocol across 6 categories (Study B), and explicit provenance and limitation documentation for the BD-KDD cohort (Study C).

---

## 2. Security Remediation (SEC-01, BUG-05, SEC-02)

| Issue ID | Severity | Root Cause | Remediated State |
|---|---|---|---|
| **SEC-01** | High | Hardcoded fallback JWT secret in `application.properties` | Removed default secret literal; replaced with `jwt.secret=${JWT_SECRET}`. Production startup fails if environment variable is missing. |
| **BUG-05** | Medium | Potential fallback to insecure default credentials | Created standardized `.env.example` in root and `frontend/` with placeholders only. Tracked gitignore verified. |
| **SEC-02** | High | Unauthenticated internal HTTP endpoint on FastAPI `/predict` and `/evaluate` | Implemented `internal_secret_middleware` in FastAPI requiring `X-Internal-Secret`. Spring Boot `MlService` now sends the shared internal secret via HTTP headers. |

### Credential Rotation Notice
- Any secret previously committed to historical git commits (such as database credentials or JWT keys) must be rotated on the target deployment hosting provider (Supabase / PostgreSQL / Cloud hosts).
- Local development now uses `.env` exclusively, which is ignored by Git.

---

## 3. Bug 01 — Model Evaluation Integrity

### Changes Implemented:
1. **Dynamic JSON Artifact**: Created `ml-service/models/evaluation_report.json` containing:
   - `datasetName`: "Apollo Hospitals Chronic Kidney Disease Dataset (UCI ML Repository Benchmark)"
   - `totalRecords`: 400 (CKD: 250, NotCKD: 150)
   - `validationProtocol`: "10-Fold Stratified Cross-Validation (Leakage-Free ColumnTransformer Pipeline)"
   - `foldCount`: 10
   - `modelVersion`: "1.0.0-xgb"
   - `artifactHash`: "e27cb1fc676643329aa2aa4a8bb13b4e101ab6783f9801831871262d4993526e"
   - `metrics`: accuracy: 0.985, precision: 0.9849, recall: 0.9920, f1_score: 0.9881, auroc: 0.9981, specificity: 0.9733
   - `topGlobalFeatures`: 24 original clinical biomarkers with mean absolute SHAP importances.
2. **Endpoint Refactoring (`main.py`)**:
   - `GET /evaluate` parses `evaluation_report.json`.
   - Returns status `"metrics_unavailable"` if the file is missing or artifact hash fails integrity validation.
3. **Excised Unsupported Multi-Cohort Claim**:
   - Removed the claim of a pooled 3,047 patient multi-cohort evaluation from `ResearchAnalytics.jsx` and backend documentation.
   - Kaggle (N=1,659) and BD-KDD (N=988) are documented as independent research cohorts with distinct feature spaces and clinical protocols.

---

## 4. Bug 07 — TreeSHAP Feature Mapping & Correctness

### Mathematical Formulation
In XGBoost binary classification, TreeSHAP operates in the raw margin (log-odds) output space. The model prediction probability is given by the logistic sigmoid:
\[
P(Y = 1 \mid x) = \sigma(\text{margin}(x)) = \frac{1}{1 + e^{-\text{margin}(x)}}
\]
Under the Shapley efficiency axiom:
\[
\text{margin}(x) = \phi_0 + \sum_{j=1}^{M} \phi_j(x)
\]
Where \(\phi_0\) is `explainer.expected_value` and \(\phi_j\) are feature attributions.

### Mapping Implementation:
1. **Metadata-Driven Mapping (`model_loader.py`)**:
   - Derived mapping by iterating through `preprocessor.transformers_` and calling `get_feature_names_out()` on fitted transformers (e.g., `StandardScaler`, `OneHotEncoder`).
   - Encoded sub-features (e.g., `cat__htn_yes`, `cat__htn_no`) are mapped to their original clinical parent (`hypertension`).
2. **Signed Sum Aggregation (`predictor.py`)**:
   - Encoded columns belonging to the same clinical feature are aggregated using **signed sums** (\(\sum \phi_{j,k}\)), preserving exact additivity in margin space.
3. **Safety & Fallback Checks**:
   - If feature dimensions do not match the explainer dimension (24), explanation status returns `"explanation_unavailable"`.
4. **Frontend Clarifications**:
   - Updated `AssessmentResult.jsx` narrative synthesis: attributions are displayed as `+0.421 log-odds` margin contributions, not pseudo-percentage shifts in probability.

### Automated Unit Test Suite (`ml-service/tests/test_shap_mapping.py`):
```text
test_feature_dimension_alignment                 PASSED [ 14%]
test_original_feature_mapping                    PASSED [ 28%]
test_positive_and_negative_attribution_aggregation PASSED [ 42%]
test_one_hot_encoder_feature_mapping_simulation   PASSED [ 57%]
test_shap_additivity_within_numerical_tolerance   PASSED [ 71%]
test_unknown_categories                          PASSED [ 85%]
test_missing_input_values                        PASSED [100%]
======================= 7 passed in 6.85s =======================
```

---

## 5. Elimination of Fallback Predictions

1. **`predictor.py`**:
   - Removed heuristic rule-based risk generation when model is missing.
   - Raises `HTTPException(503, "Trained model artifact is unavailable")`.
   - Returns `explanationStatus: "explanation_unavailable"` if SHAP calculation encounters any dimensional or preprocessing fault.
2. **`MlService.java`**:
   - Replaced silent fallback prediction with `throw new MlServiceException("ML prediction service returned error or unavailable")`.
   - Propagates `isDemoMode` and `explanationStatus`.
3. **`AssessmentService.java`**:
   - Historical assessments with affected explanation logic are tagged as `explanationStatus = "legacy_unverified"`.
4. **Frontend (`AssessmentResult.jsx`)**:
   - Added amber alert banner for demonstration mode.
   - Added information banner for legacy/unverified explanations.
   - Added danger alert when explanation is unavailable.

---

## 6. Daily Lifestyle Tracker & Clinical Rules Upgrade

### 6.1 Database Schema Migration
- Script: `docs/database/migration_v2.sql`
- Baseline updated: `docs/database/schema.sql`
- Added columns to `daily_activities`:
  - `systolic_bp` (`INTEGER`)
  - `diastolic_bp` (`INTEGER`)
  - `medication_status` (`VARCHAR(30)`: `TAKEN_AS_PRESCRIBED`, `MISSED`, `PARTIALLY_TAKEN`, `NOT_APPLICABLE`, `NOT_RECORDED`)
  - `sleep_quality` (`VARCHAR(20)`: `POOR`, `FAIR`, `GOOD`, `EXCELLENT`)
  - `exercise_type` (`VARCHAR(50)`)
  - `symptoms` (`TEXT`)
  - `personal_notes` (`TEXT`)
  - `doctor_restrictions` (`TEXT`)
- Added columns to `recommendations`:
  - `rule_id` (`VARCHAR(50)`)
  - `observation_period` (`VARCHAR(50)`)
  - `known_limitations` (`TEXT`)
  - `contraindications` (`TEXT`)

### 6.2 Backend Services & DTOs
- **`ActivitySummaryResponse.java`**: Structured summary calculating metrics strictly over recorded days (disclosing denominators). Missing days are never treated as zero values or missed medication.
- **`ActivityService.java`**: Added `getSummary(email, period, date)` supporting `weekly` (7 days) and `monthly` (30 days).
- **`ActivityController.java`**: Exposed `GET /api/activities/summary?period=weekly|monthly&date=YYYY-MM-DD`.
- **`LifestyleScoreCalculator.java`**: Deprecated unvalidated numerical score `calculate()`. Added `calculateJournalCompletion(recordedDays, totalDays)` and `describeProgress(...)`.
- **`DashboardService.java`**: Returns `journalCompletionRate`, `recordedDaysLast7`, and `descriptiveProgress`.

### 6.3 Recommendation Engine Overhaul (`RecommendationService.java`)
Implemented deterministic rules with clinical citations:
- `RULE-SYMP-URGENT`: Severe symptom detection (e.g., chest pain, extreme swelling, blood in urine) &rarr; Immediate emergency triage advisory (KDIGO 2024 / WHO).
- `RULE-BP-URGENT`: Systolic BP \(\ge 180\) or Diastolic \(\ge 120\) &rarr; Hypertensive crisis triage alert.
- `RULE-BP-HIGH`: Systolic BP \(\ge 140\) &rarr; Regular monitoring and primary care review.
- `RULE-HYDR-RESTRICTED`: Suppresses fluid push recommendation when user has documented fluid restriction or severe edema.
- `RULE-HYDR-01`: Standard fluid guidance for unrestricted adults.
- `RULE-MED-01`: Medication adherence observation.
- `RULE-EXER-01`: Regular physical activity encouragement.
- `RULE-SLEEP-01`: Sleep duration and recovery guidance.
- `RULE-SALT-01`: Dietary sodium intake guidance.

### 6.4 Frontend Updates
- **`DailyTracker.jsx`**:
  - Implemented 3 tabs: "Daily Journal Log", "Weekly Summary Analysis", "Monthly Log Overview".
  - Full prefill on editing past dates.
  - Form fields for blood pressure, medication adherence status, sleep quality, exercise type, symptoms, restrictions, and personal notes.
  - Weekly summary dashboard displaying average metrics with explicit denominator disclosure (e.g., "Averaged across 5 recorded days").
- **`Dashboard.jsx`**:
  - Replaced prominent "Lifestyle Score / 100" with "Lifestyle Journal Adherence" (% of 7 days recorded) and descriptive progress.
- **`ResearchAnalytics.jsx`**:
  - Updated to consume dynamic `/evaluate` response.
  - Accurately details the 3 distinct research cohorts without fictitious pooling.

---

## 7. Research Evaluation Protocol Amendments

`RESEARCH_EVALUATION_PROTOCOL.md` and `FINAL_IMPLEMENTATION_PLAN.md` were amended:
1. **Study A (Probability Calibration)**:
   - Independent 20% holdout split (80 records) created before fitting preprocessing or models.
   - Platt scaling and isotonic regression fitted using fold-isolated cross-validation on the development set.
   - Pre-specified final evaluation on untouched test data.
2. **Study B (PCER Framework Ablation)**:
   - 150 frozen synthetic test cases across 6 structured categories: Complete (30), Incomplete (30), Outdated (25), Conflicting (25), Emergency/Dangerous (20), Educational (20).
   - Separation of incremental comparisons (M1 &rarr; M2 &rarr; M3 &rarr; M4) from component ablations (removing temporal validation, evidence grounding, safety triage, context validation).
   - Dual evaluation: Factual correctness vs Evidence grounding.
3. **Study C (Cross-Cohort Generalization)**:
   - Provenance documented for BD-KDD (Islam et al., 2026, PMC13092092).
   - Explicitly documented limitations: 13-feature blood chemistry panel vs 24-feature UCI benchmark (missing urinalysis parameters), inpatient admission setting vs outpatient referrals, zero-shot transfer without cohort pooling.
4. **Integrity Disclosures**:
   - Formally documented removal of unsupported human-subject clinical trial results and unsupported 3,047 pooled record claims.

---

## 8. Verification & Build Status

| Component | Test / Verification Command | Result |
|---|---|---|
| **ML Service Tests** | `pytest test_shap_mapping.py -v` | **7 passed** (dimension alignment, original mapping, signed aggregation, OHE mapping, additivity, unknown categories, missing values) |
| **Frontend Build** | `npm run build` | **Build Success (Exit Code 0)** |
| **Backend Spring Boot** | Java Source Files & Class compilation | **Class files generated in `target/classes`** (DTOs, Entities, Services) |
| **Git Repository** | `git status` | **Active branch `phase-2-foundation`**, clean staging ready for commit |

---

## 9. Inventory of Modified & Created Files

### Backend (Spring Boot):
- `backend-springboot/src/main/resources/application.properties` (SEC-01)
- `backend-springboot/src/main/java/com/kidneycare/entity/Activity.java` (V2 fields)
- `backend-springboot/src/main/java/com/kidneycare/entity/Recommendation.java` (V2 fields)
- `backend-springboot/src/main/java/com/kidneycare/dto/request/ActivityRequest.java` (V2 fields)
- `backend-springboot/src/main/java/com/kidneycare/dto/response/ActivityResponse.java` (V2 fields)
- `backend-springboot/src/main/java/com/kidneycare/dto/response/ActivitySummaryResponse.java` *(New)*
- `backend-springboot/src/main/java/com/kidneycare/dto/response/MlPredictionResponse.java` (`isDemoMode`, `explanationStatus`)
- `backend-springboot/src/main/java/com/kidneycare/dto/response/AssessmentResponse.java` (`isDemoMode`, `explanationStatus`)
- `backend-springboot/src/main/java/com/kidneycare/dto/response/DashboardResponse.java` (`journalCompletionRate`, `recordedDaysLast7`)
- `backend-springboot/src/main/java/com/kidneycare/dto/response/RecommendationResponse.java` (V2 fields)
- `backend-springboot/src/main/java/com/kidneycare/service/ActivityService.java` (V2 saving & `getSummary`)
- `backend-springboot/src/main/java/com/kidneycare/service/AssessmentService.java` (legacy tagging)
- `backend-springboot/src/main/java/com/kidneycare/service/DashboardService.java` (journal adherence)
- `backend-springboot/src/main/java/com/kidneycare/service/MlService.java` (internal secret & exception on failure)
- `backend-springboot/src/main/java/com/kidneycare/service/RecommendationService.java` (triage & stable rules)
- `backend-springboot/src/main/java/com/kidneycare/controller/ActivityController.java` (`/api/activities/summary`)
- `backend-springboot/src/main/java/com/kidneycare/util/LifestyleScoreCalculator.java` (deprecation & progress)

### ML Service (FastAPI & Python):
- `ml-service/app/config.py` (internal secret & path resolution)
- `ml-service/app/main.py` (`internal_secret_middleware` & dynamic `/evaluate`)
- `ml-service/app/schemas.py` (`ModelEvaluationResponse`, `PredictionResponse`)
- `ml-service/app/model_loader.py` (metadata-driven feature mapping)
- `ml-service/app/predictor.py` (SHAP signed aggregation, margin verification, error handling)
- `ml-service/models/evaluation_report.json` *(New)*
- `ml-service/models/feature_mapping.json` *(New)*
- `ml-service/tests/test_shap_mapping.py` *(New test suite)*

### Frontend (React & Tailwind):
- `frontend/src/api/index.js` (`getActivitySummary`)
- `frontend/src/pages/DailyTracker.jsx` (tabs, V2 fields, weekly summary card)
- `frontend/src/pages/Dashboard.jsx` (journal adherence display)
- `frontend/src/pages/AssessmentResult.jsx` (demo banners, margin SHAP wording)
- `frontend/src/pages/ResearchAnalytics.jsx` (dynamic evaluation telemetry)
- `frontend/.env.example` *(New)*

### Database & Documentation:
- `docs/database/migration_v2.sql` *(New migration)*
- `docs/database/schema.sql` (updated baseline)
- `kidneycare-xai/.env.example` (clean placeholders)
- `docs/RESEARCH_EVALUATION_PROTOCOL.md` (amended leakage-free protocol)
- `docs/FINAL_IMPLEMENTATION_PLAN.md` (amended plan)
- `docs/PHASE_2_COMPLETION_REPORT.md` *(This report)*

---
*End of Phase 2 Completion Report.*

## 10. Local verification rerun — 24 November 2026

**Current status: Phase 2 partially verified.** This section supersedes the original sign-off and historical test summary above. The work used synthetic accounts, loopback services and disposable PostgreSQL 15.6. No hosted database was accessed or changed.

### Executed checks

- **Frontend:** `npm.cmd run build` and `npm.cmd run lint` both exited 0 (lint: 56 warnings, 0 errors) after replacing the malformed JSX equation with a plain-text log-odds equation. The bundle-size advisory remains. Pre-existing lint warnings include unused imports/variables, hook dependencies, state updates inside effects, render purity and Fast Refresh export patterns.
- **Backend:** `mvn.cmd -B clean test` exited 0 on Microsoft OpenJDK 17.0.21.1 after compiling 56 source files. Surefire reported no tests to run. The POM compiler release and both Dockerfile stages specify Java 17. The temporary JDK was set through session-local `JAVA_HOME`. No project Java target or global setting was changed.
- **Migration:** A Python/psycopg check exited 0 against disposable PostgreSQL. It created the database from `git show HEAD:kidneycare-xai/docs/database/schema.sql`, inserted synthetic user, assessment, activity and recommendation rows, and executed V2 twice. It confirmed preserved values, all added columns, NULL behavior, the `NOT_RECORDED` default, invalid medication rejection and the recommendation rule index.
- **Synthetic API integration:** The localhost Python/httpx check exited 0. Two accounts registered and logged in. Health profile PUT/GET, assessment creation with explanation data, recommendations HTTP 200, activity creation and same-date editing, weekly/monthly summaries and missing sleep/medication semantics passed. Anonymous activities returned 403. A second account received 404 for the first account's assessment and an empty activity list. A separate synthetic ML stub returned a plausible prediction flagged as demo. Spring returned 503 and the assessment history stayed empty. Recommendation provenance rendering remains unverified.
- **FastAPI:** `python -B -m pytest -p no:cacheprovider -q --disable-warnings` exited 0 with 8 tests passed, including all 7 existing SHAP tests and the new model availability regression. The in-process check rejected missing or invalid internal secrets and served an authenticated evaluation. Restarting after model files became unavailable initially retained the old artifacts, then returned a prediction-shaped HTTP 200 after clearing them. The final regression confirms that the restarted service reports model unavailable, evaluation reports unavailable when the report is absent, and prediction fails with HTTP 503. Scikit-learn artifact version and dependency deprecation warnings remain. Spring now rejects flagged demo responses before persistence and has no fixed local shared-secret fallback.
- **Research:** An inline Python run invoking `train_model.load_dataset`, `preprocess`, `build_pipeline` and `evaluate` exited 0 without overwriting artifacts. Ten-fold stratified UCI cross-validation reproduced the five training-script metrics at the JSON report's displayed precision. Accuracy 0.9850, F1 0.9881, precision 0.9849, recall 0.9920, AUROC 0.9981. Both recorded SHA-256 prefixes matched the local model and preprocessor. An independent out-of-fold calculation with the same pipeline and splits reproduced specificity of 0.9733 (exit 0). The training pipeline now generates the JSON with full SHA-256 hashes. Runtime evaluation checks bind the report to both the loaded and current files.
- **Browser:** The local landing page loaded and disposable registration reached the authenticated dashboard. The walkthrough surfaced stale pooled-cohort/calibration claims and dashboard defaults that presented missing observations as zero or suggested a universal fluid target. Those surfaces were corrected. The remaining browser journeys, including model-unavailable UI behavior, were not completed.
- **Secret review:** The filename-only scan for JWT-like literals and inline PostgreSQL credentials found no matches in the scanned tracked-file types. This targeted scan does not cover every secret format or Git history. The owner must revoke and rotate credentials identified as previously exposed, update the affected hosting configurations, then record verification without secret values.

### Remaining sign-off work

The owner conditionally approved local Phase 3. Credential rotation remains an owner action and hosted infrastructure was untouched. Complete browser, recommendation provenance and migration regressions during Phase 3.
