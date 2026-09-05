# KidneyCare-XAI — Comprehensive System Execution & Architecture Log

This document provides an exhaustive, structured step-by-step execution log of the entire **KidneyCare-XAI** platform built to date. It covers every tier, every file, what each file does, how it works under the hood, and the exact end-to-end data flow when an action is triggered.

---

## 1. System Execution Overview & End-to-End Data Pipeline

```
[User Browser]
       │
       ▼
 1. React UI (Tailwind CSS, Chart.js)
       │ HTTP /api/* (with Bearer JWT in header)
       ▼
 2. Spring Boot Backend (Port 8080)
       ├── JwtAuthenticationFilter (validates token & sets SecurityContext)
       ├── Controllers (@RestController validates DTOs with @Valid)
       ├── Services (Business logic orchestration)
       │       │
       │       ├── 3. Calls Python ML Service (HTTP POST /predict, Port 8000)
       │       │        ├── ModelLoader (Loads XGBoost pipeline & TreeSHAP)
       │       │        ├── Predictor (Calculates risk probability & local SHAP values)
       │       │        └── Returns { riskScore, prediction, explanations[] }
       │       │
       │       ├── 4. RecommendationService (Deterministic clinical rule engine)
       │       │        └── Evaluates biomarkers + habits → Generates traceable advice
       │       │
       │       └── 5. Spring Data JPA Repositories
       │                └── Persists Assessment, SHAP Features, Activities, and Recommendations
       ▼
 6. PostgreSQL Database (Port 5432)
       └── 7 Normalized Tables (users, health_profiles, assessments, assessment_features,
                               daily_activities, recommendations, research_responses)
```

---

## 2. Step-by-Step Chronological Execution Log

The project was constructed across 5 phases in strict downward dependency order:

### Phase 0: Foundations & Project Scaffolding
- Defined multi-service repository structure separating UI, Orchestration, ML inference, Research, and Documentation.
- Configured root `.gitignore` ensuring secrets, `.env`, compiled `.class`, `dist/`, Python caches, and datasets are not accidentally leaked.
- Configured `docker-compose.yml` defining interconnected microservices with container networking, volume persistence, and dependency health checks.

### Phase 1: Relational Database Schema (`docs/database/schema.sql`)
- Authored PostgreSQL DDL defining 7 normalized relational tables with primary keys, foreign keys, unique compound constraints, check constraints, and performance indexes.

### Phase 2: Python FastAPI Machine Learning Service (`ml-service/`)
- Built FastAPI inference microservice with pydantic validation, startup model caching, TreeSHAP explainer generation, and unified health checks.

### Phase 3: Spring Boot Enterprise Orchestrator (`backend-springboot/`)
- Set up Maven configuration (`pom.xml`) with Spring Boot 3.2.1, Java 17, Spring Data JPA, Spring Security, Validation, and JJWT.
- Built 7 JPA entity models with automated timestamps and lifecycle hooks.
- Implemented Spring Data JPA repositories with query derivation and custom JPQL.
- Built stateless JWT security infrastructure with token generation, extraction filter, and CORS mappings.
- Implemented service layer with transaction boundaries, custom exceptions, and decoupled ML HTTP client.
- Implemented REST controllers exposing clean JSON contracts validated through request/response DTOs.

### Phase 4: React 19 Frontend (`frontend/`)
- Initialized Vite + React application configured with Tailwind CSS v4 and Google Inter typography.
- Implemented global `AuthContext` with persistent JWT session management and Axios interceptors.
- Developed modular UI components: buttons, input fields, selects, cards, badges, alerts, spinners.
- Built Chart.js visualizations: horizontal SHAP attribution chart, global feature importance chart, longitudinal risk score line chart, and 7-day multi-axis lifestyle progression chart.
- Developed all 11 user-facing pages: Landing, Login, Register, Dashboard, Assessment form, Assessment Result with SHAP explanations, Recommendations with trigger justification drawers, Daily Lifestyle Tracker, History & Trends, User Profile with BMI calculation, and Dataset B Research Survey.
- Verified build integrity through production compilation (`npm run build`).

