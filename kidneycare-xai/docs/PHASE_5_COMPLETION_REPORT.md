# KidneyCare-XAI Phase 5 completion report

**Local branch** `phase-5-research-evaluation`. Phase 4 was committed as `68c5519`. Phase 5 is partially verified. The held-out calibration study and software harness are implemented. Live verification and substantive clinical annotation remain open.

## Delivered

- An isolated CLI for question-only M1, evidence-augmented M2, synthetic-context M3, research-gated M4, single-component ablations and a separate bounded-assistant configuration. The generative comparisons use one model and output contract. The application still uses the existing bounded assistant.
- SHA-256 frozen datasets with 150 evaluation cases in the specified six categories and 18 separate development cases. Related scenario variants share family identifiers. The evidence corpus contains 12 attributed public sections, with new unreviewed sections restricted to research retrieval.
- Restartable, counterbalanced execution and immutable run metadata. Outputs distinguish transport, authentication, malformed and quota failures from assistant decisions. The statistics script reports coverage, decision outcomes, paired risk differences, family bootstrap intervals and exact McNemar with Holm correction when cases are independently paired. Independent clinical scoring uses a masked worksheet and optional completed annotation import.
- [Measured calibration and dataset compatibility results](RESEARCH_EVALUATION_RESULTS.md). JSON, prediction CSV and both figures are generated from the fresh held-out experiment. Analytics shows computed calibration metrics and pending live results separately. V5 aligns the fresh survey schema with its existing entity and leaves missing survey averages unavailable.

## Verification and reproduction

- From the application root, install the optional plotting dependency with `python -m pip install -r research/experiments/requirements.txt`. Run `python research/experiments/calibration.py`. The recorded run exited 0. An earlier attempt exposed a raw-column naming mismatch. Reusing the training pipeline's static column-name mapping resolved it before fitting.
- Use the ML environment to run `python research/experiments/benchmark.py research/benchmark/development_cases.json <run-dir> --provider fixture` from the application root. Run it again to verify resume, then run `python research/experiments/analyze.py <run-dir> <report-dir>`. Use `--annotations <completed-blinded-csv>` after independent review.
- Java 17 `mvn.cmd -B clean verify` with `KIDNEY_XAI_TEST_PG_PORT=55432` exited 0. Eight checks passed, including V5 replay against disposable PostgreSQL and null survey scores without responses.
- The development-only fixture run and its resume exited 0. It produced 162 per-case records and one run manifest. Summary and worksheet generation exited 0. No final-set model run was performed.
- Full pytest in the ML environment with the optional plotting dependency exited 0. **41 passed, 1 skipped**. The skip was the opt-in native pgvector test.
- Frontend build and lint exited 0. Lint reported 56 warnings and zero errors. The final Chromium run exited 0 with **4 passed**. The earlier run surfaced a transient registration failure and the survey schema mismatch. V5 fixed the survey API on the disposable database.

## Remaining verification

- No authorized `GEMINI_API_KEY` was present. Simulated transport behavior does not establish live provider authentication, quota, model version or response quality. An authorized key and explicit model identifier are needed for a development-only pilot.
- Disposable PostgreSQL 15.6 did not offer pgvector, and Docker was unavailable. The opt-in integration test requires a loopback `kidney_vector_test_*` database with pgvector and V4 applied, optional retrieval dependencies and a cached embedding model. Use `ASSISTANT_NATIVE_VECTOR_TEST=enabled`, `ASSISTANT_KB_DSN` and `ASSISTANT_EMBEDDING_MODEL`. Native embedding dimension, vector search latency, SQL replay and retrieval outcomes remain unverified.
- The corpus and reference rubrics await qualified medical review. Live final runs also require quota verification and explicit owner approval. Generated fixture outputs are software checks and must not be reported as comparative findings.
- No production infrastructure was changed and no production patient records were used. A failed CLI startup resolved settings in the application directory and could place dotenv validation diagnostics in logs. The runner now loads ML settings from its own module directory. Review the failed diagnostic and rotate any credentials it exposed.
- Phase 6 has not started.
