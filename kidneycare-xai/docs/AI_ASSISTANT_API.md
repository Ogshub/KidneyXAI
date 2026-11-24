# AI assistant API

## Phase 6 contract additions

Chat optionally accepts `pageContext` with `page`, `reportId` and `assessmentId`. Spring validates supplied record references against the authenticated account before executing context tools. The response adds `providerMode`, `corpusVersion` and `validationReasonCodes`. The floating assistant uses these fields and the existing conversation APIs.

Conversational research requires `ASSISTANT_CONVERSATIONAL_RESEARCH=enabled` on both services and an explicit `ASSISTANT_SYNTHETIC_ACCOUNTS` email allowlist on Spring. Configure an authorized Gemini key and model server-side. Only allowlisted synthetic accounts may transfer questions and minimum structured context to this mode. The default bounded workflow retains its existing privacy boundary.

Internal `/internal/assistant/conversational/plan` and `/internal/assistant/conversational/respond` endpoints require the internal secret and the research gate. A structured plan selects an allowlisted read-only tool. Spring executes the authorized lookup. Generated factual sentences must exactly match the supplied deterministic facts or retrieved evidence, including values, dates and units. This deliberately limits phrasing and does not establish clinical accuracy or semantic relevance. Live provider behavior remains pending verification.

## Application routes

All routes require the current application's JWT. Ownership is derived from the authenticated identity. Foreign conversations return 404.

- `POST /api/assistant/chat` accepts `message` (1–1000 characters) and an optional `conversationId`. It returns the two identifiers, decision, intent, answer, context status, missing information, limitations, public sources, record references, urgency, navigation actions, model version, latency and validation reason codes.
- `GET /api/assistant/conversations` lists up to 50 recent conversations.
- `GET /api/assistant/conversations/{id}` returns up to 50 turns in chronological order.
- `DELETE /api/assistant/conversations/{id}` returns 204 and cascades through turns, citation snapshots and audit data.

Chat accepts at most ten requests per account per minute per running Spring instance. The rate limiter is local to that instance. The conversation contains the submitted question and returned answer. The application does not store hidden prompts, raw clinical tool payloads or provider reasoning. All contracts are for the research prototype.

For report comparisons, provide two report numbers prefixed by `#`. Use terms such as creatinine, hemoglobin, eGFR, urea, glucose, sodium, potassium or ACR for parameter history.

## Internal service configuration

- `ML_SERVICE_URL` points Spring to FastAPI. `ML_INTERNAL_SECRET` must be set on both services. The assistant rejects calls without this header even if other legacy ML routes allow an empty secret.
- `ASSISTANT_PROVIDER=mock` is the deterministic default. `ASSISTANT_PROVIDER=gemini` requires an authorized `GEMINI_API_KEY` and explicit `ASSISTANT_MODEL`.
- `ASSISTANT_TIMEOUT_SECONDS` accepts 1–8 seconds for the Gemini request. The adapter retries at most once for timeouts, transient connection errors, throttling and selected server errors.
- `ASSISTANT_RETRIEVER=fixture` selects the isolated development corpus lookup. `pgvector` requires the optional dependencies and local index described in the architecture document.
- `ASSISTANT_SYNTHETIC_RESEARCH=enabled` enables only the internal research route described in the architecture document. Leave it disabled in normal application use.

Internal POST routes are `/internal/assistant/route`, `/respond`, `/knowledge` and `/research` under the same prefix. They never resolve a username or user ID. Spring is the authorized tool broker. Provider requests carry public source IDs and paraphrases only. Before any future external transfer of patient data, document consent, retention, policy approval and provider data-handling terms.
