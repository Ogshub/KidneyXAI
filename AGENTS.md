# KidneyCare-XAI repository instructions

## Scope and sources

KidneyCare-XAI is an MCA research prototype for CKD risk awareness, explainable predictions, guideline-traceable education, and longitudinal self-monitoring. Extend the existing system incrementally. Preserve public contracts and existing behavior unless the task explicitly changes them. Keep prediction, explanation, recommendations, tracking, and future assistant logic separate.

Read the root README, the application README, and the handover documents under `kidneycare-xai/docs/`: `FINAL_REPOSITORY_AUDIT.md`, `FINAL_IMPLEMENTATION_PLAN.md`, `RESEARCH_EVALUATION_PROTOCOL.md`, and `PHASE_2_COMPLETION_REPORT.md`. Use source and fresh tests to establish current behavior. Use the research protocol for experimental design when the implementation plan differs. Check `docs/api/api-spec.md` against controller mappings before relying on it.

## Architecture and conventions

- The Git root holds deployment descriptors and project documentation. The runnable application is in `kidneycare-xai/`. This directory contains the service modules, Docker Compose, database SQL, research materials and historical build notes.
- `frontend/` uses React 19, Vite 8, JavaScript/JSX, React Router, Tailwind 4, Axios, Lucide and Chart.js via react-chartjs-2. Reuse `src/api/client.js`, `src/api/index.js`, auth/theme contexts, protected routes and shared components. Follow existing loading, empty and error states. Use the installed chart stack for Phase 3 unless a dependency change is approved.
- `backend-springboot/` uses Java 17, Maven, Spring Boot 3.2.1, Spring Security/JWT, Bean Validation and Spring Data JPA over PostgreSQL. Keep the controller → service → repository flow. Validate request DTOs at the boundary, map response DTOs explicitly, scope queries to the authenticated principal and use transactions for related database changes. Preserve existing history and nullable fields.
- `ml-service/` uses Python 3.11, FastAPI, Pydantic 2, scikit-learn, XGBoost and TreeSHAP. Use typed schemas and trusted versioned artifacts. Spring calls FastAPI through `MlService` with `X-Internal-Secret`. React calls Spring, which owns user authentication and persistence. The FastAPI health endpoint is public. Internal authentication is conditional on configuration, so configure the shared secret on both services and restrict network exposure in shared environments.
- Existing flows include register/login, profile and health profile, assessment and history, SHAP explanation, guideline-linked recommendations, activity journal and summaries, dashboard, survey and research analytics. Retain existing routes, theme and deployment split (Vercel frontend, Render services, Supabase PostgreSQL).

## Database and migrations

- `docs/database/schema.sql` is the bootstrap for an empty database. Its tables are `users` (unique email), `health_profiles` (one per user), `assessments` and their `assessment_features`, `daily_activities` (unique user/date), `recommendations` linked to assessments, and `research_responses` for survey data. Review foreign keys and cascades in SQL with the matching JPA entities.
- Apply `docs/database/migration_v2.sql` to an existing pre-V2 development schema. It adds eight activity fields (blood pressure pair, medication status, sleep quality, exercise type, symptoms, notes and restrictions) and four recommendation provenance fields (rule ID, observation period, limitations and contraindications). Preserve the medication distinction between missed, not applicable and not recorded.
- Keep Hibernate DDL disabled by default. Author additive, reviewed SQL in `docs/database/` using the repository's version sequence. Update the fresh schema and API docs when changing contracts. Verify empty bootstrap, upgrade of representative synthetic legacy rows, replay where idempotency is promised, constraints, ownership and failure recovery. Use `psql -X -v ON_ERROR_STOP=1 --single-transaction -f <path>` against an explicitly selected disposable database, with credentials supplied externally. Capture schema and migration evidence before rollout. If Supabase CLI migration tracking is adopted, reconcile its history with checked-in SQL first.
- Inspect the confirmed development target via Supabase using schema/policy metadata only. Do not use an unidentified linked project as a development database. Production database or storage changes require explicit approval. Review grants and RLS on exposed schemas and any storage buckets. Spring application JWTs and application user IDs are distinct from Supabase Auth identities.

## Local build and verification

Run commands from the indicated module inside `kidneycare-xai/`. Use ignored local configuration based on the example files, explicit local DB and API endpoints, and synthetic credentials. Review resolved targets before starting processes. The Vite dev server defaults to port 3000 and proxies `/api` to Spring on 8080. FastAPI defaults to port 8000.

