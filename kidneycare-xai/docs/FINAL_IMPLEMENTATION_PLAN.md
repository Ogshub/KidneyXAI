# KidneyCare-XAI — Final Implementation Plan

> **Version**: 2.0
> **Status**: Phase 1 (Audit) Complete. This document governs Phases 2–6.
> **Architecture constraint**: Extend existing React + Spring Boot + FastAPI + PostgreSQL/Supabase stack. Use pgvector for knowledge retrieval. Do not rewrite working functionality.

---

## Guiding Principles

1. **Preserve first** — no working component is rewritten. Existing endpoints, entities, and services are extended or added alongside.
2. **Decouple concerns** — prediction, explanation, recommendation, tracking, and AI assistance remain architecturally separate layers.
3. **Research integrity** — no metric, citation, user-study result, or clinical claim is fabricated. Every benchmark output is generated from code.
4. **Privacy by default** — synthetic records during development; real user data is authorized per-user; deletion is always possible.
5. **Safety boundary** — the system never presents a research classification as a clinical diagnosis or prescribes treatment.

---

## Phase Overview

| Phase | Name | Scope | Prerequisite |
|---|---|---|---|
| **P1** | Audit | ✅ Done — this document and FINAL_REPOSITORY_AUDIT.md | — |
| **P2** | Critical Bug Fixes & DB Migration | ✅ Implemented — Bug 01/07, DB migration v2, tracker upgrade, authenticated APIs | P1 |
| **P3** | Medical Reports & Lab History | Upload, storage, structured extraction, trends | P2 |
| **P4** | AI Assistant + RAG | Vector KB, intent routing, PCER, response decisions | P2 |
| **P5** | Research Evaluation Framework | Calibration, M1–M4 benchmark, ablation study | P4 |
| **P6** | Integration, Testing & Hardening | End-to-end tests, security audit, documentation | P2–P5 |

---

## Phase 2: Critical Bug Fixes & DB Migration

### Acceptance Criteria
- `/evaluate` reads live metrics from `evaluation_report.txt` — no hardcoded values
- SHAP feature names correctly align with post-OHE feature space
- `daily_activities` stores blood pressure, medication adherence, symptoms, personal notes
- Database migration script is idempotent and tested on local PostgreSQL

### 2.1 Fix BUG-01: Dynamic Model Evaluation Endpoint

**File to modify**: `ml-service/app/main.py`

```
GET /evaluate
  - Load models/evaluation_report.txt at startup into artifacts
  - Parse: accuracy, f1, precision, recall, auroc, cv_folds, top features
  - Return parsed values (not hardcoded literals)
  - If file missing: return { status: "metrics_unavailable" }
```

**Additional fix**: Update `datasetName` to accurately reflect the actual training dataset used ("UCI CKD Benchmark, 400 records, Apollo Hospitals 2015").

### 2.2 Fix BUG-07: SHAP Feature Name Alignment

**File to modify**: `ml-service/app/predictor.py`, `ml-service/app/model_loader.py`

Strategy:
1. After `preprocessor.transform()`, extract the actual transformed feature names using `preprocessor.get_feature_names_out()` — available in scikit-learn ≥ 1.0.
2. Store `encoded_feature_names` alongside `feature_names` in `artifacts`.
3. In `_compute_shap()`, build the mapping: `encoded_name → raw_feature_name` by parsing the OHE column names (e.g., `cat__hypertension_yes` → `hypertension`).
4. Aggregate SHAP values for multi-column OHE features by summing their absolute contributions back to the original feature name.

**New artifact**: `models/feature_name_map.json` — maps encoded → raw feature names.

### 2.3 Extend `daily_activities` Table

**New migration**: `docs/database/migration_v2.sql`

```sql
ALTER TABLE daily_activities
  ADD COLUMN IF NOT EXISTS systolic_bp      INTEGER,
  ADD COLUMN IF NOT EXISTS diastolic_bp     INTEGER,
  ADD COLUMN IF NOT EXISTS medication_taken BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS symptoms         TEXT,
  ADD COLUMN IF NOT EXISTS personal_notes   TEXT;
```

**Extend Java entity**: `entity/Activity.java` — add 5 new fields
**Extend DTOs**: `ActivityRequest.java`, `ActivityResponse.java`
**Extend service**: `ActivityService.java` — map new fields in `saveActivity()` and `mapToResponse()`

