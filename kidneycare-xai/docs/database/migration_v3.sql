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
