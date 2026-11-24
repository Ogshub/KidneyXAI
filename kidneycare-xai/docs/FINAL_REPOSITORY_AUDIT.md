# KidneyCare-XAI — Final Repository Audit

> **Audit Date**: 2026-11-24
> **Auditor**: Phase 1 Automated + Manual Inspection
> **Scope**: Full codebase review prior to Phase 2 implementation
> **Directive**: Read-only audit. No source code was modified.

---

## 1. Repository Structure Overview

```
kidneycare-xai/
├── backend-springboot/          Java 21 + Spring Boot 3.3.x
│   ├── src/main/java/com/kidneycare/
│   │   ├── controller/          (8 controllers)
│   │   ├── dto/                 (request + response DTOs)
│   │   ├── entity/              (7 JPA entities)
│   │   ├── exception/           (GlobalExceptionHandler, 2 custom exceptions)
│   │   ├── repository/          (7 Spring Data JPA repositories)
│   │   ├── security/            (JWT filter, JwtService, SecurityConfig)
│   │   ├── service/             (10 services)
│   │   └── util/                (LifestyleScoreCalculator)
│   └── src/main/resources/
│       └── application.properties
├── frontend/                    React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── api/                 (client.js, index.js — 6 API modules)
│       ├── components/          (charts, common, layout, tracker)
│       ├── context/             (AuthContext, ThemeContext)
│       ├── pages/               (13 pages)
│       └── utils/               (cloudinary.js)
├── ml-service/                  Python 3.11 + FastAPI + XGBoost + SHAP
│   ├── app/                     (main.py, predictor.py, schemas.py, model_loader.py, config.py)
│   ├── data/                    (UCI CKD CSV + BD-KDD CSV)
│   ├── models/                  (kidney_model.pkl, preprocessor.pkl, shap_explainer.pkl, etc.)
│   └── train_model.py
├── docs/
│   ├── api/
│   ├── database/schema.sql
│   ├── walkthrough_screenshots/
│   ├── ACADEMIC_RESEARCH_REPORT_DISSERTATION_SYNOPSIS.md
│   ├── INTERMEDIATE_FINALE_REPORT.md
│   └── SYSTEM_EXECUTION_LOG.md
├── research/
│   ├── literature/              (IEEE positioning, references)
│   └── questionnaire/           (survey-instrument.md)
├── .env                         ⚠️ CONTAINS REAL CREDENTIALS (see §8)
├── docker-compose.yml
└── render.yaml / vercel.json
```

---

## 2. Existing Working Features

### 2.1 Authentication & User Management ✅ WORKING
- **Register / Login** via `POST /api/auth/register` and `POST /api/auth/login`
- **BCrypt password hashing** in `AuthService`
- **Stateless JWT authentication** with configurable expiry (default 24h) via `JwtService` + `JwtAuthenticationFilter`
- **User profile** (name, email, bio, phone, affiliation, timezone, profilePictureUrl) — CRUD via `/api/profile`
- **Health profile** (diabetes, hypertension, smoking, alcohol, BMI, family history, painkiller usage) — one-per-user upsert via `/api/health-profile`
- **Profile picture** stored as base64 data URL or Cloudinary URL in `users.profile_picture_url` TEXT column

### 2.2 Kidney Risk Assessment ✅ WORKING
- **24-feature XGBoost pipeline** (UCI CKD: 14 numerical + 10 categorical features)
- **Leak-free preprocessing**: `ColumnTransformer` with `SimpleImputer` + `StandardScaler` fitted inside each cross-validation fold in `train_model.py`
- **10-fold stratified CV** producing Accuracy 98.50%, AUROC 0.9981, F1 0.9881
- **Trained model artifacts** present and correct: `kidney_model.pkl`, `preprocessor.pkl`, `shap_explainer.pkl`, `feature_names.json`, `evaluation_report.txt`
- **FastAPI service** at `/predict` calls `model.predict_proba()` + `shap.TreeExplainer.shap_values()` returning per-feature SHAP values sorted by |SHAP|
- **Spring Boot → Python bridge** in `MlService.java` using `RestClient` with configurable timeout (default 30 s)
- **Graceful degradation fallback** in `MlService.computeFallbackPrediction()` using clinical heuristics when ML service is unreachable
- **Assessment persistence**: `assessments` + `assessment_features` tables store risk score, prediction, model version, all SHAP values
- **Frontend Assessment page** with two modes: HOME screening (fewer fields) and LAB mode (all 24 features), with navigating to AssessmentResult