**Extend recommendation rules** in `RecommendationService.java`:
- Rule: `systolic_bp ≥ 140` → alert to monitor blood pressure and consult clinician (source: WHO Hypertension Guidelines)
- Rule: `medication_taken = false` on consecutive days → reminder about adherence (source: KDIGO patient education)
- Rule: symptoms containing nephrology keywords → recommend booking clinical review (reference only, no diagnosis)

### 2.4 Fix Demo Mode Transparency

**File to modify**: `ml-service/app/predictor.py`
Add `isDemoMode: true` field to `PredictionResponse` when in demo mode.
**File to modify**: Frontend `AssessmentResult.jsx` — render a visible amber banner: "⚠️ Demo predictions are illustrative only. No trained model is loaded."

### 2.5 Backend: Lifestyle Summary Endpoints

**New endpoint**: `GET /api/activities/summary?period=weekly|monthly&date=YYYY-MM-DD`
**New service method**: `ActivityService.getSummary(email, period, date)` — computes:
- Average water, exercise, sleep per selected period
- Percentage of days with low salt, no fast food, no smoking, no alcohol
- LifestyleScore trend (array of daily scores)
- Returns `ActivitySummaryResponse`

**DB**: No new table required; computed from existing `daily_activities`.

---

## Phase 3: Medical Reports & Lab History

### Acceptance Criteria
- Users can upload a lab report PDF/image; file is stored with metadata
- Structured lab values (creatinine, hemoglobin, etc.) can be manually entered per report
- Lab trends page shows time-series charts for any lab parameter across reports
- Two reports can be compared side-by-side showing delta values

### 3.1 Storage Strategy

The Phase 3 local adapter stores attachments in private PostgreSQL rows with short-lived owner-bound download grants. Hosted object storage is a future deployment decision requiring an authorized target.
Metadata stored in PostgreSQL.

### 3.2 Database Tables

```sql
-- migration_v3.sql

CREATE TABLE IF NOT EXISTS medical_reports (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date     DATE            NOT NULL,
    report_type     VARCHAR(50)     NOT NULL,  -- bloodwork / urinalysis / imaging / other
    lab_name        VARCHAR(255),
    doctor_name     VARCHAR(255),
    file_url        TEXT,                      -- Supabase Storage URL
    file_name       VARCHAR(255),
    notes           TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medical_reports_user_id ON medical_reports(user_id);
CREATE INDEX idx_medical_reports_date ON medical_reports(report_date);

CREATE TABLE IF NOT EXISTS lab_results (
    id              BIGSERIAL       PRIMARY KEY,
    report_id       BIGINT          NOT NULL REFERENCES medical_reports(id) ON DELETE CASCADE,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parameter_name  VARCHAR(100)    NOT NULL,  -- serum_creatinine, hemoglobin, etc.
    value           DOUBLE PRECISION NOT NULL,
    unit            VARCHAR(30),               -- mg/dL, g/dL, mEq/L, etc.
    reference_low   DOUBLE PRECISION,          -- normal range lower bound
    reference_high  DOUBLE PRECISION,          -- normal range upper bound
    is_abnormal     BOOLEAN         DEFAULT FALSE,
    recorded_at     DATE            NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lab_results_user_id ON lab_results(user_id);
CREATE INDEX idx_lab_results_parameter ON lab_results(parameter_name);
CREATE INDEX idx_lab_results_date ON lab_results(recorded_at);
```

### 3.3 Spring Boot — Report Controller & Service

**New endpoints**:

```
POST   /api/reports                         Upload report metadata + optional file
GET    /api/reports                         List user's reports (paginated)
GET    /api/reports/{id}                    Single report with lab results
DELETE /api/reports/{id}                    Delete report + file + lab results
POST   /api/reports/{id}/lab-results        Manually add structured lab values
GET    /api/lab-results?parameter=&limit=   Time-series for one parameter
GET    /api/lab-results/compare?a=&b=       Compare lab values between two reports
```

**New Java files**:
- `entity/MedicalReport.java`
- `entity/LabResult.java`
- `controller/ReportController.java`
- `controller/LabResultController.java`
- `service/ReportService.java`
- `service/LabResultService.java`
- `dto/request/ReportUploadRequest.java`, `LabResultRequest.java`
- `dto/response/ReportResponse.java`, `LabResultResponse.java`, `LabComparisonResponse.java`

### 3.4 Frontend — Reports & Lab History