- Frontend: `npm ci`, `npm run lint`, `npm run build`, `npm run dev`. Use a Node version supported by the installed Vite package. On Windows, use `npm.cmd` if PowerShell resolves a different executable. Browser-test authenticated synthetic flows against the local stack after build passes.
- Spring: set `JAVA_HOME` to JDK 17, then run `mvn test`, `mvn package` and `mvn spring-boot:run` as appropriate. Check the test count. An empty suite or compilation alone does not cover endpoint behavior.
- ML: create a Python 3.11 virtualenv, install `python -m pip install -r requirements.txt`, then run `python -m pytest -q` and `python -m uvicorn app.main:app --host 127.0.0.1 --port 8000`. Use the matching artifact dependency versions. `python train_model.py` is a deliberate research run that can overwrite artifacts.
- Compose is available from the application directory. Review target bindings and supply disposable configuration before running `docker compose up --build`. Test both integrated success and failure states. Record commands, versions, exit codes and unverified paths.
- Use Context7 for current dependency and Supabase guidance, and GitHub for authorized PR, review and CI workflows. Check branch, status and diff before changes. Preserve the existing dirty worktree and untracked handover artifacts. Obtain authorization before pushing, merging or deploying. Do not include test records, credentials or signed URLs in GitHub artifacts.

## Privacy and clinical boundaries

- Use synthetic records for engineering and assistant benchmarks. Use public research cohorts only within their documented terms and protocol. Avoid accessing real patient records unless essential and expressly authorized. Minimize fields and redact payloads, patient identifiers, clinical text, lab files, credentials and signed URLs from logs, screenshots, prompts and tool requests.
- Keep database, JWT, Supabase service-role and internal ML secrets server-side. Treat Vite variables as public. Never print local environment files or check secrets into Git. For credentials with confirmed historical exposure, coordinate rotation with the owner and record status without copying secret values.
- Resolve ownership on every clinical read, write, download, comparison and delete, including nested IDs. Validate payloads server-side and restrict storage access. Treat uploaded files and extracted text as untrusted. Review deletion of both rows and objects, including retry and orphan handling.
- Present predictions as educational risk awareness. Never diagnose, infer CKD stage from an isolated finding, prescribe or suggest medication changes. Distinguish model score, SHAP log-odds attribution, guideline education, and journal adherence. Preserve explicit unavailable, demo and legacy-unverified states. Display lab date, unit, source and reference interval when known. Flag unavailable context and incompatible units. Respect clinician restrictions and route urgent or unsafe requests to appropriate care.

## Research methodology

- Trace predictions to the UCI CKD benchmark (400 records, DOI 10.24432/C5G020) and the fitted 24-input pipeline. Keep TreeSHAP grouping metadata-driven and use signed sums for local log-odds additivity. Use absolute magnitude for global importance where documented. Do not convert raw SHAP values into percentage-point probability shifts.
- Follow the research protocol for Studies A–D. Reserve the untouched stratified 20% test split before fitting any preprocessing or model. Fit preprocessing within development folds and fit Platt/isotonic calibration only on development data. Compare the uncalibrated and calibrated variants on the same holdout using Brier score, ECE and reliability plots. A previously fitted full-cohort artifact cannot serve as an untouched holdout baseline.
- For cross-cohort validation use the frozen UCI-fitted model and preprocessor on BD-KDD (PMC13092092). Document missing features and domain shift. Keep BD-KDD and Kaggle cohorts separate from primary development. Do not pool datasets or present external validation as completed without outputs.
- Freeze 150 synthetic cases in the protocol's six categories (30, 30, 25, 25, 20, 20). Use the same base model and cases across M1 (LLM), M2 (+RAG), M3 (+authorized context), M4 (+PCER) and specified component ablations. Score factual correctness independently of evidence grounding. Report decision and safety outcomes, paired statistics, confidence intervals, effect sizes and inter-rater agreement where specified.
- Generate metrics and figures from code. Retain provenance, dataset and split details, seeds, dependency versions, configuration and artifact hashes. Report null and negative findings. Distinguish hypotheses, templates and historical claims from reproduced results. `train_model.py` generates the JSON evaluation report and hashes both fitted files. `/evaluate` withholds metrics when that report is invalid or the hashes do not match.

## Phase gates

### Phase 1 — Repository audit (documented complete)

Accept a source-backed inventory of services, reusable features, data model, defects, security/privacy risks, research limitations and a phased plan that preserves the existing architecture. The audit and final plan provide the handover evidence.

### Phase 2 — Foundation (implemented and partially reverified)