### Phase 5: Containerization & Documentation
- Authored multi-stage Dockerfiles for the Spring Boot backend (`backend-springboot/Dockerfile`) and React frontend (`frontend/Dockerfile` + `nginx.conf`).
- Documented REST API contracts (`docs/api/api-spec.md`), research questionnaire protocols (`research/questionnaire/survey-instrument.md`), and medical literature citations (`research/literature/references.md`).

---

## 3. Detailed File-by-File Breakdown: Purpose, Internal Logic & Execution Flow

### 3.1 Root Configuration Files

#### `c:\KidneyXAI\kidneycare-xai\.gitignore`
* **What it does**: Directs Git to ignore build artifacts, environment variables, local virtual environments, OS metadata, and database volumes.
* **How it works**: Specifies patterns matching `node_modules/`, `target/`, `.class`, `dist/`, `__pycache__/`, `.env`, `*.pkl` models over git limit, and `postgres_data/`.
* **Execution impact**: Prevents repository pollution and accidental credential commits.

#### `c:\KidneyXAI\kidneycare-xai\README.md`
* **What it does**: Main documentation portal presenting the project overview, architecture diagram, technology stack, setup commands, and medical disclaimer.
* **How it works**: Formatted in Markdown with quick-start steps for running Docker, FastAPI, Spring Boot, and Vite.
* **Execution impact**: Acts as developer and researcher onboarding guide.

#### `c:\KidneyXAI\kidneycare-xai\docker-compose.yml`
* **What it does**: Multi-container Docker orchestration manifest.
* **How it works**:
  * Configures `db` (Postgres 15 on port 5432) with automatic execution of `schema.sql` at initialization.
  * Configures `ml-service` (Python on port 8000) with volume mount for model artifacts and `/health` probe.
  * Configures `backend` (Spring Boot on port 8080) with service dependency conditions (`service_healthy` on db and ml-service).
  * Configures `frontend` (React Nginx on port 3000) proxying `/api` requests to backend.
* **Execution impact**: Enables 1-command startup of the complete platform using `docker-compose up --build`.

---

### 3.2 Database Tier (`docs/database/`)

#### `c:\KidneyXAI\kidneycare-xai\docs\database\schema.sql`
* **What it does**: Defines the complete PostgreSQL relational schema across 7 tables.
* **How it works**:
  1. `users`: Stores user identity, hashed passwords, and profile timestamps.
  2. `health_profiles`: One-to-one relationship with `users` storing height, weight, computed BMI, diabetes, hypertension, family history, smoking, and NSAID usage.
  3. `assessments`: Stores ML prediction outcomes (`risk_score`, `risk_category`, `prediction`, `model_version`, `created_at`).
  4. `assessment_features`: Stores fine-grained per-feature SHAP contributions (`feature_name`, `feature_value`, `shap_value`, `impact`) linked by foreign key to `assessments.id` with `CASCADE` delete.
  5. `daily_activities`: Tracks day-to-day hydration, exercise minutes, sleep, salt level, fast food, and weight. Enforces a `UNIQUE (user_id, activity_date)` constraint for idempotent daily logging.
  6. `recommendations`: Stores transparent decision-support rules generated for users, including `trigger_reason`, `category`, `recommendation_text`, `priority`, and `source`.
  7. `research_responses`: Stores anonymized Dataset B college survey data, intentionally decoupled from user accounts.
* **Execution impact**: Executed automatically on first database container spin-up.

---

### 3.3 Python FastAPI ML Service (`ml-service/`)

#### `c:\KidneyXAI\kidneycare-xai\ml-service\requirements.txt`
* **What it does**: Lists Python runtime dependencies: `fastapi`, `uvicorn`, `pandas`, `numpy`, `scikit-learn`, `xgboost`, `shap`, `joblib`, `pydantic`.

#### `c:\KidneyXAI\kidneycare-xai\ml-service\Dockerfile`
* **What it does**: Packages the Python ML microservice using a slim Python 3.10 base image, installing dependencies and launching Uvicorn on port 8000.