**New pages**:
- `src/pages/Reports.jsx` — upload form + report list + per-report detail
- `src/pages/LabHistory.jsx` — parameter selector + multi-line time-series chart + reference bands
- The laboratory history view uses the existing Chart.js stack and plots measurements by collection date. Source reference intervals are recorded and displayed in report details.

**Updated API layer**: `src/api/index.js` — add `reportsApi`, `labApi`

---

## Phase 4: AI Assistant + RAG + PCER

### Acceptance Criteria
- User can ask questions in a chat interface; assistant responds with ANSWER, CLARIFY, or ABSTAIN
- All responses include cited sources; ABSTAIN decisions include the abstention reason
- RAG retrieves relevant medical knowledge from a curated pgvector knowledge base
- PCER validates that responses are grounded in patient context and current evidence
- All conversation turns are stored and auditable

### 4.1 Vector Knowledge Base Setup

**pgvector extension**: Enable in Supabase (`CREATE EXTENSION IF NOT EXISTS vector`).

**New table**:
```sql
CREATE TABLE IF NOT EXISTS knowledge_base_documents (
    id              BIGSERIAL       PRIMARY KEY,
    source          VARCHAR(255)    NOT NULL,   -- e.g. "KDIGO 2024 Guidelines §3.1"
    content         TEXT            NOT NULL,   -- text chunk (≤ 500 tokens)
    embedding       vector(1536),               -- text-embedding-3-small or equivalent
    document_type   VARCHAR(50)     NOT NULL,   -- guideline / research_paper / patient_education
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ON knowledge_base_documents USING ivfflat (embedding vector_cosine_ops) WITH (lists=50);
```

**Document ingestion pipeline** (`ml-service/app/ingest_kb.py`):
- Reads from `ml-service/data/knowledge_base/` directory (PDF/TXT files)
- Chunks text into ≤ 500-token segments
- Generates embeddings via configurable embedding API
- Upserts into `knowledge_base_documents`

**Initial knowledge base documents** (provided as text files):
- KDIGO 2024 CKD Clinical Practice Guidelines (key sections)
- NKF Patient Education pamphlets
- WHO Hypertension and Sodium Reduction Guidelines
- Academic CKD research summaries (from references.md)

### 4.2 AI Conversation Tables

```sql
CREATE TABLE IF NOT EXISTS ai_conversations (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255),
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id              BIGSERIAL       PRIMARY KEY,
    conversation_id BIGINT          NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role            VARCHAR(20)     NOT NULL,   -- user / assistant
    content         TEXT            NOT NULL,
    response_decision VARCHAR(20),              -- ANSWER / CLARIFY / ABSTAIN (null for user messages)
    abstain_reason  TEXT,                       -- populated when decision = ABSTAIN
    model_used      VARCHAR(50),               -- M1 / M2 / M3 / M4 or production model name
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_message_sources (
    id              BIGSERIAL       PRIMARY KEY,
    message_id      BIGINT          NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    source_text     TEXT            NOT NULL,
    source_ref      VARCHAR(255)    NOT NULL,   -- e.g. "KDIGO 2024 §3.1"
    relevance_score DOUBLE PRECISION
);
```

### 4.3 FastAPI Extension — Assistant Router

**New file**: `ml-service/app/assistant.py`

**Endpoints added to `main.py`**:
```
POST /assistant/chat          Full PCER-validated assistant turn
GET  /assistant/tools         List available tools
POST /rag/search              Retrieve top-k relevant chunks from knowledge base
```

**Intent Routing** (rule-based classifier in `assistant.py`):

| Intent | Trigger Pattern | Authorized Tool |
|---|---|---|
| `get_profile` | "my profile", "my health background" | `fetch_health_profile(user_id)` |
| `get_reports` | "my reports", "my lab results" | `fetch_reports(user_id)` |
| `get_lab_history` | "creatinine trend", "my hemoglobin over time" | `fetch_lab_history(user_id, parameter)` |
| `explain_assessment` | "explain my risk", "what does my score mean" | `fetch_assessment(user_id, assessment_id)` |
| `get_recommendations` | "what should I do", "my recommendations" | `fetch_recommendations(user_id)` |
| `summarize_lifestyle` | "my lifestyle", "my habits this week" | `fetch_activity_summary(user_id, period)` |
| `search_knowledge` | general medical questions | `rag_search(query)` |
| `get_reminders` | "my reminders" | `fetch_reminders(user_id)` |

**Validation Layers** (executed in sequence before generating a response):