### 2.3 Traceable Rule-Based Recommendation Engine ✅ WORKING
- **Deterministic rule engine** in `RecommendationService.java` — zero LLM involvement
- **Trigger schema**: `category` + `triggerReason` + `recommendation text` + `priority` + `source` (citation)
- **13 implemented rules** covering: hypertension, diabetes, painkiller use, smoking, alcohol, low hydration, low exercise, poor sleep, high salt, fast food, high stress
- **Default recommendations** (5 baseline preventive-care items) served when no assessment exists
- **Persistence**: `recommendations` table linked to `assessments` via FK
- **Frontend**: Recommendations page displays all items with their trigger and source

### 2.4 Lifestyle Tracker ✅ WORKING
- **Daily Activity logging** (`POST /api/activities`) with upsert (one record per user per date)
- **Fields tracked**: water intake (L), exercise (min), sleep (hours), salt level (Low/Medium/High), fast food (bool), sugary drinks (count), smoking (bool), alcohol (bool), weight (kg), stress level
- **Range queries** supported: `GET /api/activities?from=&to=`
- **LifestyleScoreCalculator** (Java utility) computes a 0–100 non-diagnostic behavior consistency score from recent activity
- **Frontend**: DailyTracker page + MonthlyTrackerView component + charts (LifestyleTrendChart, MonthlyActivityChart)

### 2.5 Dashboard ✅ WORKING
- **DashboardService** aggregates: latest assessment, 7-day activity trend, lifestyle score, recommendation count, total assessments
- **Frontend**: Dashboard page with RiskTrendChart (assessment history), FeatureImportanceChart (global SHAP), ShapBarChart (local)
- **RiskTrendChart** shows historical assessments plotted over time

### 2.6 Research Survey ✅ WORKING
- **Anonymous survey** at `POST /api/research/responses` (no JWT required — public)
- **ResearchAnalytics** at `GET /api/research/analytics` aggregates survey responses
- **Frontend**: ResearchSurvey.jsx and ResearchAnalytics.jsx pages

### 2.7 Security ✅ WORKING
- **Spring Security** stateless JWT filter chain
- **Public routes**: `/api/auth/**`, `/api/research/**`, `/api/assessments/model-evaluation`
- **All other routes** require `Authorization: Bearer <token>`
- **BCrypt** (strength 10) for passwords
- **CORS** restricted to `localhost:*`, `*.vercel.app`, `*.onrender.com`, `kidney-xai.kaifkhan.in`

### 2.8 Containerization ✅ WORKING
- `docker-compose.yml` orchestrates 4 services: PostgreSQL 15, ML (FastAPI), Backend (Spring Boot), Frontend (Nginx)
- Schema seeded from `docs/database/schema.sql` on first run
- Health checks configured for DB and ML containers
- `render.yaml` and `vercel.json` for cloud deployment

---

## 3. Partially Implemented Features

### 3.1 Model Evaluation Endpoint — HARDCODED DATA ⚠️
- `GET /evaluate` in `main.py` (FastAPI) returns **static hardcoded values** (accuracy=0.9850, top features with fixed SHAP values) rather than loading live metrics from `evaluation_report.txt` or recomputing from the saved model.
- **Impact**: The `/api/assessments/model-evaluation` route served to the frontend displays synthetic data, not the actual model evaluation.

### 3.2 History Page — Incomplete UI
- `History.jsx` exists but its integration with the backend `GET /api/assessments` is not confirmed complete. The assessment list may lack pagination, filtering by date range, or per-assessment deep-dive navigation.

### 3.3 MonthlyTrackerView — Partial
- Component exists (`MonthlyTrackerView.jsx`) but the weekly/monthly summary aggregation is a frontend-only calculation. No backend `GET /api/activities/summary` endpoint exists.

### 3.4 Settings Page — Partial
- `Settings.jsx` exists and covers theme switching and some profile data, but data persistence for all settings fields (timezone, notification preferences) is not confirmed in the backend.

