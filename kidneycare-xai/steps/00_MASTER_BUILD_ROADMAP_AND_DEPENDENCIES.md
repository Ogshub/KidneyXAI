# KidneyCare-XAI — Master Step-by-Step Build Roadmap & Dependency Graph

Welcome to the complete, step-by-step engineering curriculum for building **KidneyCare-XAI** from scratch.

This guide answers the core questions for any software engineer or researcher building an enterprise-grade AI health platform:
1. **Which file is built first, and why?**
2. **What previous files does the current file depend on?**
3. **What is the exact code, structure, and internal logic of each file?**
4. **How do you test and verify the current stage before writing the next file?**
5. **Which future files depend on the current file?**

---

## 1. The 5-Phase Chronological Build Philosophy

When building a full-stack, AI-assisted clinical system, naive developers often jump straight into building UI screens or training models without contracts. In production engineering, we follow a **strict contract-driven, bottom-up architectural order**:

```
[Phase 1: Relational Data Model (PostgreSQL DDL)]
       │ (Defines exact schema, columns, primary & foreign keys, constraints)
       ▼
[Phase 2: Machine Learning Microservice (Python FastAPI)]
       │ (Defines input feature contract, model artifact cache, TreeSHAP explainability)
       ▼
[Phase 3: Enterprise Backend Orchestrator (Spring Boot 3 + JPA)]
       │ (Implements entities, security, repositories, ML client, clinical rules, REST APIs)
       ▼
[Phase 4: Responsive Web Client (React 19 + Tailwind CSS + Chart.js)]
       │ (Implements design system, JWT auth context, API client, charts, interactive pages)
       ▼
[Phase 5: Multi-Container Orchestration & Verification (Docker Compose + Nginx)]
       │ (Coordinates all services, health checks, networking, and end-to-end verification)
```

---

## 2. Master Table of Steps