1. **Context Validation**: Does the user have sufficient profile data to answer? (e.g., asking for creatinine trends when no lab results exist → CLARIFY)
2. **Temporal Validation**: Are the referenced data points current? (e.g., assessment older than 180 days → note staleness in response)
3. **Evidence Check**: Is the response grounded in retrieved RAG chunks? (evidence score threshold configurable)
4. **Safety Filter**: Does the query or proposed response contain diagnostic claims, medication advice, or emergency medical content?
   - Diagnostic claim → ABSTAIN with referral to clinician
   - Medication advice → ABSTAIN with referral to prescribing doctor
   - Emergency keywords ("chest pain", "can't breathe") → ABSTAIN with emergency contact guidance

**Response Decision Schema**:
```python
class AssistantDecision(Enum):
    ANSWER  = "ANSWER"   # Grounded, context-validated, evidence-sufficient
    CLARIFY = "CLARIFY"  # Missing context; ask follow-up question
    ABSTAIN = "ABSTAIN"  # Safety filter or insufficient evidence
```

### 4.4 Spring Boot — Assistant Proxy Controller

**New files**:
- `controller/AssistantController.java`
- `service/AssistantService.java`

**Endpoints**:
```
POST /api/assistant/chat          Authenticated; passes user_id + message to FastAPI; persists turn
GET  /api/assistant/conversations  List user's conversation history
GET  /api/assistant/conversations/{id}  Full conversation with messages + sources
```

The Spring Boot layer handles:
- JWT authentication (FastAPI has no auth)
- Fetching and injecting user context (profile, latest assessment, recent activities) before calling FastAPI
- Persisting the conversation turn to `ai_messages` and `ai_message_sources`

### 4.5 Frontend — Chat Interface

**New files**:
- `src/pages/Assistant.jsx` — chat window with message history, response-decision badges (ANSWER/CLARIFY/ABSTAIN), source citation expandable cards
- `src/components/assistant/ChatBubble.jsx`
- `src/components/assistant/SourceCard.jsx`
- `src/components/assistant/AbstainBanner.jsx`
- `src/api/index.js` — add `assistantApi`

---

## Phase 5: Research Evaluation Framework

### Acceptance Criteria
- XGBoost probability calibration is performed with Platt scaling and isotonic regression; reliability diagram and Brier score are reported
- 150 synthetic benchmark test cases are generated with documented reference answers across four categories
- Automated evaluation harness runs M1–M4 and records per-metric results to the database
- Ablation study results are displayed on the ResearchAnalytics page
- No results are fabricated; all numbers are computed from code

### 5.1 Probability Calibration

**New file**: `ml-service/app/calibration.py`

**Procedure**:
1. Load `kidney_model.pkl` and `preprocessor.pkl`
2. Load UCI CKD dataset; apply same preprocessing
3. Split: 80% train, 20% calibration holdout (stratified)
4. Train `CalibratedClassifierCV` with both `method='sigmoid'` (Platt) and `method='isotonic'` on the training split
5. Evaluate on holdout: Brier score, expected calibration error (ECE), reliability diagram (10 bins)
6. Save calibrated models: `kidney_model_platt.pkl`, `kidney_model_isotonic.pkl`
7. Output `models/calibration_report.json`:
```json
{
  "original_brier_score": ...,
  "platt_brier_score": ...,
  "isotonic_brier_score": ...,
  "original_ece": ...,
  "platt_ece": ...,
  "reliability_bins": [ {"bin_lower": 0.0, "bin_upper": 0.1, "mean_predicted": ..., "fraction_positives": ..., "count": ...}, ... ]
}
```

**New FastAPI endpoint**: `GET /calibrate` — returns `calibration_report.json` contents.

### 5.2 Synthetic Benchmark Dataset (150 Cases)

**New file**: `ml-service/data/benchmark_cases.json`

**Case structure**:
```json
{
  "case_id": "BC-001",
  "category": "complete_profile",  // complete_profile | incomplete_profile | outdated_data | inconsistent_data
  "query": "...",
  "patient_context": { ... },      // synthetic profile + assessments + lab results
  "reference_answer": "...",        // what a correct, grounded response looks like
  "reference_decision": "ANSWER|CLARIFY|ABSTAIN",
  "reference_sources": ["..."],
  "notes": "..."
}
```