### 3.5 ResearchAnalytics — Limited
- `ResearchAnalytics.jsx` calls `GET /api/research/analytics` which returns aggregate counts. No cross-tabulation, cohort breakdowns, or export capability is implemented.

---

## 4. Missing Functionality (Target Features Not Yet Present)

> The following features are defined in the final objective but have **zero implementation** in the codebase.

| # | Feature | Missing Components |
|---|---|---|
| 4.1 | **Medical Report Upload** | No file storage integration, no `medical_reports` table, no `/api/reports` endpoint, no frontend page |
| 4.2 | **Structured Laboratory Records** | No `lab_results` table or dedicated lab value history (only stored as SHAP features inside assessments) |
| 4.3 | **Longitudinal Lab Trends** | No time-series lab value queries, no reference range comparison, no report-to-report delta |
| 4.4 | **Weekly/Monthly Lifestyle Summaries** | No backend aggregation endpoints; frontend-computed only |
| 4.5 | **Conversational AI Assistant** | No LLM integration, no tool routing, no intent classifier, no ABSTAIN/CLARIFY/ANSWER logic |
| 4.6 | **Medical RAG Knowledge Base** | No vector store, no pgvector schema, no document ingestion pipeline, no embedding generation |
| 4.7 | **PCER Framework** | No patient-context validator, no temporal validator, no evidence grounding layer, no response-decision engine |
| 4.8 | **M1–M4 Ablation Benchmark** | No synthetic test case dataset (150 cases), no reference answers, no automated evaluation harness |
| 4.9 | **Probability Calibration Study** | No Platt scaling / isotonic regression / reliability diagram code in `train_model.py` |
| 4.10 | **Medication Adherence Tracking** | `daily_activities` table has no medication field; no reminder/notification system |
| 4.11 | **Symptoms Journal** | No `symptoms` column or table; no symptom tracker UI |
| 4.12 | **Blood Pressure Optional Entry** | Health profile has hypertension flag; no daily BP reading log in `daily_activities` |
| 4.13 | **Data Deletion** | No `DELETE /api/account` endpoint; no GDPR-compliant data wipe flow |
| 4.14 | **Report Comparison** | No diff/delta view between two assessments or two lab reports |

---

## 5. Confirmed Bugs and Architecture Issues

### BUG-01: `/evaluate` Endpoint Returns Hardcoded Data
**File**: `ml-service/app/main.py` lines 132–163
**Description**: The `GET /evaluate` route constructs a `ModelEvaluationResponse` from manually typed literal values. It does not read `models/evaluation_report.txt` or reload from the trained model. The `datasetName` field claims "Multi-Cohort Synthesis (3,047 patient records)" which is inconsistent with the documented training procedure (UCI benchmark only, 400 records).
**Severity**: HIGH — research integrity concern, displayed on the ResearchAnalytics page.

### BUG-02: Demo SHAP Values Are Misleading
**File**: `ml-service/app/predictor.py` lines 206–231
**Description**: `_predict_demo()` generates synthetic SHAP values using simple linear multiplications of `risk_score`. These values are presented to users through the same SHAP waterfall chart component as real model outputs. When running in demo mode (model not loaded), users see fabricated explanations indistinguishable from real ones.
**Severity**: MEDIUM — no "DEMO" label on chart output.

### BUG-03: `LifestyleScoreCalculator` Max Day Score Bug
**File**: `backend-springboot/.../util/LifestyleScoreCalculator.java` line 86
**Description**: Comment says "Max day score = 90", but the normalization divides by 90.0 — however fields like `stress_level` add no points (skipped). If a user logs all maximum-score entries, the theoretical maximum before normalization is 70 (15+20+15+10+10+10+5+5=90 when stress is omitted). Score of 90 would only be achieved if stress added 0. The score is effectively correct, but the comment misleads.
**Severity**: LOW — cosmetic/documentation bug.

### BUG-04: `profile_picture_url` Stores Base64 in TEXT Column
**File**: `docs/database/schema.sql` line 16, `entity/User.java`
**Description**: Profile pictures are stored as base64 data URLs directly in the `profile_picture_url TEXT` column in PostgreSQL. Base64-encoded images can be hundreds of KB to several MB in size. Storing these in-row causes: (a) excessive row size inflating WAL and backup sizes, (b) slow dashboard queries joining on `users`, (c) potential VARCHAR overflow on some PG text limits.
**Severity**: MEDIUM — scalability concern.