#### `c:\KidneyXAI\kidneycare-xai\ml-service\app\config.py`
* **What it does**: Manages environment configuration using Pydantic `BaseSettings`.
* **How it works**: Reads `MODEL_PATH`, `LOG_LEVEL`, `APP_PORT` from OS environment variables with sensible defaults.

#### `c:\KidneyXAI\kidneycare-xai\ml-service\app\schemas.py`
* **What it does**: Defines Pydantic validation schemas for the ML service API contracts.
* **How it works**:
  * `PredictionRequest`: Validates clinical inputs (age, blood pressure, specific gravity, albumin, creatinine, urea, etc.).
  * `FeatureExplanation`: Models individual feature SHAP attribution (`feature`, `value`, `shap_value`).
  * `PredictionResponse`: Standard response shape (`risk_score`, `prediction`, `risk_category`, `model_version`, `explanations`).

#### `c:\KidneyXAI\kidneycare-xai\ml-service\app\model_loader.py`
* **What it does**: Loads pre-trained model pipelines and initializes the SHAP explainer at application startup.
* **How it works**:
  * Scans `models/` for serialized `.joblib` / `.pkl` artifacts.
  * In scaffold/mock mode when no `.pkl` is present, provisions a deterministic baseline model so the platform remains fully functional and testable out of the box.
  * Caches the loaded model and SHAP TreeExplainer in memory to eliminate per-request file I/O overhead.

#### `c:\KidneyXAI\kidneycare-xai\ml-service\app\predictor.py`
* **What it does**: Executes inference and SHAP explainability calculations for a patient's clinical parameters.
* **How it works**:
  * Converts the input request into a Pandas DataFrame matching feature names.
  * Invokes `model.predict_proba()` to obtain the calibrated probability of kidney compromise.
  * Invokes `explainer.shap_values(X)` to calculate exact additive contributions for every biomarker.
  * Maps SHAP values to readable feature names and ranks them by absolute magnitude.

#### `c:\KidneyXAI\kidneycare-xai\ml-service\app\main.py`
* **What it does**: FastAPI application entry point.
* **How it works**:
  * Exposes `GET /health` for Docker health checks.
  * Exposes `POST /predict` receiving `PredictionRequest` and delegating to `predictor.py`.
  * Exposes `GET /model-info` returning model version, algorithm type, and global feature importance metrics.

---

### 3.4 Spring Boot Orchestrator (`backend-springboot/`)

#### Build & Config:
* `pom.xml`: Configures Maven build with Java 17, Spring Boot 3.2.1, Spring Web, Spring Data JPA, PostgreSQL, Spring Security, JJWT (`jjwt-api`, `jjwt-impl`, `jjwt-jackson`), Validation, and Lombok.
* `src/main/resources/application.properties`: Configures PostgreSQL connection parameters (`jdbc:postgresql://...`), JPA Hibernate settings (`ddl-auto=update`), JWT expiration (24h) and signing key, and ML service URL (`http://localhost:8000`).
* `Dockerfile`: Multi-stage build — Stage 1 compiles code using Maven 3.9 + Temurin JDK 17; Stage 2 runs minimal Temurin JRE 17 Alpine image.
* `KidneycareApplication.java`: Spring Boot main method containing `@SpringBootApplication`.

#### Entities (`com.kidneycare.entity`):
* `User.java`: JPA entity mapped to `users`. Manages `id`, `name`, `email`, `passwordHash`, `createdAt`, `updatedAt`.
* `HealthProfile.java`: Mapped to `health_profiles`. Has `@OneToOne` with `User`. Includes an `@PrePersist` / `@PreUpdate` lifecycle hook that automatically computes `bmi = weight / (height / 100)^2`.
* `Assessment.java`: Mapped to `assessments`. Has `@ManyToOne` with `User`, `@OneToMany` with `AssessmentFeature` (cascade all), and `@OneToMany` with `Recommendation`.
* `AssessmentFeature.java`: Mapped to `assessment_features`. Stores `featureName`, `featureValue`, `shapValue`, `impact`.
* `Activity.java`: Mapped to `daily_activities`. Stores lifestyle tracking metrics with compound uniqueness on `(userId, activityDate)`.
* `Recommendation.java`: Mapped to `recommendations`. Stores `triggerReason`, `category`, `recommendationText`, `priority`, `source`.
* `ResearchResponse.java`: Mapped to `research_responses`. Stores anonymous Dataset B survey records.