| Step # | Step Filename | Scope & Primary Files Created | Key Dependencies |
|---|---|---|---|
| **00** | `00_MASTER_BUILD_ROADMAP_AND_DEPENDENCIES.md` | Architecture roadmap, phase order, dependency matrix | None |
| **01** | `01_PROJECT_SCAFFOLDING_AND_ROOT_CONFIG.md` | Root directory layout, `.gitignore`, root `README.md` | None |
| **02** | `02_DATABASE_SCHEMA_AND_RELATIONAL_DESIGN.md` | `docs/database/schema.sql` (7 normalized PostgreSQL tables) | Step 01 |
| **03** | `03_ML_SERVICE_ENVIRONMENT_AND_CONFIG.md` | `ml-service/requirements.txt`, `Dockerfile`, `app/config.py` | Step 01 |
| **04** | `04_ML_SERVICE_PYDANTIC_SCHEMAS.md` | `ml-service/app/schemas.py` (Request & response contracts) | Step 02, 03 |
| **05** | `05_ML_SERVICE_MODEL_LOADER_AND_TREE_SHAP.md` | `ml-service/app/model_loader.py` (Singleton artifact cache & fallback) | Step 03, 04 |
| **06** | `06_ML_SERVICE_PREDICTOR_AND_INFERENCE_ENGINE.md` | `ml-service/app/predictor.py` (Inference & local SHAP attributions) | Step 04, 05 |
| **07** | `07_ML_SERVICE_FASTAPI_APP_AND_ENDPOINTS.md` | `ml-service/app/main.py` (FastAPI lifespans, `/predict`, `/health`) | Step 03, 04, 05, 06 |
| **08** | `08_BACKEND_MAVEN_BUILD_AND_DEPENDENCIES.md` | `backend-springboot/pom.xml` (Spring Boot 3.2.1, JJWT, JPA, etc.) | Step 01 |
| **09** | `09_BACKEND_APPLICATION_PROPERTIES_CONFIG.md` | `backend-springboot/src/main/resources/application.properties` | Step 02, 07, 08 |
| **10** | `10_BACKEND_JPA_ENTITIES_DATA_MODEL.md` | `entity/User.java`, `HealthProfile.java`, `Assessment.java`, etc. (7 entities) | Step 02, 08 |
| **11** | `11_BACKEND_SPRING_DATA_JPA_REPOSITORIES.md` | `repository/UserRepository.java`, `AssessmentRepository.java`, etc. (7 repos) | Step 10 |
| **12** | `12_BACKEND_EXCEPTIONS_AND_GLOBAL_HANDLER.md` | `ResourceNotFoundException.java`, `GlobalExceptionHandler.java`, etc. | Step 08 |
| **13** | `13_BACKEND_JWT_SECURITY_AND_FILTERS.md` | `JwtService.java`, `JwtAuthenticationFilter.java`, `SecurityConfig.java` | Step 10, 11 |
| **14** | `14_BACKEND_REQUEST_DATA_TRANSFER_OBJECTS.md` | `dto/request/` (Register, Login, Assessment, Activity, Profile DTOs) | Step 08, 10 |
| **15** | `15_BACKEND_RESPONSE_DTOS_AND_SCORE_CALCULATOR.md` | `dto/response/` + `util/LifestyleScoreCalculator.java` | Step 04, 10, 14 |
| **16** | `16_BACKEND_AUTH_AND_PROFILE_SERVICES.md` | `AuthService.java`, `HealthProfileService.java`, `ProfileService.java` | Step 10, 11, 13, 14, 15 |
| **17** | `17_BACKEND_ML_CLIENT_AND_CLINICAL_RECOMMENDATION_ENGINE.md` | `MlService.java` (HTTP client), `RecommendationService.java` (Rule engine) | Step 07, 10, 11, 14, 15 |
| **18** | `18_BACKEND_ASSESSMENT_ACTIVITY_DASHBOARD_RESEARCH_SERVICES.md` | `AssessmentService.java`, `ActivityService.java`, `DashboardService.java` | Step 11, 15, 16, 17 |
| **19** | `19_BACKEND_REST_CONTROLLERS_API_LAYER.md` | `controller/` (8 REST controllers: Auth, Assessment, Activity, etc.) | Step 13, 14, 15, 16, 17, 18 |
| **20** | `20_BACKEND_MAIN_APPLICATION_AND_DOCKERFILE.md` | `KidneyCareApplication.java`, `backend-springboot/Dockerfile` | Step 08, 09, 19 |
| **21** | `21_FRONTEND_VITE_SETUP_AND_TAILWIND_DESIGN_SYSTEM.md` | `package.json`, `vite.config.js`, `index.html`, `src/index.css` | Step 01 |
| **22** | `22_FRONTEND_API_CLIENT_AND_AUTH_CONTEXT.md` | `src/api/client.js`, `src/api/index.js`, `src/context/AuthContext.jsx` | Step 19, 21 |
| **23** | `23_FRONTEND_REUSABLE_UI_COMPONENTS.md` | `Button.jsx`, `Input.jsx`, `Card.jsx`, `Feedback.jsx`, `index.js` | Step 21 |
| **24** | `24_FRONTEND_LAYOUT_AND_ROUTE_GUARDS.md` | `Navbar.jsx`, `Footer.jsx`, `ProtectedRoute.jsx`, `Layout.jsx` | Step 22, 23 |
| **25** | `25_FRONTEND_CHART_VISUALIZATION_SUITE.md` | `ShapBarChart.jsx`, `RiskTrendChart.jsx`, `LifestyleTrendChart.jsx` | Step 21, 23 |
| **26** | `26_FRONTEND_AUTH_PAGES_LANDING_LOGIN_REGISTER.md` | `Landing.jsx`, `Login.jsx`, `Register.jsx` | Step 22, 23, 24 |
| **27** | `27_FRONTEND_DASHBOARD_AND_ASSESSMENT_WORKFLOW.md` | `Dashboard.jsx`, `Assessment.jsx`, `AssessmentResult.jsx` | Step 22, 23, 24, 25 |
| **28** | `28_FRONTEND_RECOMMENDATIONS_DAILY_TRACKER_HISTORY_PROFILE.md` | `Recommendations.jsx`, `DailyTracker.jsx`, `History.jsx`, `Profile.jsx` | Step 22, 23, 24, 25 |
| **29** | `29_FRONTEND_RESEARCH_SURVEY_AND_ROUTER_INTEGRATION.md` | `ResearchSurvey.jsx`, `App.jsx`, `main.jsx`, pages index | Step 26, 27, 28 |
| **30** | `30_CONTAINERIZATION_END_TO_END_PIPELINE_AND_DEPLOYMENT.md` | `frontend/Dockerfile`, `nginx.conf`, `docker-compose.yml`, E2E test suite | Step 02, 07, 20, 29 |
| **31** | `31_PART_BY_PART_EXECUTION_AND_VERIFICATION_LOG.md` | Live execution log, running ports, verified credentials, and end-to-end tests | Step 00 - 30 |
| **32** | `32_CONFIGURATION_SECRETS_AND_DYNAMIC_EVALUATION.md` | Secrets manifest, environment variables, relational persistence pipeline, and dynamic evaluation engine | Step 02, 07, 09, 13, 17, 31 |
| **33** | `33_BRUTALIST_THEME_SYSTEM_AND_SETTINGS.md` | Neo-brutalist theme tokens, theme toggle, and settings panel | Step 21, 23 |
| **34** | `34_USER_PROFILE_PICTURE_AND_SUPABASE_SCHEMA_UPDATE.md` | Profile avatar upload, Cloudinary CDN, and Supabase SQL schema update | Step 02, 10, 28 |
| **35** | `35_BRUTALIST_THEME_FULL_APPLICATION_INTEGRATION.md` | Universal styling integration across dashboard, assessments, and analytics | Step 33 |
| **36** | `36_SETTINGS_AUTHENTICATION_SUPABASE_PERSISTENCE_CLOUDINARY_AND_NAVBAR_CONSISTENCY.md` | Settings persistence, profile picture upload integration, and navbar alignment | Step 34, 35 |
| **37** | `37_SETTINGS_PUBLIC_CUSTOMIZATION_PROFILE_STUDIO_MIGRATION_AND_CLEAN_UI.md` | Profile studio migration, public customization controls, and clean UI polish | Step 36 |
| **38** | `38_DARK_MODE_FONT_CONTRAST_AND_LEGIBILITY_FIXES.md` | Universal dark mode contrast elevation for text, headings, and metrics | Step 35, 37 |
| **39** | `39_UCI_CKD_DATASET_INGESTION_XGBOOST_TRAINING_AND_SHAP_GENERATION.md` | UCI dataset ingestion, 10-fold CV training (98.5% acc, 99.81% AUROC), TreeSHAP artifacts | Step 03, 05, 06, 07 |
| **40** | `40_PYTHON_ENVIRONMENT_INTERPRETER_ALIGNMENT_AND_LINTER_FIX.md` | Python interpreter configuration, Pyrefly `missing-import` resolution, workspace settings | Step 03, 39 |
| **41** | `41_PRODUCTION_DEPLOYMENT_RENDER_PIPELINE_AND_VERIFICATION.md` | Cloud deployment pipeline, Render blueprint configuration, dataset & model git sync | Step 30, 39, 40 |
| **42** | `42_AT_HOME_SCREENING_MODE_RESILIENT_FALLBACK_AND_BASELINE_RECOMMENDATIONS.md` | Dual-mode screener UI, ML service URI normalization & fallback, baseline recommendations | Step 17, 18, 27, 28, 41 |
| **43** | `43_MULTI_COHORT_DATASET_STANDARDIZATION_BENCHMARKING_AND_MODEL_TRAINING.md` | Multi-cohort datasets (PMC13092092, Kaggle, UCI), data catalog standardization, cross-cohort training | Step 39, 41, 42 |
| **44** | `44_POSTGRES_VARCHAR_COLUMN_OVERFLOW_FIX_AND_DEFENSIVE_SANITIZATION.md` | PostgreSQL VARCHAR(20) overflow fix, defensive string clamping, and transaction safety | Step 02, 10, 18, 42 |
| **45** | `45_COMPLETE_END_TO_END_USER_MANUAL_AND_FEATURE_GUIDE.md` | Complete feature walkthrough manual, Dual-Mode assessment guide, and screenshot checklist | Step 01-44 |
| **46** | `46_PYREFLY_IMPORT_ALIGNMENT_AND_MULTI_THEME_AUTH_REDESIGN.md` | Pyrefly linter import alignment, Windows multiprocessing stability, and multi-theme authentication redesign | Step 39, 40, 45 |
| **47** | `47_SPLIT_SCREEN_AUTH_UX_REDESIGN_AND_VISUAL_DENSITY.md` | Full-bleed split-screen authentication UX redesign, live SHAP telemetry visualizer, and dual demo quick-switches | Step 45, 46 |
| **48** | `48_MULTI_DATASET_EVALUATION_METRICS_AND_DEMO_LOGIN_REMOVAL.md` | Multi-dataset evaluation metrics synthesis across 3,047 records (UCI, PMC, Kaggle) and demo login removal | Step 43, 46, 47 |
| **49** | `49_RENDER_CLOUD_COLD_START_RESILIENCE_AND_TIMEOUT_OPTIMIZATION.md` | Cloud cold-start resilience, 60s timeout extension, and authentication telemetry notices | Step 47, 48 |
| **50** | `50_ACADEMIC_RESEARCH_REPORT_AND_DISSERTATION_SYNOPSIS.md` | Human-centered academic research dissertation synopsis, traceable recommendation engine, trust calibration, and audited references | Step 17, 18, 28, 43, 48, 49 |
| **51** | `51_INTERMEDIATE_FINALE_REPORT_AND_MENTOR_PRESENTATION_SCRIPT.md` | In-depth Intermediate Finale Report, first-principles medical grounding, literature gap analysis, and mentor defense script | Step 50 |

---

## 3. How to Use These Step Files

Open each step file sequentially from `01_...` to `30_...`. In each file, you will find:
- **Prerequisites**: What you must have completed before this step.
- **Why this file is created now**: The architectural reason why this file cannot wait and cannot be built earlier.
- **Exact File Content**: Complete, copy-pasteable or viewable production code.
- **Step-by-Step Explanation**: Deep breakdown of every class, function, parameter, and algorithm.
- **Verification Commands**: Concrete commands (e.g. `mvn clean compile`, `pytest`, `npm test`, `curl`) to verify that the file compiles and functions correctly before you touch the next file.
- **Next Dependency**: Exactly which subsequent file consumes this component.