### BUG-05: JWT Secret Hardcoded in `application.properties`
**File**: `backend-springboot/src/main/resources/application.properties` line ~20
**Description**: The `jwt.secret` property falls back to a hardcoded value: `${JWT_SECRET:[redacted historical fallback]}`. If the `JWT_SECRET` environment variable is absent, any deployment uses this known key, allowing any person with this key to forge valid JWTs.
**Severity**: MEDIUM — acceptable for dev/research but must be enforced in production.

### BUG-06: `alcohol` and `smoking` Type Mismatch Between Schema and Entity
**File**: `entity/Activity.java` lines 47–51 vs `entity/HealthProfile.java`
**Description**: In `daily_activities`, `smoking` and `alcohol` are stored as `BOOLEAN`. In `health_profiles`, they are `VARCHAR(30)` with values like "Never / Occasional / Regular". The `RecommendationService` checks `latestActivity.getSmoking()` as a boolean but then compares healthProfile values as strings — different semantics for the same real-world concept, creating potential for rule misfires.
**Severity**: MEDIUM — data model inconsistency.

### BUG-07: Missing SHAP Feature Name Alignment After Preprocessing
**File**: `ml-service/app/predictor.py` lines 186–196
**Description**: After `preprocessor.transform()`, the feature array has expanded dimensionality (OneHotEncoding creates new columns for categorical features). `artifacts.feature_names` contains the original 24 raw feature names, but `values` from SHAP has columns matching the **encoded** feature space. The indexing loop `for i, name in enumerate(feature_names)` aligns raw names to encoded SHAP indices, potentially misattributing SHAP values when OHE columns precede or interleave with original positions.
**Severity**: HIGH — may produce incorrect SHAP feature attributions displayed to users.

---

## 6. Potential Data Leakage (ML)

### LEAK-01: `train_model.py` — Pipeline Leak Status ✅ CLEAN
The training script wraps all preprocessing (`SimpleImputer`, `StandardScaler`, `OneHotEncoder`) inside a `sklearn.Pipeline` object that is fitted exclusively on training splits within `StratifiedKFold`. Validation splits never see the fitted scaler or imputer statistics. **No data leakage confirmed.**

### LEAK-02: `GET /evaluate` — Fabricated Metric Presentation ⚠️
The hardcoded metrics in `main.py` (Accuracy=98.50%, AUROC=0.9981) happen to match the actual `evaluation_report.txt` values, but are not dynamically read from it. If the model is retrained with different hyperparameters, the endpoint would continue reporting stale values. This is not statistical leakage but **research metric misrepresentation**.

### LEAK-03: Calibration Study — Not Performed
Probability calibration (Platt scaling, isotonic regression, Brier score, reliability diagrams) has not been performed. The XGBoost `predict_proba()` output is used directly as a risk score and displayed to users as a percentage. XGBoost probabilities are known to be over-confident on small datasets. This is a **missing validation step**, not leakage.

---

## 7. Security and Privacy Concerns

### SEC-01: CRITICAL — Real Credentials Committed to `.env` File
**File**: `.env` (root and `kidneycare-xai/.env`)
The `.env` file contains:
- Supabase DB password: `Kidneyprojectmca1`
[REDACTED - Exposed credential removed]
- JWT secret: `XGg7sWWYpmxIatIpSOtXNsI3fytG8O2UgYpxRRlLdR8=`
- Cloudinary cloud name: `mkvwiqlw`

**If this repository is or becomes public, all credentials must be rotated immediately.** The `.gitignore` should confirm `.env` is excluded.

### SEC-02: ML Service Has No Authentication
**File**: `ml-service/app/main.py` — CORS middleware allows `settings.allowed_origins`
The `/predict`, `/evaluate`, and `/model-info` endpoints have **no authentication**. Any process that can reach the ML service's port can invoke the XGBoost model. The design assumes the ML service is on a private network only reachable by the Spring Boot backend, but this is not enforced at the API layer.

### SEC-03: Research Survey Public Endpoint — No Rate Limiting
**File**: `security/SecurityConfig.java` — `/api/research/**` is `permitAll()`
No rate limiting, CAPTCHA, or IP throttling exists on the research survey endpoint. It is trivially flooded with synthetic submissions that would corrupt the research dataset.

