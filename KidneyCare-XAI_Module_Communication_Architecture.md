# KidneyCare-XAI — Module Orchestration & Communication Architecture

**Companion document to the Final Project Specification**
Purpose: define exactly *how every module talks to every other module* — protocols, payloads, sequence, ownership, and failure behavior — so implementation in Weeks 2–3 has no ambiguity.

Rule that governs everything below:

> **React never talks to PostgreSQL. React never talks to Python. Everything passes through Spring Boot.**
> Spring Boot is the single orchestrator. The ML service is a stateless prediction+explanation utility it calls.

---

## 0. How to read this document

1. §1 — full module inventory (what exists, what it owns, who it talks to)
2. §2 — master communication matrix (every arrow in the architecture, in one table)
3. §3 — internal Spring Boot layering pattern (applies to every module)
4. §4 — the Spring Boot ↔ Python ML contract, in detail
5. §5 — end-to-end sequence walkthroughs for every user-facing flow
6. §6 — data ownership map (which table, which module, read vs write)
7. §7 — cross-cutting concerns (auth, validation, errors, CORS, tracing)
8. §8 — failure modes and degraded-mode behavior
9. §9 — deployment-time wiring (docker-compose, ports, env vars)
10. §10 — two small structural additions needed to make the spec's own module list complete
11. §11 — master diagram

---

## 1. Full module inventory

| # | Module | Layer | Responsibility | Talks to |
|---|--------|-------|-----------------|----------|
| 1 | **Landing/Auth UI** | React | Registration/login forms | Spring Boot `AuthController` |
| 2 | **AuthController/Service** | Spring Boot | Register, login, issue JWT | `UserRepository`, `JwtService` |
| 3 | **Profile UI** | React | Edit name/age/gender/height/weight | `ProfileController` |
| 4 | **ProfileController/Service** | Spring Boot | CRUD profile, compute BMI | `UserRepository` (or dedicated `ProfileRepository`) |
| 5 | **Health Profile UI** | React | Diabetes/hypertension/family history/smoking/alcohol/painkillers | `HealthProfileController` |
| 6 | **HealthProfileController/Service** | Spring Boot | CRUD health profile | `HealthProfileRepository` |
| 7 | **Assessment UI** | React | Enter clinical features, view result + SHAP | `AssessmentController` |
| 8 | **AssessmentController/Service** | Spring Boot | Validate input, call ML, persist result | `AssessmentRepository`, `MlService`, `RecommendationService` |
| 9 | **MlService (Java client)** | Spring Boot | HTTP client to Python service | Python **ML Service** |
| 10 | **ML Service** | Python (FastAPI/Flask) | Run model + SHAP, return JSON | Model artifact + SHAP explainer (in-process) |
| 11 | **RecommendationController/Service** | Spring Boot | Apply rule engine, persist traceable recommendations | `RecommendationRepository`, reads `HealthProfile`, `Activity`, `AssessmentFeature` |
| 12 | **Tracker UI** | React | Daily lifestyle entry form | `ActivityController` |
| 13 | **ActivityController/Service** | Spring Boot | CRUD daily activity rows | `ActivityRepository` |
| 14 | **Dashboard UI** | React | Aggregate view + Chart.js | `DashboardController` |
| 15 | **DashboardController/Service** | Spring Boot | Fan-in aggregator (no own table) | `AssessmentRepository`, `ActivityRepository`, `RecommendationRepository` |
| 16 | **History/Trends UI** | React | Time-series charts | `AssessmentController` (list), `ActivityController` (range query) |
| 17 | **Research Intake UI** | React (public route) | College questionnaire (Dataset B) | `ResearchController` *(addition, see §10)* |
| 18 | **ResearchController/Service** | Spring Boot | Persist anonymized survey rows | `ResearchResponseRepository` *(addition, see §10)* |
| 19 | **PostgreSQL/Supabase** | Database | Durable storage | Read/written only by Spring Boot repositories |
| 20 | **Security layer** | Spring Boot | JWT filter, password hashing, CORS | Wraps every controller except `/auth/**` and public research route |

---

## 2. Master communication matrix

Every inter-module arrow in the system, in one place. "Sync REST" = request/response over HTTPS/JSON; "Internal call" = direct Java method call inside the same Spring Boot process.