**50 cases per category** × 3 categories = 150 total:
1. **Complete Profile** (50): all context available; correct ANSWER expected
2. **Incomplete/Missing Context** (50): key data absent; CLARIFY expected
3. **Outdated or Inconsistent Data** (50): contradictory data or stale assessments; ABSTAIN or qualified ANSWER

**Case generation script**: `ml-service/scripts/generate_benchmark.py` — generates synthetic patient profiles using configurable distributions; does not use real user data.

### 5.3 M1–M4 Ablation Harness

**New file**: `ml-service/app/benchmark.py`

```
M1: Standard LLM
    — LLM receives only the raw user query; no RAG, no patient context
M2: LLM + Medical RAG
    — LLM receives query + top-5 RAG retrieved chunks; no patient context
M3: RAG + Patient Context
    — LLM receives query + RAG + injected patient context (profile, latest assessment)
M4: RAG + Patient Context + PCER
    — Full pipeline: M3 + temporal validation + evidence grounding + safety filter + response decision
```

**Evaluation metrics per model per case**:
- `abstain_rate`: fraction of cases where model chose ABSTAIN
- `clarify_rate`: fraction of CLARIFY responses
- `answer_rate`: fraction of ANSWER responses
- `unsupported_response_rate`: fraction of ANSWER responses not grounded in cited sources
- `decision_accuracy`: fraction of cases where model's decision matches reference_decision
- `source_coverage`: fraction of reference sources cited in responses
- `hallucination_rate`: responses containing medical claims absent from both RAG and patient context (manual annotation sample)