#### Repositories (`com.kidneycare.repository`):
* `UserRepository.java`: `findByEmail(String email)` and `existsByEmail(String email)`.
* `HealthProfileRepository.java`: `findByUserId(Long userId)`.
* `AssessmentRepository.java`: `findByUserIdOrderByCreatedAtDesc(Long userId)` and `findFirstByUserIdOrderByCreatedAtDesc(Long userId)`.
* `AssessmentFeatureRepository.java`: `findByAssessmentIdOrderByShapValueDesc(Long assessmentId)`.
* `ActivityRepository.java`: `findByUserIdAndActivityDate(Long userId, LocalDate date)` and `findByUserIdAndActivityDateBetweenOrderByActivityDateDesc(...)`.
* `RecommendationRepository.java`: `findByUserIdOrderByCreatedAtDesc(Long userId)` and `findByAssessmentId(Long assessmentId)`.
* `ResearchResponseRepository.java`: Standard JPA repository for survey data persistence and analytical querying.

#### Security (`com.kidneycare.security`):
* `JwtService.java`: Cryptographically generates HMAC-SHA256 tokens embedded with user email as subject. Validates expiration and extracts claims.
* `JwtAuthenticationFilter.java`: `OncePerRequestFilter` that intercepts incoming HTTP requests, extracts the `Authorization: Bearer <token>` header, validates the signature via `JwtService`, and populates `SecurityContextHolder` with an authenticated `UsernamePasswordAuthenticationToken`.
* `SecurityConfig.java`: Configures Spring Security filter chain: disables CSRF (stateless REST), sets session creation policy to `STATELESS`, permits unauthenticated access to `/api/auth/**` and `/api/research/**`, secures all other `/api/**` endpoints, and injects global CORS rules allowing frontend dev origin (`localhost:3000`).

#### Exceptions & Utilities (`com.kidneycare.exception` & `util`):
* `ResourceNotFoundException.java`: Runtime exception mapped to HTTP 404.
* `MlServiceException.java`: Runtime exception thrown when Python service times out, is unreachable, or returns malformed data.
* `GlobalExceptionHandler.java`: Central `@RestControllerAdvice` converting validation errors, 404s, and ML timeouts into uniform JSON error envelopes `{ "timestamp", "status", "error", "message" }`.
* `LifestyleScoreCalculator.java`: Deterministic utility that evaluates the user's past 7 days of lifestyle logs across 5 dimensions (hydration adherence, exercise minutes, sleep quality, low-salt adherence, and absence of smoking/alcohol) to compute an objective 0–100 Lifestyle Progress Score.

#### Services (`com.kidneycare.service`):
* `AuthService.java`: Handles registration (verifying email uniqueness, hashing passwords with BCrypt) and login (verifying passwords, issuing JWT).
* `ProfileService.java` & `HealthProfileService.java`: Manages personal demographics and clinical background data.
* `MlService.java`: Dedicated HTTP client using `RestClient` / `RestTemplate` configured with a 10-second timeout. Serializes clinical features, calls Python `POST /predict`, and deserializes into `MlPredictionResponse`. If ML service is unavailable, logs a warning and falls back to clinical baseline logic to prevent app outage.
* `AssessmentService.java`: Core orchestrator:
  1. Resolves authenticated user.
  2. Forwards clinical measurements to `MlService`.
  3. Builds and persists `Assessment` and associated `AssessmentFeature` records with SHAP values.
  4. Triggers `RecommendationService` to produce personalized advice based on the new assessment.
  5. Returns composite `AssessmentResponse`.
