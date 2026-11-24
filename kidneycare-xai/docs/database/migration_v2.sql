-- ============================================================
-- KidneyCare-XAI — Database Migration V2 (Phase 2 Upgrade)
-- ============================================================
-- Purpose:
--   1. Upgrade daily_activities with comprehensive lifestyle,
--      symptom, blood pressure, and medication adherence observations.
--   2. Upgrade recommendations with auditable rule_id, observation
--      period, contraindications, and known clinical limitations.
--
-- Safety & Compatibility:
--   - Non-destructive (ADD COLUMN IF NOT EXISTS).
--   - Preserves all existing records and historical foreign keys.
--   - Medication status default is 'NOT_RECORDED' (not false).
--
-- Rollback Instructions (if needed):
--   ALTER TABLE daily_activities
--     DROP COLUMN IF EXISTS systolic_bp,
--     DROP COLUMN IF EXISTS diastolic_bp,
--     DROP COLUMN IF EXISTS medication_status,
--     DROP COLUMN IF EXISTS sleep_quality,
--     DROP COLUMN IF EXISTS exercise_type,
--     DROP COLUMN IF EXISTS symptoms,
--     DROP COLUMN IF EXISTS personal_notes,
--     DROP COLUMN IF EXISTS doctor_restrictions;
--   ALTER TABLE recommendations
--     DROP COLUMN IF EXISTS rule_id,
--     DROP COLUMN IF EXISTS observation_period,
--     DROP COLUMN IF EXISTS known_limitations,
--     DROP COLUMN IF EXISTS contraindications;
-- ============================================================

-- 1. Upgrade daily_activities
ALTER TABLE daily_activities
    ADD COLUMN IF NOT EXISTS systolic_bp          INTEGER,
    ADD COLUMN IF NOT EXISTS diastolic_bp         INTEGER,
    ADD COLUMN IF NOT EXISTS medication_status    VARCHAR(30) DEFAULT 'NOT_RECORDED',
    ADD COLUMN IF NOT EXISTS sleep_quality        VARCHAR(30),
    ADD COLUMN IF NOT EXISTS exercise_type        VARCHAR(50),
    ADD COLUMN IF NOT EXISTS symptoms             TEXT,
    ADD COLUMN IF NOT EXISTS personal_notes       TEXT,
    ADD COLUMN IF NOT EXISTS doctor_restrictions  TEXT;

-- Add check constraint for valid medication status
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'chk_medication_status'
    ) THEN
        ALTER TABLE daily_activities
            ADD CONSTRAINT chk_medication_status
            CHECK (medication_status IN (
                'TAKEN_AS_PRESCRIBED',
                'MISSED',
                'PARTIALLY_TAKEN',
                'NOT_APPLICABLE',
                'NOT_RECORDED'
            ));
    END IF;
END $$;

-- 2. Upgrade recommendations
ALTER TABLE recommendations
    ADD COLUMN IF NOT EXISTS rule_id              VARCHAR(50),
    ADD COLUMN IF NOT EXISTS observation_period   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS known_limitations    TEXT,
    ADD COLUMN IF NOT EXISTS contraindications    TEXT;

-- Index rule_id for auditability
CREATE INDEX IF NOT EXISTS idx_recommendations_rule_id ON recommendations(rule_id);
