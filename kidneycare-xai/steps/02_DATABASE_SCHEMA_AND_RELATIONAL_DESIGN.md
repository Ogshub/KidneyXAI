# Step 02: Relational Database Schema & Relational Design

## 1. Overview & Objective
In this step, we design and write the complete PostgreSQL Data Definition Language (DDL) script: `docs/database/schema.sql`.

This schema provisions 7 tables:
1. `users`: Authentication identities, password hashes, roles, and timestamps.
2. `health_profiles`: Long-lived static clinical factors (age, height, weight, BMI, comorbidities).
3. `assessments`: Machine learning risk assessment events, risk probabilities, and model version.
4. `assessment_features`: Individual local SHAP attribution scores per feature per assessment.
5. `daily_activities`: Longitudinal daily lifestyle telemetry (water, sleep, exercise, salt, stress).
6. `recommendations`: Deterministic clinical rules fired from biomarkers and lifestyle triggers.
7. `research_responses`: Anonymized cross-sectional research survey data (Dataset B).

---

## 2. Prerequisites
- Completed `01_PROJECT_SCAFFOLDING_AND_ROOT_CONFIG.md`
- PostgreSQL database engine (version 14, 15, or 16)

---

## 3. Why This Is Created Now
A common failure in AI engineering is creating machine learning endpoints and JPA entities before knowing the underlying schema.
- **Relational Integrity**: Foreign keys, cascade delete policies, and unique compound constraints must be formally defined first.
- **Explainability Persistence**: Explainable AI (SHAP) produces numeric attribution scores for every clinical feature. If there is no dedicated `assessment_features` table, SHAP values are lost after the HTTP response closes, making longitudinal audit impossible.
- **Research Compliance**: Medical ethics requires that research surveys (Dataset B) remain decoupled and unlinked from individual user accounts (`users` table).

---

## 4. Entity-Relationship Diagram (ERD)

```
       ┌──────────────────┐
       │      users       │
       └────────┬─────────┘
                │ 1
                │
         1:1    │          1:N
   ┌────────────┴───────────┬──────────────────────┐
   │                        │                      │
   ▼                        ▼                      ▼
┌──────────────────┐  ┌─────────────┐    ┌──────────────────┐
│ health_profiles  │  │ assessments │    │ daily_activities │
└──────────────────┘  └──────┬──────┘    └──────────────────┘
                             │
                      1:N    │     1:N
                 ┌───────────┴──────────┐
                 │                      │
                 ▼                      ▼
       ┌────────────────────┐ ┌─────────────────┐
       │ assessment_features│ │ recommendations │
       └────────────────────┘ └─────────────────┘

       ┌────────────────────┐
       │ research_responses │ (Standalone / Anonymized)
       └────────────────────┘
```

---

## 5. File Content: `docs/database/schema.sql`

Create `kidneycare-xai/docs/database/schema.sql`:

```sql
-- ============================================================
-- KidneyCare-XAI — PostgreSQL Database Schema
-- ============================================================
-- 7 tables: users, health_profiles, assessments,
--           assessment_features, daily_activities,
--           recommendations, research_responses
-- ============================================================

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(255)    NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'USER',
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- 2. Health Profiles (one per user)
CREATE TABLE IF NOT EXISTS health_profiles (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    age                 INTEGER,
    gender              VARCHAR(20),
    height_cm           DOUBLE PRECISION,
    weight_kg           DOUBLE PRECISION,
    bmi                 DOUBLE PRECISION,
    diabetes            VARCHAR(30),        -- Yes / No / Prefer not to say
    hypertension        VARCHAR(30),        -- Yes / No / Prefer not to say
    family_history      VARCHAR(30),        -- Yes / No / Don't know / Prefer not to say
    smoking             VARCHAR(30),        -- Never / Former / Occasional / Regular / Prefer not to say
    alcohol             VARCHAR(30),        -- Never / Occasionally / Monthly / Weekly / Prefer not to say
    painkiller_usage    VARCHAR(30),        -- Never / Occasionally / Frequently / Prefer not to say
    updated_at          TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_profiles_user_id ON health_profiles(user_id);

-- 3. Assessments (ML risk results)
CREATE TABLE IF NOT EXISTS assessments (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_score      DOUBLE PRECISION NOT NULL,
    risk_category   VARCHAR(20),        -- Low / Moderate / High
    prediction      VARCHAR(20)     NOT NULL,  -- ckd / notckd
    model_version   VARCHAR(20)     NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_created_at ON assessments(created_at);

-- 4. Assessment Features (per-feature SHAP values)
CREATE TABLE IF NOT EXISTS assessment_features (
    id              BIGSERIAL       PRIMARY KEY,
    assessment_id   BIGINT          NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    feature_name    VARCHAR(100)    NOT NULL,
    feature_value   DOUBLE PRECISION NOT NULL,
    shap_value      DOUBLE PRECISION NOT NULL
);

CREATE INDEX idx_assessment_features_assessment_id ON assessment_features(assessment_id);

-- 5. Daily Activities (lifestyle tracking)
CREATE TABLE IF NOT EXISTS daily_activities (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date       DATE            NOT NULL,
    water_intake_liters DOUBLE PRECISION,
    exercise_minutes    INTEGER,
    sleep_hours         DOUBLE PRECISION,
    salt_level          VARCHAR(20),        -- Low / Medium / High
    fast_food           BOOLEAN         DEFAULT FALSE,
    sugary_drinks       INTEGER         DEFAULT 0,
    smoking             BOOLEAN         DEFAULT FALSE,
    alcohol             BOOLEAN         DEFAULT FALSE,
    weight_kg           DOUBLE PRECISION,
    stress_level        VARCHAR(20),        -- Low / Medium / High
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_activity_date UNIQUE (user_id, activity_date)
);

CREATE INDEX idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date);

-- 6. Recommendations (rule-engine output)
CREATE TABLE IF NOT EXISTS recommendations (
    id              BIGSERIAL       PRIMARY KEY,
    assessment_id   BIGINT          NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    category        VARCHAR(50)     NOT NULL,   -- Diet / Exercise / Smoking / Hydration / Medical
    trigger_reason  VARCHAR(255)    NOT NULL,   -- e.g. "Processed-food frequency = Daily"
    recommendation  TEXT            NOT NULL,   -- The actual guidance text
    priority        VARCHAR(20)     NOT NULL,   -- Low / Medium / High
    source          VARCHAR(255),               -- Reference/guideline source
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_assessment_id ON recommendations(assessment_id);

-- 7. Research Responses (Dataset B — college study, fully decoupled)
CREATE TABLE IF NOT EXISTS research_responses (
    id                  BIGSERIAL       PRIMARY KEY,
    participant_id      VARCHAR(20)     NOT NULL,   -- P001, P002, etc.
    role                VARCHAR(20)     NOT NULL,   -- Student / Faculty
    age_group           VARCHAR(20)     NOT NULL,
    gender              VARCHAR(20),

    -- Health information
    diabetes            VARCHAR(30),
    hypertension        VARCHAR(30),
    family_history      VARCHAR(30),
    painkiller_usage    VARCHAR(30),

    -- Lifestyle
    water_intake        VARCHAR(30),
    exercise            VARCHAR(30),
    sleep_hours         VARCHAR(30),
    salty_processed      VARCHAR(30),
    fast_food           VARCHAR(30),
    sugary_drinks       VARCHAR(30),
    smoking             VARCHAR(30),
    alcohol             VARCHAR(30),

    -- Awareness
    aware_early_symptoms    BOOLEAN,
    aware_risk_factors      BOOLEAN,
    monitors_bp             BOOLEAN,
    received_kidney_info    BOOLEAN,

    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_research_responses_role ON research_responses(role);
```

---

## 6. Detailed Architectural Breakdown

### Key Schema Decisions:
1. **`BIGSERIAL` Primary Keys**: Prevents 32-bit integer overflow as longitudinal health logs grow over years.
2. **`ON DELETE CASCADE`**:
   - If a `user` is deleted (GDPR / right to be forgotten), their `health_profile`, `assessments`, and `daily_activities` are automatically purged.
   - If an `assessment` is deleted, its linked `assessment_features` (SHAP scores) and `recommendations` are safely purged.
3. **Compound Unique Constraint `uq_user_activity_date`**:
   - Prevents duplicate lifestyle logs for the same day. One user has at most one log entry per calendar date. An update (UPSERT) is performed if submitted again.
4. **Decoupled `research_responses`**:
   - Intentionally lacks any foreign key to `users(id)`. This guarantees IRB/medical research anonymity so participant responses can never be traced back to clinical logins.

---

## 7. Verification
If you have PostgreSQL running locally, execute:
```bash
psql -U postgres -d kidneycare -f docs/database/schema.sql
```
Or in Docker:
```bash
docker run --name pg-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=kidneycare -d -p 5432:5432 postgres:15
docker exec -i pg-test psql -U postgres -d kidneycare < docs/database/schema.sql
```
Verify that all 7 tables and 9 indexes are created without syntax errors.

---

## 8. Next Step Dependency
With the database schema established:
- The ML Service needs to produce the exact feature names and predictions expected by `assessments` and `assessment_features`.
- Proceed to **`03_ML_SERVICE_ENVIRONMENT_AND_CONFIG.md`** to set up the Python FastAPI microservice environment.