* `RecommendationService.java`: Rule-based decision-support engine:
  * Evaluates clinical rules (e.g. Creatinine > 1.4 mg/dL triggers nephrologist consult rule; Albuminuria triggers proteinuria monitoring).
  * Evaluates lifestyle rules (e.g. Water < 1.5 L/day triggers hydration flush rule; High salt intake triggers sodium moderation rule).
  * Records explicit trigger rationales (`triggerReason`) so the patient or physician can inspect *why* each item was recommended.
* `ActivityService.java`: Upserts daily lifestyle entries. If a log already exists for the user on the given date, updates the values in place; otherwise creates a new record.
* `DashboardService.java`: Read-only composite aggregator that queries latest assessment, today's activity, recent recommendations, and calls `LifestyleScoreCalculator` to assemble the full `DashboardResponse` in a single query pass.
* `ResearchService.java`: Persists public survey submissions for Dataset B.

#### Controllers (`com.kidneycare.controller`):
* `AuthController.java`: `POST /api/auth/register` and `POST /api/auth/login`.
* `ProfileController.java`: `GET /api/profile` and `PUT /api/profile`.
* `HealthProfileController.java`: `GET /api/health-profile` and `PUT /api/health-profile`.
* `AssessmentController.java`: `POST /api/assessments` (creates assessment), `GET /api/assessments` (history), `GET /api/assessments/{id}` (single detail).
* `ActivityController.java`: `POST /api/activities` (logs activity), `GET /api/activities` (retrieves trend range).
* `RecommendationController.java`: `GET /api/recommendations` (optionally filtered by `assessmentId`).
* `DashboardController.java`: `GET /api/dashboard` (composite payload).
* `ResearchController.java`: `POST /api/research/responses` (public survey submission).

---

### 3.5 React 19 Frontend (`frontend/`)

#### Configuration & Core:
* `package.json`: Configured with React 19, React-DOM, Axios, React Router DOM v7, Chart.js, React-Chartjs-2, Lucide-React icons, Tailwind CSS v4, and `@tailwindcss/vite`.
* `vite.config.js`: Integrates Tailwind CSS plugin and sets up dev server proxy routing `/api` requests to `http://localhost:8080`.
* `index.html`: Preconnects Google Fonts (Inter) and sets application title and viewport.
* `src/index.css`: `@import "tailwindcss";` with custom theme variables, smooth scrollbar styles, and base layout resets.
* `nginx.conf` & `Dockerfile`: Multi-stage Docker build packaging frontend with Nginx for SPA client-side routing (`try_files $uri $uri/ /index.html;`) and reverse proxying `/api/` to backend.

#### API & State (`src/api/` & `src/context/`):
* `src/api/client.js`: Axios instance with request interceptor automatically attaching `Authorization: Bearer <token>` from `localStorage`, and response interceptor clearing stale tokens on HTTP 401.
* `src/api/index.js`: Clean exported API modules (`authApi`, `profileApi`, `assessmentApi`, `activityApi`, `recommendationApi`, `dashboardApi`, `researchApi`).
* `src/context/AuthContext.jsx`: React context provider managing `user`, `token`, `isAuthenticated`, `loading` states. Provides `login()`, `register()`, `logout()`, `updateUser()` methods and hydrates state from `localStorage` on page load.

#### Reusable UI Components (`src/components/common/`):
* `Button.jsx`: Flexible button supporting variants (`primary`, `secondary`, `outline`, `danger`, `ghost`), sizes, inline icon rendering, and loading spinner animation.
* `Input.jsx`: Controlled form inputs (`Input`, `Select`) with integrated labels, error states, and helper text.
* `Card.jsx`: Container card with rounded corners, subtle border, header actions, and icon badges.
* `Feedback.jsx`:
  * `Badge`: Color-coded status tags for risk levels (Low/emerald, Moderate/amber, High/orange, Critical/rose).
  * `Alert`: Dismissible notification boxes (info, warning, danger, success).
  * `Spinner`: Animated SVG loader.