### SEC-04: Base64 Profile Pictures — No Validation
No MIME type validation, size limit, or content scanning on profile picture uploads. A user could submit arbitrary binary data or extremely large payloads.

### SEC-05: No Data Deletion Capability
No `DELETE /api/account` or similar endpoint exists. Users cannot request deletion of their assessment history, health profile, or activity records. This is a GDPR/privacy concern if real user data is collected.

---

## 8. Existing Database Tables

| Table | Description | Key Fields | Status |
|---|---|---|---|
| `users` | Registered users | id, email, password_hash, role, profile_picture_url | ✅ Working |
| `health_profiles` | One per user, lifestyle background | diabetes, hypertension, smoking, alcohol, BMI | ✅ Working |
| `assessments` | ML prediction results | risk_score, risk_category, prediction, model_version | ✅ Working |
| `assessment_features` | Per-assessment SHAP values | feature_name, feature_value, shap_value | ✅ Working |
| `daily_activities` | Lifestyle journal entries (one per day) | water, exercise, sleep, salt, fast_food, stress | ✅ Working |
| `recommendations` | Rule-engine outputs per assessment | category, trigger_reason, priority, source | ✅ Working |
| `research_responses` | Anonymous survey data (no FK to users) | participant_id, lifestyle, awareness fields | ✅ Working |

**Missing tables (must be created in Phase 2):**

| Table | Purpose |
|---|---|
| `medical_reports` | Uploaded lab report files (metadata + storage URL) |
| `lab_results` | Structured extracted lab values per report |
| `knowledge_base_documents` | RAG source documents with embeddings (pgvector) |
| `ai_conversations` | Conversation threads per user |
| `ai_messages` | Individual messages + response decisions (ANSWER/CLARIFY/ABSTAIN) |
| `ai_message_sources` | Audit trail: sources cited per AI message |
| `benchmark_cases` | 150 synthetic PCER test cases |
| `benchmark_evaluations` | Evaluation run results for M1–M4 |
| `activity_summaries` | Pre-aggregated weekly/monthly lifestyle summaries |

---

## 9. Reusable APIs