Accept artifact-backed evaluation with explicit unavailable handling, correct SHAP alignment and log-odds additivity, explicit prediction/explanation failure states, authenticated service calls, V2 migration replay with legacy rows preserved, and an authenticated tracker round trip. Verify weekly and monthly aggregations, missing values and zero recorded days, journal adherence and recommendation provenance. Build and run the existing frontend against a synthetic local stack before sign-off.

Onboarding evidence, 24 November 2026:

- Local branch `phase-2-foundation` at `1667c6b`, with substantial pre-existing tracked changes and untracked Phase 2 artifacts. GitHub confirmed the base commit in `Ogshub/KidneyXAI`. Review the working tree before creating a Phase 3 baseline.
- ML pytest passed 7 tests. The environment used Python 3.14 and emitted deprecation and scikit-learn artifact-version warnings (artifact 1.9.0, runtime 1.9.1). In-process FastAPI smoke checks passed: public health returned 200 with the model loaded, evaluation without the configured secret returned 403, and authenticated evaluation returned 200 with status available. This does not reproduce the research metrics.
- Frontend build and lint failed at `frontend/src/pages/AssessmentResult.jsx:269:140` with an invalid Unicode escape in JSX. Browser end-to-end testing remains pending.
- Maven initially lacked a usable `JAVA_HOME`. An offline run with JDK 26 failed during Java compilation with `TypeTag :: UNKNOWN` and reported an uncached Surefire 3.1.2 plugin. Rerun on JDK 17 with dependencies available before drawing backend conclusions.
- Supabase listed no development branch for the connected project. V2 replay, backend integration, cross-account isolation and tracker persistence remain unverified. Use an explicitly provisioned disposable PostgreSQL instance for replay and fixture testing.
- Confirm remaining audit items against source before closing them, including schema/entity drift, survey rate limiting, profile upload validation, account deletion and credential rotation. Check missing/malformed/version-mismatched evaluation artifacts and digest enforcement independently. The evaluation endpoint verifies both artifact digests.

### Phase 3 — Medical reports, laboratory records and longitudinal monitoring

1. Stabilize the Phase 2 baseline and establish a synthetic development database and private storage target. Review schema, ownership and API design before implementation.
2. Introduce `medical_reports` and `lab_results` via V3 SQL with ownership, referential integrity and query indexes. Ensure a child result cannot assert a different owner from its parent report. Preserve historical records.
3. Add authenticated report upload/list/detail/delete, manual lab entry, parameter history and two-report comparison using the plan's `/api/reports` and `/api/lab-results` contracts. The local implementation uses private PostgreSQL attachments. Authorize ownership before issuing and redeeming short-lived download links. Move to Supabase Storage only with an authorized target and equivalent access guarantees. Check content type, file signature and size. Test failure recovery for database and object writes/deletes.
4. Extend the frontend with report upload/detail, manual values, chronological charts and side-by-side deltas. Preserve original values, dates, units and source reference limits. Compare compatible units only, with explicit conversion rules if supported. The documented acceptance path is manual entry. Confirm extraction scope before adding OCR or sending files to a third party.

Accept with two synthetic accounts, valid PDF/image and metadata-only reports, manual records, parameter trends and compatible-unit comparisons. Verify rejection of unsupported uploads, invalid values, incompatible deltas and cross-account access. Verify deletion removes lab rows and the stored object or leaves a recoverable state. Run regression checks for assessment and tracker.

### Phase 4 — AI assistant, RAG and PCER

Accept curated versioned guideline retrieval in pgvector, authenticated context tools, and persisted per-user conversation turns and sources. Verify ANSWER, CLARIFY and ABSTAIN with evidence and decision rationale, stale/missing/conflicting records, unsupported claims, urgent cases and unsafe requests. Ensure prompt content and retrieved documents cannot override access rules. Enable report and lab tools only after Phase 3 ownership is verified.

### Phase 5 — Research evaluation (planned)

Accept leakage-free calibration against the untouched holdout, frozen synthetic benchmark cases, reproducible M1–M4 runs and component ablation, external validation with caveats, and generated reports/analytics with provenance and uncertainty. Report observed results even when hypotheses fail.

### Phase 6 — Integration and hardening (planned)

Accept passing automated ML/API/UI regression suites and browser journeys, ownership and negative-access checks, rate limits and validated uploads, reauthenticated account deletion with appropriate session invalidation and object cleanup, and updated operational and dissertation documentation. Track auth, assessments, tracker, reports, assistant, benchmark and failure recovery end to end. Confirm security findings and credential remediation with evidence.