| # | From | To | Protocol | Fires when | Carries |
|---|------|----|----|------------|---------|
| 1 | React | `AuthController` | Sync REST `POST /api/auth/register` | User submits signup | name, email, password |
| 2 | React | `AuthController` | Sync REST `POST /api/auth/login` | User submits login | email, password → returns JWT |
| 3 | React | `ProfileController` | Sync REST `GET/PUT /api/profile` | Profile page load/save | JWT in header; profile fields |
| 4 | React | `HealthProfileController` | Sync REST `GET/PUT /api/health-profile` | Health profile page | JWT; health fields |
| 5 | React | `AssessmentController` | Sync REST `POST /api/assessments` | User submits clinical form | JWT; clinical feature values |
| 6 | `AssessmentController` | `AssessmentService` | Internal call | Every request | validated DTO |
| 7 | `AssessmentService` | `MlService` | Internal call | Before persisting | feature map |
| 8 | `MlService` | Python **ML Service** | Sync REST `POST /predict` | Every assessment | JSON feature payload |
| 9 | ML Service | `MlService` | Sync REST response | After inference | riskScore, prediction, SHAP array, modelVersion |
| 10 | `AssessmentService` | `AssessmentRepository` → PostgreSQL | JPA/Hibernate | After ML responds | `assessments` + `assessment_features` rows |
| 11 | `AssessmentService` | `RecommendationService` | Internal call | Immediately after saving assessment | assessmentId, SHAP top features, healthProfile, latest activity |
| 12 | `RecommendationService` | `RecommendationRepository` → PostgreSQL | JPA/Hibernate | After rule evaluation | `recommendations` rows (trigger, category, priority, source) |
| 13 | `AssessmentController` | React | Sync REST response | Request complete | riskScore, category, SHAP, recommendations, assessmentId |
| 14 | React | `RecommendationController` | Sync REST `GET /api/recommendations` | Recommendations tab, "Why am I seeing this?" | JWT; optional assessmentId filter |
| 15 | React | `ActivityController` | Sync REST `POST /api/activities` | Daily tracker "Save" | JWT; day's lifestyle values |
| 16 | React | `ActivityController` | Sync REST `GET /api/activities?from&to` | History/trends page | JWT; date range |
| 17 | React | `DashboardController` | Sync REST `GET /api/dashboard` | Dashboard load | JWT only |
| 18 | `DashboardService` | `AssessmentRepository` | JPA query | Dashboard request | latest assessment + history |
| 19 | `DashboardService` | `ActivityRepository` | JPA query | Dashboard request | today's entry + trend window |
| 20 | `DashboardService` | `RecommendationRepository` | JPA query | Dashboard request | most recent N recommendations |
| 21 | `DashboardService` | (internal) Lifestyle Score util | Internal call | Dashboard request | computed 0–100 score |
| 22 | `DashboardController` | React | Sync REST response | Request complete | composite `DashboardDTO` |
| 23 | React (public) | `ResearchController` | Sync REST `POST /api/research/responses` | Participant submits questionnaire | anonymized ID, no JWT required |
| 24 | `ResearchController` | `ResearchResponseRepository` → PostgreSQL | JPA/Hibernate | On submit | one row per participant response |
| 25 | Every protected controller | `JwtAuthenticationFilter` → `SecurityConfig` | Servlet filter chain | Every incoming request | Authorization header |
| 26 | Research team (offline) | PostgreSQL / exported CSV | SQL export or JPA-based export endpoint | Analysis phase | anonymized Dataset B rows |
| 27 | ML training pipeline (offline, notebooks) | Model artifact + SHAP explainer file | Filesystem | After training/retraining | versioned `.pkl`/`.json` loaded by ML Service at startup |

No row in this table has React calling PostgreSQL or Python directly — that's intentional and should be treated as an architectural invariant during code review.

---

## 3. Internal Spring Boot layering (applies to every module)

Every one of Auth, Profile, Health Profile, Assessment, Activity, Recommendation, Dashboard follows the identical internal pattern:

```text
Controller  (HTTP in/out, request mapping, @Valid on DTOs)
     │
     ▼
Service     (business logic, orchestration, transactions)
     │
     ▼
Repository  (Spring Data JPA interface)
     │
     ▼
PostgreSQL
```

Two modules break the straight line downward and fan out sideways — worth calling out explicitly because they're the ones most likely to be implemented wrong:

```text
AssessmentService
     ├──▶ MlService ──▶ Python ML Service        (external call, before persistence)
     ├──▶ AssessmentRepository                    (persistence)
     └──▶ RecommendationService                   (triggers a second module after its own write)

DashboardService
     ├──▶ AssessmentRepository      (read only)
     ├──▶ ActivityRepository        (read only)
     └──▶ RecommendationRepository  (read only)
```