The following existing Spring Boot endpoints are confirmed working and should be preserved without modification:

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/login` | JWT login |
| GET/PUT | `/api/profile` | User profile |
| GET/PUT | `/api/health-profile` | Health background |
| POST | `/api/assessments` | Create assessment (calls ML + saves recommendations) |
| GET | `/api/assessments` | List user's assessments |
| GET | `/api/assessments/{id}` | Single assessment with features + recommendations |
| GET | `/api/assessments/model-evaluation` | Model metrics (currently hardcoded) |
| POST | `/api/activities` | Log/upsert daily lifestyle entry |
| GET | `/api/activities` | Get activity history (optionally filtered by date) |
| GET | `/api/recommendations` | Get recommendations (by assessmentId or all user) |
| GET | `/api/dashboard` | Aggregated dashboard data |
| POST | `/api/research/responses` | Submit anonymous survey |
| GET | `/api/research/analytics` | Survey analytics |

---

## 10. Features to Retain / Modify / Postpone

### RETAIN (do not touch)
- All existing JWT authentication and authorization logic
- `train_model.py` pipeline (leak-free, proven working)
- Trained model artifacts (`kidney_model.pkl`, `preprocessor.pkl`, `shap_explainer.pkl`)
- Recommendation rule engine (all 13 rules)
- `LifestyleScoreCalculator` (fix comment only)
- All 7 existing database tables and their migrations
- Docker Compose and deployment configs
- All existing frontend pages and chart components

### MODIFY (targeted changes only)
- `GET /evaluate` — read from `evaluation_report.txt` dynamically instead of hardcoding
- `daily_activities` — add columns: `systolic_bp`, `diastolic_bp`, `medication_taken` (bool), `symptoms` (TEXT), `personal_notes` (TEXT)
- `ActivityService` / `ActivityRequest` / `ActivityResponse` — add new fields
- SHAP feature name alignment in `predictor.py` — fix index mapping after preprocessing
- Demo mode — add explicit `"demo"` badge to SHAP chart responses
- `RecommendationService` — extend rules to consume upgraded activity fields

### NEW (add without touching existing)
- Medical report upload system (storage + metadata + structured extraction)
- Lab result history and trends
- AI assistant (FastAPI extension: intent routing, tool calls, PCER)
- RAG pipeline (pgvector + document ingestion + retrieval)
- PCER evaluation framework
- M1–M4 ablation benchmark harness
- Probability calibration module in `train_model.py`
- Weekly/monthly summary endpoints
- Data deletion endpoint

### POSTPONE (Phase 3+)
- Real-time notifications / reminders
- Multi-user role management (clinician view)
- Native mobile application

---

## 11. Research Claims Supported by Reproducible Evidence

| Claim | Evidence Status |
|---|---|
| Accuracy 98.50%, AUROC 0.9981 on UCI CKD (10-fold CV) | ✅ Reproducible — `train_model.py` + `evaluation_report.txt` |
| Hemoglobin top SHAP feature (mean\|SHAP\|=1.649) | ✅ Reproducible — `global_importance.json` + `evaluation_report.txt` |
| Leakage-free pipeline (imputer/scaler inside CV folds) | ✅ Verifiable in `train_model.py` |
| External validation on BD-KDD 988 records | ⚠️ Dataset present in `data/` but no automated benchmark script exists |
| Human study N=64, H1–H5 results | ❌ Not reproducible from code — controlled study data and analysis scripts absent |
| Multi-cohort "3,047 records" claim in `/evaluate` | ❌ Fabricated — only 400 records used in training per `evaluation_report.txt` |
| Probability calibration of XGBoost | ❌ Not performed anywhere in codebase |

---

## 12. Files That Must Be Created or Modified

### New Files — ML Service
- `ml-service/app/calibration.py` — Platt/isotonic calibration, reliability diagrams, Brier score
- `ml-service/app/benchmark.py` — M1–M4 ablation evaluation harness
- `ml-service/app/rag.py` — RAG retrieval + embedding generation
- `ml-service/app/assistant.py` — Intent routing, context validation, PCER decision engine
- `ml-service/app/tools.py` — Authorized AI tool implementations
- `ml-service/data/benchmark_cases.json` — 150 synthetic test cases with reference answers
- `ml-service/models/calibration_report.json` — Calibration output metrics

### New Files — Spring Boot
- `controller/ReportController.java`
- `controller/AssistantController.java`
- `controller/LabResultController.java`
- `entity/MedicalReport.java`
- `entity/LabResult.java`
- `entity/AiConversation.java` + `AiMessage.java` + `AiMessageSource.java`
- `service/ReportService.java`
- `service/AssistantService.java`
- `service/LabResultService.java`
- `dto/request/ReportUploadRequest.java`
- `dto/response/ReportResponse.java` + `LabResultResponse.java` + `AssistantMessageResponse.java`

### Modified Files — Spring Boot
- `entity/Activity.java` — add: `systolicBp`, `diastolicBp`, `medicationTaken`, `symptoms`, `personalNotes`
- `dto/request/ActivityRequest.java` — add corresponding fields
- `dto/response/ActivityResponse.java` — add corresponding fields
- `service/ActivityService.java` — map new fields
- `service/RecommendationService.java` — add rules for BP, medication, symptoms
- `docs/database/schema.sql` — add all missing tables + altered columns

### Modified Files — FastAPI
- `ml-service/app/main.py` — fix `/evaluate` to load from file; add `/assistant`, `/rag/search`, `/calibrate` endpoints
- `ml-service/app/predictor.py` — fix SHAP feature name alignment post-OHE

### New Files — Frontend
- `src/pages/Reports.jsx` — medical report upload and history
- `src/pages/LabHistory.jsx` — longitudinal lab trend charts
- `src/pages/Assistant.jsx` — conversational AI chat interface
- `src/pages/BenchmarkResults.jsx` — research evaluation dashboard

### Modified Files — Frontend
- `src/api/index.js` — add: `reportsApi`, `labApi`, `assistantApi`, `benchmarkApi`
- `src/pages/DailyTracker.jsx` — add new field inputs (BP, medication, symptoms, notes)
- `src/pages/ResearchAnalytics.jsx` — add M1–M4 benchmark visualization

### New Files — Database Migration
- `docs/database/migration_v2.sql` — all ALTER TABLE + CREATE TABLE statements for Phase 2

---

*End of FINAL_REPOSITORY_AUDIT.md*