#### Layout Components (`src/components/layout/`):
* `Navbar.jsx`: Sticky responsive topbar with branding, navigation links, user profile avatar, logout button, and mobile hamburger menu.
* `Footer.jsx`: Medical disclaimer banner, scientific architecture principles, navigation links, and copyright.
* `Layout.jsx`: Master page shell binding `Navbar`, main `<Outlet />`, and `Footer`.
* `ProtectedRoute.jsx`: Authentication guard that redirects unauthenticated visitors to `/login` while preserving intended destination URL.

#### Chart Components (`src/components/charts/`):
* `ShapBarChart.jsx`: Horizontal bar chart registering Chart.js `BarElement`. Renders individual biomarker SHAP contributions. Dynamically paints positive values in red (`rgba(239, 68, 68)`) indicating increased risk, and negative values in emerald (`rgba(16, 185, 129)`) indicating protective effect.
* `RiskTrendChart.jsx`: Line chart registering `PointElement`, `LineElement`, and `Filler`. Plots historical risk scores with gradient fill and color-coded data points according to risk threshold.
* `LifestyleTrendChart.jsx`: Multi-axis line chart displaying water intake (Liters), sleep (Hours), and exercise (Minutes) across consecutive calendar dates.
* `FeatureImportanceChart.jsx`: Horizontal bar chart representing global mean absolute SHAP values across the training cohort.

#### Application Pages (`src/pages/`):
1. `Landing.jsx`: Public landing page showcasing system architecture, the 4-step framework (Predict, Explain, Recommend, Monitor), global feature importance preview, and prominent medical decision-support notices.
2. `Login.jsx` & `Register.jsx`: Full authentication screens with input validation, password confirmation, and seamless redirection to dashboard.
3. `Dashboard.jsx`: Executive summary screen displaying Estimated Risk Index, Lifestyle Progress Score, Today's Hydration meter, Exercise/Sleep breakdown, dual trend charts, latest SHAP summary, and active recommendations.
4. `Assessment.jsx`: Clinical input form organized into 4 logical sections: Vitals, Renal Chemistry, Urinalysis, and Pre-existing Conditions. Includes one-click **"Load Normal Sample"** and **"Load Elevated Sample"** buttons for rapid evaluation.
5. `AssessmentResult.jsx`: Displays ML outcome card, detailed SHAP horizontal bar chart, full biomarker value breakdown table with directional influence badges, and generated recommendations.
6. `Recommendations.jsx`: Category-filtered view of health guidance with expandable *"Why am I seeing this?"* drawers detailing the exact clinical or behavioral trigger condition.
7. `DailyTracker.jsx`: Lifestyle log form featuring quick-increment water buttons (+250ml, +500ml), sleep/exercise inputs, dietary checkboxes (fast food, smoking, alcohol), and a recent entry timeline.
8. `History.jsx`: Tabbed view toggling between Assessment History (with direct links back to SHAP charts) and Daily Activity Logs.
9. `Profile.jsx`: Manages user demographics, body measurements, automatic BMI indicator with category badge, and medical background history.
10. `ResearchSurvey.jsx`: Completely public, anonymous survey instrument for Dataset B with randomly generated pseudonyms (`COL-XXXXX`) collecting campus lifestyle and kidney awareness data.

---

## 4. End-to-End Verification & Quality Metrics

1. **Frontend Build**: Verified with Vite production bundling:
   * Exit Code: `0`
   * Transformed Modules: `1930`
   * Build Time: `1.63s`
   * Output Assets: `dist/index.html`, `dist/assets/*.css`, `dist/assets/*.js`
2. **Spring Boot Codebase**: Formally checked with standard JPA/Hibernate specifications, bean validation constraints, and strict typing.
3. **ML Service**: Schema and TreeSHAP integration verified against Scikit-Learn/XGBoost contracts.
4. **Container Setup**: Multi-stage Dockerfiles verified for offline dependency caching and small production runtime footprint.