**Database tables**:
```sql
CREATE TABLE IF NOT EXISTS benchmark_cases (
    id              BIGSERIAL       PRIMARY KEY,
    case_id         VARCHAR(20)     UNIQUE NOT NULL,
    category        VARCHAR(50)     NOT NULL,
    query           TEXT            NOT NULL,
    reference_decision VARCHAR(20)  NOT NULL,
    reference_answer TEXT           NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS benchmark_evaluations (
    id              BIGSERIAL       PRIMARY KEY,
    run_id          VARCHAR(50)     NOT NULL,  -- e.g. "run_2026-11-25_M4"
    case_id         VARCHAR(20)     NOT NULL REFERENCES benchmark_cases(case_id),
    model_config    VARCHAR(10)     NOT NULL,  -- M1 / M2 / M3 / M4
    response_decision VARCHAR(20)   NOT NULL,
    response_text   TEXT,
    sources_cited   TEXT[],
    decision_correct BOOLEAN,
    unsupported_claim BOOLEAN       DEFAULT FALSE,
    evaluated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**New FastAPI endpoint**: `POST /benchmark/run?model=M1|M2|M3|M4` — runs all 150 cases for specified model config, writes results to DB, returns aggregate metrics.

### 5.4 Updated ResearchAnalytics Page

**Updated `ResearchAnalytics.jsx`** to display:
- Calibration reliability diagram (line chart showing predicted vs actual probability per bin)
- Brier score comparison table (original vs Platt vs isotonic)
- M1–M4 side-by-side comparison table of all metrics
- Abstain/Clarify/Answer rate stacked bar chart per model

---

## Phase 6: Integration, Testing & Hardening

### 6.1 End-to-End Test Coverage

**ML Service (pytest)**:
- `test_predict_real_model.py` — 5 synthetic inputs, assert prediction + SHAP field presence
- `test_shap_alignment.py` — assert feature_names match explanation feature list length
- `test_evaluate_endpoint.py` — assert metrics loaded from file, not hardcoded
- `test_calibration.py` — assert Brier score < 0.1 on holdout
- `test_rag_retrieval.py` — assert top-k results contain relevant chunks for 3 test queries
- `test_benchmark_runner.py` — assert M4 decision_accuracy > M1 on complete-profile cases

**Spring Boot (JUnit 5 + Testcontainers)**:
- `AuthControllerTest` — register, login, JWT validation
- `AssessmentServiceTest` — mock MlService, verify SHAP save + recommendation trigger
- `ActivityServiceTest` — upsert, date range query, summary
- `ReportServiceTest` — upload metadata, lab result CRUD, comparison
- `AssistantControllerTest` — verify message persistence, decision badge propagation

**Frontend (Vitest + React Testing Library)**:
- Assessment form submission flow
- SHAP waterfall rendering
- Recommendation card "Why am I seeing this?" expansion
- Chat interface ABSTAIN badge display

### 6.2 Security Hardening

- **SEC-01 remediation**: Revoke and rotate all credentials in `.env`. Add `.env` to `.gitignore` if not present. Document required environment variables in `.env.example`.
- **SEC-02 remediation**: Add a shared internal secret (`ML_INTERNAL_SECRET`) passed as a header by Spring Boot; verify in FastAPI middleware.
- **SEC-03 remediation**: Add Spring Boot rate limiting (`bucket4j` or custom filter) on `/api/research/**` and `/api/assistant/**`.
- **SEC-04 remediation**: Validate MIME type and size (≤ 10 MB) for profile picture uploads; store external URL (Cloudinary/Supabase Storage) rather than base64 in DB.
- **SEC-05 remediation**: Implement `DELETE /api/account` — cascades delete across all user-linked tables; confirms with re-authentication before execution.

### 6.3 Data Deletion API

**New endpoint**: `DELETE /api/account`
- Requires re-authentication (password in request body)
- Deletes: user row (cascades to all related tables via FK ON DELETE CASCADE)
- Revokes JWT
- Returns 204 No Content

### 6.4 Documentation Updates

- Update `docs/SYSTEM_EXECUTION_LOG.md` with Phase 2–5 steps
- Update `README.md` with new feature list, environment variable table, and updated architecture diagram
- Update `docs/ACADEMIC_RESEARCH_REPORT_DISSERTATION_SYNOPSIS.md` Chapter 3–5 with calibration and PCER evaluation results

---

## API Contract Summary (New Endpoints)

### ML Service (FastAPI)

| Method | Path | Description |
|---|---|---|
| GET | `/evaluate` | *(fixed)* Dynamic model evaluation metrics |
| GET | `/calibrate` | Probability calibration report |
| POST | `/assistant/chat` | AI assistant turn with PCER |
| GET | `/assistant/tools` | Available assistant tools |
| POST | `/rag/search` | Vector knowledge base retrieval |
| POST | `/benchmark/run` | Run M1–M4 evaluation harness |

### Backend (Spring Boot)

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/activities/summary` | ✅ | Weekly/monthly lifestyle summary |
| POST | `/api/reports` | ✅ | Upload medical report metadata |
| GET | `/api/reports` | ✅ | List user's reports |
| GET | `/api/reports/{id}` | ✅ | Report detail with lab values |
| DELETE | `/api/reports/{id}` | ✅ | Delete report |
| POST | `/api/reports/{id}/lab-results` | ✅ | Add structured lab values |
| GET | `/api/lab-results` | ✅ | Lab parameter time-series |
| GET | `/api/lab-results/compare` | ✅ | Side-by-side report comparison |
| POST | `/api/assistant/chat` | ✅ | Send message, get response |
| GET | `/api/assistant/conversations` | ✅ | Conversation history |
| GET | `/api/assistant/conversations/{id}` | ✅ | Full conversation |
| DELETE | `/api/account` | ✅ | Delete account + all data |
| GET | `/api/benchmark/results` | Public | Latest M1–M4 benchmark summary |

---

## Database Migration Order

```
docs/database/
├── schema.sql            (existing — 7 tables)
├── migration_v2.sql      (Phase 2 — extend daily_activities, fix activity fields)
├── migration_v3.sql      (Phase 3 — medical_reports, lab_results)
├── migration_v4.sql      (Phase 4 — knowledge_base_documents, ai_conversations, ai_messages, ai_message_sources)
└── migration_v5.sql      (Phase 5 — benchmark_cases, benchmark_evaluations)
```

Each migration is:
- Idempotent (`IF NOT EXISTS`, `IF NOT EXISTS column`)
- Run in order on first deployment
- Documented with rollback instructions

---

## Technology Additions (Minimal)

| Addition | Rationale | Existing constraint respected |
|---|---|---|
| `pgvector` Supabase extension | Required for RAG embedding search | Uses existing PostgreSQL/Supabase |
| `sentence-transformers` or OpenAI embedding API | Generate document embeddings for RAG | Added to `requirements.txt` only |
| `sklearn.calibration.CalibratedClassifierCV` | Probability calibration | Already in scikit-learn ≥ 1.3 |
| `bucket4j` (Spring Boot) | Rate limiting for public endpoints | Spring Boot dependency addition only |
| `React Markdown` | Render AI assistant responses with formatting | Frontend package only |

No new microservices. All AI/RAG/PCER logic is added to the existing FastAPI service.

---

*End of FINAL_IMPLEMENTATION_PLAN.md*
