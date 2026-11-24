-- Align survey analytics with the existing ResearchResponse mapping.
ALTER TABLE research_responses
    ADD COLUMN IF NOT EXISTS shap_comprehension_score INTEGER,
    ADD COLUMN IF NOT EXISTS narrative_preference_score INTEGER,
    ADD COLUMN IF NOT EXISTS guideline_trust_score INTEGER,
    ADD COLUMN IF NOT EXISTS actionability_score INTEGER;