`DashboardService` should never write to any table — it is a pure read-side aggregator. If it starts writing, that's a sign dashboard logic has leaked into the wrong layer.

DTOs sit between Controller and the outside world in both directions — entities should never be returned directly to React (avoids leaking password hashes, lazy-loading exceptions, and internal fields like `model_version` bookkeeping columns you don't want the client mutating).

---

## 4. The Spring Boot ↔ Python ML contract

This is the one cross-language boundary in the system, so it deserves its own section.

### 4.1 Request (`MlService` → ML Service)

```json
POST /predict
Content-Type: application/json

{
  "age": 45,
  "bloodPressure": 150,
  "glucose": 130,
  "creatinine": 2.1
  // ...remaining fields, fixed once Dataset A is finalized (§5 of spec)
}
```

`MlService` is responsible for:
- mapping the internal `AssessmentRequestDTO` field names to whatever the ML service's trained feature names/order expect
- setting a request timeout (e.g. 5–10s) so a slow/hung Python process cannot hang the user-facing request indefinitely
- attaching a correlation ID header (see §7.4) for cross-service tracing

### 4.2 Response (ML Service → `MlService`)

```json
{
  "riskScore": 0.74,
  "prediction": "ckd",
  "explanations": [
    { "feature": "serum_creatinine", "value": 2.1, "shapValue": 0.21 },
    { "feature": "blood_pressure",   "value": 150, "shapValue": 0.14 }
  ],
  "modelVersion": "1.0"
}
```

`AssessmentService` then:
1. writes one row to `assessments` (`risk_score`, `risk_category` if a defensible thresholding scheme has been established, `model_version`, `created_at`)
2. writes one row per entry in `explanations` to `assessment_features`
3. hands the top-N SHAP features + `HealthProfile` + latest `Activity` row to `RecommendationService`

### 4.3 Internal ML Service structure (what happens inside the Python box)

```text
/predict endpoint
      │
      ▼
Input validation (schema check)
      │
      ▼
Feature transform (same encoding/scaling used at training time — reuse the fitted
                   preprocessing pipeline, never re-derive it ad hoc)
      │
      ▼
model.predict_proba()  ──▶ riskScore
      │
      ▼
explainer.shap_values() ──▶ per-feature contribution for THIS instance
      │
      ▼
Assemble JSON response (riskScore, prediction, explanations, modelVersion)
```

Model artifact, fitted preprocessing pipeline, and SHAP explainer are loaded **once at service startup**, not per-request — per-request loading would make `/predict` unacceptably slow and is a common mistake worth avoiding explicitly.

### 4.4 Versioning discipline

`modelVersion` is generated at training time (§30 of spec) and is baked into the response on every call. `AssessmentService` persists it verbatim on the `assessments` row. This means:
- retraining the model and deploying "v2" never rewrites history
- a user's assessment from three weeks ago is always interpretable against the model that actually produced it
- the research paper can report "all results in Experiment 1–5 used model_version = 1.0" unambiguously

### 4.5 Optional, not in the original module list (flagging clearly)

If global SHAP values (§16 of spec, needed for the paper's dataset-wide feature importance figure) should be servable at runtime rather than only generated once inside a research notebook, a second read-only endpoint is a clean addition:

```text
GET /model-info
→ { "modelVersion": "1.0", "trainedAt": "...", "globalFeatureImportance": [ ... ] }
```

This is optional — the spec's plan of computing global SHAP inside the ML notebook for the paper is sufficient on its own. Only add this endpoint if the dashboard or docs pages should display global importance live.

---

## 5. End-to-end sequence walkthroughs

### 5.1 Registration & Login

```text
React (Register form)
   │  POST /api/auth/register {name,email,password}
   ▼
AuthController → AuthService
   │  hash password (BCrypt) → save via UserRepository
   ▼
PostgreSQL: users row created
   │
   ▼
AuthController → React: 201 Created

React (Login form)
   │  POST /api/auth/login {email,password}
   ▼
AuthController → AuthService
   │  verify hash → JwtService issues signed JWT
   ▼
AuthController → React: { token, userId, name }
   │
   ▼
React stores token, attaches "Authorization: Bearer <token>"
to every subsequent Axios request.
```

### 5.2 Profile + Health Profile setup

```text
React → GET /api/profile (JWT)          → ProfileService → UserRepository        → profile fields
React → PUT /api/profile (JWT + body)   → ProfileService → recompute BMI → save  → updated profile
React → GET /api/health-profile (JWT)   → HealthProfileService → HealthProfileRepository
React → PUT /api/health-profile (JWT)   → HealthProfileService → save            → updated health profile
```

### 5.3 Risk Assessment — the core flow (§4 spec principle: ML predicts, SHAP explains)

```text
React (Assessment form)
   │  POST /api/assessments (JWT + clinical features)
   ▼
AssessmentController
   │  @Valid on AssessmentRequestDTO
   ▼
AssessmentService
   │
   ├──▶ MlService.predict(features)
   │        │  POST /predict → Python ML Service
   │        │  model.predict_proba + shap_values
   │        ◀── { riskScore, prediction, explanations[], modelVersion }
   │
   ├──▶ AssessmentRepository.save(assessment)              [assessments table]
   ├──▶ AssessmentFeatureRepository.saveAll(explanations)   [assessment_features table]
   │
   └──▶ RecommendationService.generateFor(assessment, healthProfile, latestActivity)
            │  rule engine evaluates: exercise, diet, smoking, painkillers,
            │  hypertension, SHAP top features, etc.
            ▼
        RecommendationRepository.saveAll(recommendations)   [recommendations table:
                                                               trigger/category/
                                                               recommendation/priority/source]
   ▼
AssessmentController → React:
   { riskScore, riskCategory, explanations, recommendations, assessmentId }
   ▼
React renders: Result card → SHAP bar chart → Recommendations list
   with each recommendation clickable → "Why am I seeing this?" → shows trigger
```

Key discipline this flow enforces: the ML service never sees or produces recommendations, and the rule engine never sees raw clinical values it wasn't explicitly given — it only reasons over what `AssessmentService` hands it. That keeps "ML predicts / SHAP explains / Rules recommend" genuinely separated in code, not just in the diagram.

### 5.4 Daily Lifestyle Tracking

```text
React (Tracker "Today's Health" form)
   │  POST /api/activities (JWT + water, exercise, sleep, diet flags, weight, stress)
   ▼
ActivityController → ActivityService → ActivityRepository.save()
   ▼
daily_activities row upserted for (user_id, activity_date)
   ▼
React → 200 OK → dashboard/tracker UI refreshes
```

Note: tracking entries do **not** automatically trigger a new recommendation batch tied to an assessment — recommendations are generated at assessment time (§5.3) and can optionally be regenerated on demand via `GET /api/recommendations` reading the latest stored activity, rather than firing on every single tracker save. This avoids a chatty write→recompute loop every time someone logs a glass of water.

### 5.5 Dashboard Aggregation (fan-in read)

```text
React (Dashboard load)
   │  GET /api/dashboard (JWT)
   ▼
DashboardController → DashboardService
   │
   ├──▶ AssessmentRepository.findLatestByUser()        → current risk + category
   ├──▶ ActivityRepository.findByUserAndDate(today)    → today's activity
   ├──▶ ActivityRepository.findRange(user, last30days) → trend series for Chart.js
   ├──▶ RecommendationRepository.findRecentByUser()    → recent guidance
   └──▶ computeLifestyleProgressScore(activities)      → 0–100 app-level score
   ▼
DashboardController → React: single composite DashboardDTO
   ▼
React renders cards + Chart.js graphs from one payload (no additional round trips)
```

### 5.6 History & Trends

```text
React (History page)
   │  GET /api/assessments (JWT)                → list of past assessments (date, score, category)
   │  GET /api/activities?from=...&to=...(JWT)  → lifestyle series for the same window
   ▼
React renders:
   "Model Risk Score History" line chart   (NOT "recovery")
   Weight / exercise / water / sleep trend charts
```

### 5.7 Reassessment

```text
User completes a new Risk Assessment (same flow as §5.3, new POST /api/assessments)
   ▼
New row in `assessments` with a new created_at and (possibly new) model_version
   ▼
React (Result screen) fetches previous + current via GET /api/assessments
   ▼
Displays: previous score → new score → Δ (e.g. −0.07)
Copy explicitly states: "Change in model-generated risk score," not "improvement in condition."
```

### 5.8 College Research Data Collection (Dataset B) — deliberately decoupled

```text
Participant (student/faculty, anonymous, no login)
   │  opens public research route in the same React app (or a standalone form)
   ▼
Research Intake UI
   │  POST /api/research/responses  (no JWT — public endpoint)
   │  { participantId, role, ageGroup, gender?, healthQs, lifestyleQs, awarenessQs }
   ▼
ResearchController → ResearchService → ResearchResponseRepository.save()
   ▼
`research_responses` table — no foreign key to `users`, no name/email/phone
   ▼
(Offline, later) Research team exports this table for statistical analysis (§39–41 of spec)
```

Keeping this on its own table with its own controller, entirely disconnected from the authenticated `users`/`assessments` chain, is what makes the "Dataset B is not a clinically labeled CKD dataset and is not tied to app accounts" boundary (§6 of spec) hold up structurally rather than just as a stated intention.

---

## 6. Data ownership map

| Table | Written by | Read by |
|---|---|---|
| `users` | `AuthService`, `ProfileService` | `ProfileService`, `AuthService` (login lookup), `SecurityConfig` (principal load) |
| `health_profiles` | `HealthProfileService` | `HealthProfileService`, `RecommendationService` |
| `assessments` | `AssessmentService` | `AssessmentService`, `DashboardService`, History endpoints |
| `assessment_features` | `AssessmentService` | Assessment result screen, SHAP display, global-analysis notebooks |
| `daily_activities` | `ActivityService` | `ActivityService`, `DashboardService`, `RecommendationService`, Trends |
| `recommendations` | `RecommendationService` | `RecommendationController`, `DashboardService` |
| `research_responses` | `ResearchService` | Offline export only (research team, not the live app) |

Only one service ever writes a given table — no two modules should ever both hold a `@Repository` that writes the same entity. `DashboardService` appears only in the "read by" column everywhere, confirming it's a pure aggregator.

---

## 7. Cross-cutting communication concerns

### 7.1 Authentication propagation
Every protected React request carries `Authorization: Bearer <jwt>`. `JwtAuthenticationFilter` runs once per request ahead of any controller, validates the signature/expiry, and populates the Spring Security context so controllers can resolve "current user" without re-parsing the token themselves.

### 7.2 Validation
Bean Validation annotations on request DTOs (`@NotNull`, `@Min`, `@Max`, `@Email`, etc.) run at the Controller boundary before a Service method executes. Invalid input never reaches a Service, a repository, or the ML service.

### 7.3 Exception handling
A single `@ControllerAdvice` translates exceptions from any module (validation failures, "not found," ML-service-unreachable, DB constraint violations) into a consistent JSON error shape for React, instead of each controller inventing its own error format.

### 7.4 Correlation/tracing
Since a single user action (submitting an assessment) fans out across React → Spring Boot → Python and back, generating a correlation ID in `AssessmentController` and passing it as a header to the ML service (and including it in both sides' logs) makes debugging a slow or failed assessment far easier than grepping timestamps.

### 7.5 CORS
Only the deployed React origin is whitelisted in `SecurityConfig`; the public research route and the JWT-protected routes can share the same CORS policy since both are same-origin from the frontend's perspective.

---

## 8. Failure modes and degraded-mode behavior

| Failure | Detected by | Behavior |
|---|---|---|
| Python ML Service down/timeout | `MlService` HTTP call fails/times out | `AssessmentService` returns a clear "risk assessment temporarily unavailable" error to React; **no partial assessment row is written** |
| ML Service returns malformed response | `MlService` deserialization fails | Same as above — fail closed, never persist a half-formed result |
| PostgreSQL unavailable | JPA/Hibernate throws on any repository call | `@ControllerAdvice` returns a 503-style error; React shows a generic "try again" state |
| JWT expired/invalid | `JwtAuthenticationFilter` | 401 → React redirects to login |
| Recommendation engine throws mid-rule-evaluation | Caught inside `RecommendationService` | The assessment result (risk + SHAP) is still returned and persisted; recommendations degrade to an empty/partial list rather than failing the whole request — prediction and explanation should not be held hostage by the rules layer |
| Research submission fails validation | `ResearchController` `@Valid` | 400 with field-level errors; no partial row written |

The one deliberate asymmetry: an assessment's **prediction+explanation** succeeding is treated as more critical than its **recommendations** succeeding, so a recommendation-engine failure is isolated and doesn't roll back or block the assessment itself.

---

## 9. Deployment-time wiring (docker-compose level)

```text
docker-compose.yml
   │
   ├── frontend        (React, served via nginx or dev server)   → talks to backend via VITE/REACT env var API base URL
   ├── backend-springboot (Spring Boot)                          → talks to db via JDBC URL env var
   │                                                              → talks to ml-service via internal service name (e.g. http://ml-service:8000)
   ├── ml-service      (Python/FastAPI)                          → exposes /predict internally only
   └── db              (PostgreSQL, or external Supabase — in which case this container is omitted
                         and Spring Boot points at the Supabase connection string instead)
```

Secrets (`DB password`, `JWT secret`, `Supabase credentials`) are injected as environment variables at container runtime, never committed — consistent with §50 of the spec. This section only describes *how services find each other*, not the secret values themselves.

---

## 10. Two small structural additions (flagged, not silently assumed)

The spec's module list (§28) names `ProfileController` and `HealthProfileController` but the accompanying service list only names six services and doesn't explicitly list `ProfileService`/`HealthProfileService`, and no module is named for handling Dataset B intake. To keep the "everything goes through Spring Boot" rule intact end-to-end, this document adds:

1. **`ProfileService` / `HealthProfileService`** — the natural service-layer partners for the already-planned `ProfileController` / `HealthProfileController`, following the same Controller→Service→Repository pattern as every other module. No new tables required beyond what §29 already defines.
2. **`ResearchController` / `ResearchService` / `ResearchResponseRepository`** — needed to implement §6–§10 of the spec (Dataset B collection) without either (a) bolting anonymized survey data onto the authenticated `users` chain, or (b) reaching for an external tool that would sit outside this architecture. One new table, `research_responses`, not part of the original §29 list.

Both are minimal, in the same architectural style as the rest of the system — flagging them explicitly rather than having them appear unannounced inside a diagram.

---

## 11. Master diagram

```text
                                   REACT (single client)
        ┌──────────┬──────────┬───────────┬───────────┬───────────┬─────────────┐
        ▼          ▼          ▼           ▼           ▼           ▼             ▼
      Auth      Profile     Health     Assessment   Tracker   Dashboard   Research Intake
        │          │        Profile        │           │           │        (public)
        └──────────┴──────────┴───────────┴───────────┴───────────┴─────────────┘
                                        │  REST/JSON + JWT (except Research)
                                        ▼
                            ┌────────────────────────┐
                            │   SPRING BOOT (single   │
                            │   orchestrator process) │
                            └────────────┬────────────┘
                                         │
        ┌───────────┬───────────┬───────┼───────┬───────────┬────────────┐
        ▼           ▼           ▼       ▼       ▼           ▼            ▼
   AuthService ProfileSvc  HealthSvc AssessSvc ActivitySvc DashboardSvc ResearchSvc
        │           │           │       │  │      │            │            │
        │           │           │       │  │      │            │            │
        ▼           ▼           ▼       │  ▼      ▼            ▼            ▼
   ┌────────────────────────────────────┘  RecommendationSvc   (reads only)  │
   │                                              │                          │
   ▼                                              ▼                          ▼
PostgreSQL / Supabase  ◀──────────────────────────┴──────────────────────────┘
   ▲
   │ (write path shown above; DashboardSvc only ever reads)
   │
   │                    AssessSvc also calls, before writing:
   │                    ┌─────────────────────────────────┐
   └────────────────────┤        MlService (HTTP client)  │
                         └────────────────┬────────────────┘
                                          │ POST /predict
                                          ▼
                              PYTHON ML SERVICE (FastAPI/Flask)
                              Model (LogReg/RF/XGBoost, versioned)
                                          +
                                    SHAP Explainer
                                          │
                                          ▼
                          { riskScore, explanations[], modelVersion }
```

**One-line rule per module**, for quick reference during code review:

- **AuthController/Service** — the only module allowed to issue JWTs.
- **ProfileService / HealthProfileService** — own their tables, no cross-calls to other services.
- **AssessmentService** — the only module allowed to call `MlService`; always writes assessment+features before invoking `RecommendationService`.
- **MlService** — the only class in the whole backend that speaks to Python. Nothing else calls the ML service directly.
- **RecommendationService** — never calls the ML service itself; only ever reasons over data handed to it by `AssessmentService`.
- **ActivityService** — owns `daily_activities`; no knowledge of ML or recommendations.
- **DashboardService** — read-only aggregator across three repositories; never writes.
- **ResearchService** — fully decoupled from the authenticated user chain; write-only from the app's perspective, read only by offline analysis.
