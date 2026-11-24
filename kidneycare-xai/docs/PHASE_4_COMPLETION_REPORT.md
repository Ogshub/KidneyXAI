# KidneyCare-XAI Phase 4 completion report

**Date** 24 November 2026

Phase 3 was preserved in commit `ee4ae60`. The Phase 4 source is in the local `phase-4-ai-assistant` working tree. The verified configuration uses a deterministic mock provider, an isolated fixture retriever, synthetic accounts and disposable PostgreSQL 15.6.

## Implemented

- `AssistantController`, `AssistantService`, `AssistantContextTools` and `ConversationService` implement authenticated chat, bounded history, read-only context, account-scoped deletion, citation persistence and validation audit records.
- `app/assistant.py` implements structured local routing, bounded follow-ups, ANSWER, CLARIFY and ABSTAIN with separate urgency, and reason codes. Owner-scoped report, comparison, lab, journal, assessment and recommendation information comes from existing Spring services. Numerical claims are computed before response composition.
- `app/assistant_provider.py` includes a deterministic mock and a Gemini REST adapter. The adapter validates an evidence-ID schema, enforces bounded timeouts and attempts, and logs token counts without sensitive content. It receives only reviewed public excerpts.
- `knowledge/source_manifest.json` contains four public fixture entries: two sections from NIDDK's CKD tests resource, one NKF eGFR entry and one KDIGO CKD guideline entry. The original paraphrases include provenance and full content hashes. `app/knowledge.py` provides fixture retrieval and the optional Sentence Transformers/pgvector ingestion and search path. Rule provenance remains in the authorized recommendation context.
- `migration_v4.sql` and the bootstrap create knowledge, conversation, message, citation and audit tables. Knowledge tables remain separate from private account data. Deletion cascades through conversation data.
- `Assistant.jsx` adds the responsive chat, saved conversations, suggested questions, evidence links, record links and deletion controls. It is reachable from dashboard and navigation.

## Verified checks

- Java 17 `mvn.cmd -B clean verify` with `KIDNEY_XAI_TEST_PG_PORT=55432` exited **0**. Seven tests passed. V4 replay and cross-account read, write and deletion denial were exercised through the Spring integration suite.
- V4 applied twice to an existing disposable Phase 3 browser database. The existing synthetic report count was preserved. PostgreSQL reported that pgvector was unavailable.
- `python -B -m pytest -p no:cacheprovider -q --disable-warnings` exited **0**. Thirty tests passed, including the original fourteen. Assistant coverage includes internal authentication, mock and simulated Gemini transports, timeout/retry, malformed provider output, citation validation, missing and historical data, conflict handling, prompt injection, urgency and isolated ingestion and retrieval fixtures.
- `npm.cmd run build` exited **0** with the existing bundle-size advisory. `npm.cmd run lint` exited **0** with 56 existing warnings and no errors.
- `npx.cmd playwright test --reporter=line` with installed Chrome exited **0**. Three scenarios passed. The assistant scenario verified an evidence-backed answer, clarification before a report existed, a dated owner-scoped report answer, abstention, history after reload and deletion. The other two scenarios reran the Phase 3 medical report and model-unavailable browser regressions.
- A separate loopback API smoke check exited **0** and verified owner-scoped lab history, a historical-data clarification, a normalized report delta and a weekly journal statistic through the running Spring–FastAPI stack.

[Synthetic assistant screenshot](../frontend/test-results/assistant-answers-from-rev-41c29--and-deletes-a-conversation/assistant.png). The image is generated in the ignored browser test directory.

## Remaining verification

- Gemini request/response behavior was simulated with local HTTP fixtures. No live API call or paid evaluation was made. An authorized API key and usage allowance are required for live verification.
- File-based retrieval was verified end to end. The pgvector and local embedding path ran against isolated ingestion/retrieval fixtures. Native verification needs an explicitly selected disposable PostgreSQL instance with pgvector plus a locally cached embedding model.
- M1–M4 switches and ablations are implemented on the protected research route. The evidence-selection prototype abstains in M1 without evidence and does not implement a free-form base-LLM comparator. That comparator remains open for the intended research comparison. The normal application uses guarded M4.
- The corpus is small. Safety has deterministic guardrails and deliberately bounded output. These checks do not establish clinical validity or robust urgent-intent detection. Qualified review is required before real-patient use.

No hosted infrastructure was changed and no production patient records were accessed. The local ML image definition now includes the reviewed corpus. No Phase 5 benchmark was started. See [PCER architecture](PCER_ARCHITECTURE.md) and [assistant API and environment variables](AI_ASSISTANT_API.md) for reproduction details.
