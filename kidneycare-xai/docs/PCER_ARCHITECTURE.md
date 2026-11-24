# Phase 4 PCER prototype

## Phase 6 implementation amendment

The synthetic-only conversational path adds provider-assisted intent selection and response composition. Spring remains the tool authorization boundary. Minimal page references are validated against account ownership. The provider receives bounded context only for explicitly allowlisted synthetic accounts, and the internal endpoints also require a separate research-mode gate.

Structured claims carry identifiers and text. Verification rejects invented identifiers, altered numerical facts, changed dates and duplicate claims. Accepted text must match deterministic facts or permitted retrieved excerpts. This approach constrains output vocabulary and leaves semantic relevance and clinical correctness subject to qualified review. The frozen comparative dataset and existing Phase 5 results remain unchanged. Final comparisons need a versioned run configuration identifying this amended architecture.

The implementation is undergoing integration verification. No live conversational pilot or final comparative result is established by these changes.

The browser uses the Spring JWT API. Spring owns account lookup, conversation storage, rate limiting and context selection. FastAPI handles structured routing and response decisions behind mandatory internal authentication. The external adapter can select from public reviewed excerpts. It receives neither user questions nor patient context.

## Validation pipeline

- **Context completeness.** Routing uses the current message and a single prior turn. Spring selects a read-only tool by allowlisted intent. The authenticated principal controls all lookups. A missing report, measurement, proposed comparison pair or journal entry leads to CLARIFY.
- **Time and consistency.** Context projections preserve collection dates, measurement units and transcription status. Current-day queries against older observations trigger clarification. Weekly and monthly summaries use the requested anchor. Duplicate encounter results with conflicting values trigger clarification. No inference of kidney progression is drawn from changes in values.
- **Evidence.** The manifest contains original paraphrases attributed to NIDDK, NKF and KDIGO. The corpus excludes copied guideline text and uploaded patient material. A local fixture retriever uses term overlap. The optional vector adapter uses local Sentence Transformers and a matching model and dimension in PostgreSQL. Returned public text is validated against the trusted manifest.
- **Verification.** Patient values and comparisons come from deterministic Spring projections. Provider output is a schema-validated evidence ID. The response renders the selected reviewed text only after checking ID membership. This bounds the claims the assistant can emit. It does not measure general-purpose LLM factuality or clinical reliability.
- **Safety and decisions.** The earliest guard detects known urgent expressions and high-risk requests. Further output constraints exclude generated treatment, medication changes and diagnosis across all configurations. ANSWER, CLARIFY and ABSTAIN include reason codes. Urgency is separate. Free-form clinical intent understanding and emergency sensitivity require qualified review.

Journal notes, attachment content, full profiles and clinician restriction text stay outside generation and shared retrieval. Journal hydration averages describe recorded observations without setting intake targets. For recommendations, the response names provenance and links back to the source card with the applicable restrictions.

## Research configurations

The protected `/internal/assistant/research` endpoint is disabled unless `ASSISTANT_SYNTHETIC_RESEARCH=enabled`. It is absent from the Spring public API. Use isolated synthetic fixtures only. `disable` accepts any subset of `evidence`, `context`, `temporal` and `consistency`. Result metadata records the active flags.

- M1 disables context and retrieval.
- M2 enables reviewed evidence retrieval.
- M3 enables evidence retrieval and context.
- M4 adds temporal and consistency checks.

The configurations share the same provider selection and safety policy. The current provider contract selects reviewed evidence and M1 abstains when no evidence is supplied. These controls are implemented, while an independently scored base-LLM benchmark and component-effect measurement are future work. No Phase 5 experiments ran.

## Optional vector setup

Use an explicitly selected disposable PostgreSQL instance with pgvector installed. Enable the extension locally, then replay V4 to add the vector column. Install `requirements-assistant.txt` in the ML environment and pre-cache a reviewed Sentence Transformers model. Set `ASSISTANT_EMBEDDING_MODEL` to its trusted local model path and `ASSISTANT_KB_DSN` to the local knowledge database. Run `python -m app.knowledge` from `ml-service/`. Finally set `ASSISTANT_RETRIEVER=pgvector`.

The loader derives dimension from the model output, normalizes embeddings, validates the trusted manifest, and upserts source sections by stable ID. No online model download is attempted automatically. For the small bundled corpus, ranking uses exact cosine distance over matching published sections. The native PostgreSQL used in this run lacks the vector extension. The fixture adapter and isolated vector ingestion/retrieval tests cover metadata, dimension plumbing, repeatable SQL and trusted excerpt selection.
