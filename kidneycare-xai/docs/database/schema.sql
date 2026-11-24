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
    profile_picture_url TEXT,                   -- Base64 data URL or external URL
    bio             TEXT,                       -- Short user biography
    phone           VARCHAR(30),               -- Contact number / pager
    affiliation     VARCHAR(255),              -- Hospital / department / institution
    timezone        VARCHAR(50)     DEFAULT 'UTC+05:30',  -- Preferred timezone
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
    risk_category   VARCHAR(20),        -- Low / Moderate / High (defensible thresholds)
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

-- 5. Daily Activities (lifestyle tracking & health observations)
CREATE TABLE IF NOT EXISTS daily_activities (
    id                  BIGSERIAL       PRIMARY KEY,
    user_id             BIGINT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_date       DATE            NOT NULL,
    water_intake_liters DOUBLE PRECISION,
    exercise_minutes    INTEGER,
    exercise_type       VARCHAR(50),        -- Walking, Running, Gym, Yoga, Cycling, etc.
    sleep_hours         DOUBLE PRECISION,
    sleep_quality       VARCHAR(30),        -- Restful, Average, Interrupted, Poor
    salt_level          VARCHAR(20),        -- Low / Medium / High
    fast_food           BOOLEAN         DEFAULT FALSE,
    sugary_drinks       INTEGER         DEFAULT 0,
    smoking             BOOLEAN         DEFAULT FALSE,
    alcohol             BOOLEAN         DEFAULT FALSE,
    weight_kg           DOUBLE PRECISION,
    stress_level        VARCHAR(20),        -- Low / Medium / High
    systolic_bp         INTEGER,            -- Optional systolic blood pressure (mmHg)
    diastolic_bp        INTEGER,            -- Optional diastolic blood pressure (mmHg)
    medication_status   VARCHAR(30)     DEFAULT 'NOT_RECORDED', -- TAKEN_AS_PRESCRIBED / MISSED / PARTIALLY_TAKEN / NOT_APPLICABLE / NOT_RECORDED
    symptoms            TEXT,               -- Optional user-reported observations
    personal_notes      TEXT,               -- Private journal notes
    doctor_restrictions TEXT,               -- Documented clinical restrictions (e.g. fluid limit)
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_user_activity_date UNIQUE (user_id, activity_date),
    CONSTRAINT chk_medication_status CHECK (medication_status IN
        ('TAKEN_AS_PRESCRIBED', 'MISSED', 'PARTIALLY_TAKEN', 'NOT_APPLICABLE', 'NOT_RECORDED'))
);

CREATE INDEX idx_daily_activities_user_id ON daily_activities(user_id);
CREATE INDEX idx_daily_activities_date ON daily_activities(activity_date);

-- 6. Recommendations (deterministic, traceable rule-engine output)
CREATE TABLE IF NOT EXISTS recommendations (
    id                  BIGSERIAL       PRIMARY KEY,
    assessment_id       BIGINT          NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    rule_id             VARCHAR(50),                -- Stable identifier: RULE-HYDR-01, RULE-SOD-01, etc.
    category            VARCHAR(50)     NOT NULL,   -- Diet / Exercise / Smoking / Hydration / Medical / etc.
    trigger_reason      VARCHAR(255)    NOT NULL,   -- e.g. "Water intake = 1.0 L"
    observation_period  VARCHAR(50),                -- e.g. "Latest Daily Entry", "Baseline Profile"
    recommendation      TEXT            NOT NULL,   -- The educational guidance text
    priority            VARCHAR(20)     NOT NULL,   -- Low / Medium / High / Urgent
    source              VARCHAR(255),               -- Reference/guideline source (e.g. "KDIGO 2024")
    known_limitations   TEXT,                       -- Educational boundaries and non-diagnostic caveats
    contraindications   TEXT,                       -- Applicable clinical exclusions
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_assessment_id ON recommendations(assessment_id);
CREATE INDEX idx_recommendations_rule_id ON recommendations(rule_id);

-- 7. Research Responses (Dataset B — college study, fully decoupled)
CREATE TABLE IF NOT EXISTS research_responses (
    id                  BIGSERIAL       PRIMARY KEY,
    participant_id      VARCHAR(20)     NOT NULL,   -- P001, P002, etc.
    role                VARCHAR(20)     NOT NULL,   -- Student / Faculty
    age_group           VARCHAR(20)     NOT NULL,
    gender              VARCHAR(20),                -- Optional

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

-- No foreign key to users — intentionally decoupled
CREATE INDEX idx_research_responses_role ON research_responses(role);

-- V3: owner-scoped medical reports with transactional private attachments.
CREATE TABLE IF NOT EXISTS medical_reports (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('bloodwork', 'urinalysis', 'imaging', 'other')),
    lab_name VARCHAR(255),
    doctor_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_medical_reports_owner_date ON medical_reports(user_id, report_date DESC, id DESC);

CREATE TABLE IF NOT EXISTS medical_report_files (
    report_id BIGINT PRIMARY KEY REFERENCES medical_reports(id) ON DELETE CASCADE,
    object_key UUID NOT NULL UNIQUE,
    file_name VARCHAR(255) NOT NULL,
    media_type VARCHAR(30) NOT NULL CHECK (media_type IN ('application/pdf', 'image/png', 'image/jpeg')),
    contents BYTEA NOT NULL CHECK (octet_length(contents) BETWEEN 1 AND 10485760)
);

CREATE TABLE IF NOT EXISTS lab_results (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    parameter_name VARCHAR(100) NOT NULL,
    original_value NUMERIC(24,10) NOT NULL CHECK (original_value >= 0),
    original_unit VARCHAR(30) NOT NULL,
    normalized_value NUMERIC(24,10) NOT NULL CHECK (normalized_value >= 0),
    normalized_unit VARCHAR(30) NOT NULL,
    reference_low NUMERIC(24,10) CHECK (reference_low >= 0),
    reference_high NUMERIC(24,10) CHECK (reference_high >= 0),
    recorded_at DATE NOT NULL,
    source VARCHAR(255) NOT NULL,
    transcription_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id, user_id) REFERENCES medical_reports(id, user_id) ON DELETE CASCADE,
    CHECK (reference_low IS NULL OR reference_high IS NULL OR reference_low <= reference_high)
);
CREATE INDEX IF NOT EXISTS idx_lab_results_report ON lab_results(report_id);
CREATE INDEX IF NOT EXISTS idx_lab_results_owner_history ON lab_results(user_id, parameter_name, recorded_at DESC, id DESC);

-- Application JDBC accesses these tables. Deny public Data API roles if present.
REVOKE ALL ON medical_reports, medical_report_files, lab_results FROM PUBLIC;
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL ON medical_reports, medical_report_files, lab_results FROM anon;
    END IF;
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL ON medical_reports, medical_report_files, lab_results FROM authenticated;
    END IF;
END $$;
ALTER TABLE medical_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_report_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_results ENABLE ROW LEVEL SECURITY;
