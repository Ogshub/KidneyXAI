# KidneyCare-XAI Phase 3 completion report

**Date** 24 November 2026
**Branch** `phase-3-medical-records`
**Verified Phase 2 baseline** `699cef0`

Phase 3 was implemented and tested locally with synthetic accounts and disposable PostgreSQL 15.6. Hosted systems and real patient records were outside this run.

## Implementation

- The medical reports workspace supports metadata-only records and multipart uploads, report details, metadata edits, attachment replacement and download, and deletion. It links from the dashboard and navigation.
- The local private storage adapter keeps each attachment in a restricted PostgreSQL row keyed to its report. It checks a 10 MB ceiling, filename, MIME type, and file signature for PDF, PNG, or JPEG. Download grants are signed, bound to the authenticated owner and current attachment, and expire after 120 seconds. Replacing the file invalidates existing grants. Database transactions and cascading foreign keys cover report, file, and measurement deletion.
- The lab registry accepts eight named parameters and a bounded set of units. It preserves the original number, unit, measurement date, reported reference bounds, source and user-confirmed transcription status. It validates creatinine and hemoglobin conversions, the identity conversion for sodium and potassium units, and unchanged canonical inputs. User confirmation records transcription provenance. Medical interpretation requires clinical review.
- Laboratory history plots normalized values against actual collection dates and links back to source reports. Comparisons show the latest measurement per parameter in each selected report and a normalized difference when both values are comparable. The original values and units remain visible.
- Assessment prefilling returns the latest confirmed lab result for each allowlisted ML field. eGFR and urine albumin-to-creatinine ratio stay in the records module. Users review the values, dates and sources, then confirm copying into the editable form. Copying values does not submit an assessment.
- The internal `PatientContextService` exposes owner-scoped health profile, recent report, lab history, latest measurements, report comparison, lifestyle summary, latest assessment and educational recommendations. The relevant responses include dates, units and provenance, including persisted recommendation rule, guideline source and creation time. Phase 4 can use these services through authenticated orchestration.

## Research integrity

The training pipeline generates `evaluation_report.json` from stratified ten-fold cross-validation and records complete SHA-256 digests of the trained model and fitted preprocessor. The runtime evaluation route checks the report against the loaded artifacts and current files. It withholds figures when the report is absent, malformed, from another version or attached to mismatched files.

The generated UCI benchmark report contains 400 observations. Reproduced metrics are accuracy 98.50%, precision 0.9849, sensitivity 0.9920, specificity 0.9733, F1 0.9881 and AUROC 0.9981. The primary analytics view uses verified response values. Research documents identify the proposed external validation and human study as pending.

## Migration results

- V2 applied and replayed on representative legacy data. It preserved pre-existing values, supplied the medication status default, left missing observations nullable, and rejected invalid medication states. Constraint detection is now scoped to its target table.
- V3 applied and replayed on a pre-V3 test schema that already had users. It preserved those users, created the report, attachment and lab tables, installed row-level security and indexes, and rejected a lab row whose user differed from its report owner.
- A fresh bootstrap and subsequent V2/V3 replay also passed. Integration tests verified that invalid file creation left no partial report and that deleting a report removed its private attachment and remaining measurements.

## Executed checks

- `mvn.cmd -B clean verify` with JDK 17.0.21.1 and `KIDNEY_XAI_TEST_PG_PORT=55432` exited **0**. Six tests passed with zero failures, errors or skips. The suite covers migrations, report and lab CRUD, file verification, signed-link access and replacement, cross-account checks, unit normalization, time ordering, comparisons, assessment mapping, tracker updates and recommendation provenance. A prior clean attempt exited 1 because the running test backend held the JAR open on Windows. The rerun passed after stopping that process.
- `npm.cmd run build` exited **0**. Vite emitted its existing chunk-size advisory.
- `npm.cmd run lint` exited **0**, with 56 existing warnings and zero errors.
- `npx.cmd playwright test --reporter=line` with `KIDNEY_BROWSER_CHANNEL=chrome` exited **0**. Two scenarios passed. One exercised local registration, report creation with a synthetic file, byte-for-byte download, metadata and lab edits, history and comparison, confirmed assessment prefilling and deletion. The second simulated a 503 to verify the frontend stayed on the assessment form and displayed the unavailable message.
- `python -B -m pytest -p no:cacheprovider -q --disable-warnings` exited **0**. Fourteen tests passed, including all eight pre-existing checks and six new artifact-integrity cases. Dependency and artifact-version warnings remain.

Browser screenshots contain synthetic data. They are generated under the ignored frontend test-output directory and can be regenerated by rerunning Playwright.

- [Report details](../frontend/test-results/medical-records-creates-do-c546c-and-deletes-private-reports/report-details.png)
- [Report comparison](../frontend/test-results/medical-records-creates-do-c546c-and-deletes-private-reports/report-comparison.png)

## Reproduction

1. Start a disposable PostgreSQL 15+ instance bound to loopback. For the Java suite, export `KIDNEY_XAI_TEST_PG_PORT` and, when required, `KIDNEY_XAI_TEST_PG_USER` and `KIDNEY_XAI_TEST_PG_PASSWORD`. The integration suite creates and drops its own randomly named database.
2. Run `mvn clean verify` in `backend-springboot/` with `JAVA_HOME` set to JDK 17. For a browser test, provision a separate synthetic database and apply `docs/database/schema.sql`. For an existing synthetic installation apply V2, then V3. Run Spring on loopback port 18080 with `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` and a fresh local `JWT_SECRET`.
3. In `frontend/`, run `npm ci`. Use `npx playwright install chromium` or set `KIDNEY_BROWSER_CHANNEL=chrome` for installed Chrome. Run `npx playwright test --reporter=line`. The Playwright configuration starts Vite on loopback port 13000 and directs API traffic to the local backend.
4. In `ml-service/`, use the project's virtual environment and run `python -m pytest -q`. Run `python train_model.py` only when intentionally retraining and replacing the local model artifacts.

## Limitations and Phase 4 readiness

Manual transcription is the primary workflow. Attachments open through downloads. The local adapter uses PostgreSQL, and hosted object storage has not been provisioned or tested. File checks validate type, signature and size. Malware scanning, OCR and clinical validation are outside the local scope. Reference intervals remain source-specific and appear in report details.

Phase 4 can build on the patient-context interfaces, with data minimization and authorization carried through any later retrieval and evidence-validation layer. Chat, RAG and PCER remain future work. Credential rotation remains an owner action for any previously exposed keys. Record revocation and rotation with the relevant providers without copying secret values into the repository.
