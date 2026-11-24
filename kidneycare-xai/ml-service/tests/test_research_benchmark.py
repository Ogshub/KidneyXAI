import asyncio
import importlib.util
import json
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2] / "research"


def load(name):
    spec = importlib.util.spec_from_file_location(name, ROOT / "experiments" / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


benchmark = load("benchmark")
analyze = load("analyze")
CASE = {"id": "test-1", "synthetic": True, "category": "fixture", "question": "Show my current creatinine",
        "context": {"lines": ["Creatinine was 1.25 mg/dL."], "status": "complete", "recordedOn": "2025-10-01"},
        "acceptable_decisions": ["CLARIFY"], "expected_numerical_facts": ["1.25"]}
DRAFT = {"decision": "ANSWER", "answer": "Creatinine was 1.25 mg/dL.", "citations": []}


def test_m1_is_question_only_and_calls_provider():
    payload = benchmark.format_task(CASE, "M1", [{"id": "fake", "text": "fake"}])
    assert payload == {"question": CASE["question"]}

    def respond(request):
        sent = json.loads(json.loads(request.content)["contents"][0]["parts"][0]["text"])
        assert sent == payload
        inner = json.dumps(DRAFT)
        return httpx.Response(200, json={"modelVersion": "fixture-model", "usageMetadata": {"totalTokenCount": 12},
            "candidates": [{"content": {"parts": [{"text": inner}]}}]})

    result = asyncio.run(benchmark.Gemini("fixture-model", "test-only", httpx.MockTransport(respond)).complete(payload))
    assert result["response"] == DRAFT
    assert result["model"] == "fixture-model"


def test_ablation_and_manual_judgments():
    assert benchmark.gate(CASE, "M4", [], DRAFT)[1] == "historical_context"
    assert benchmark.gate(CASE, "M4-no-temporal", [], DRAFT)[0]["decision"] == "ANSWER"
    scores = benchmark.score(CASE, DRAFT, [])
    assert scores["numeric_exact_match"]
    assert not scores["decision_correct"]
    assert scores["factual_correctness"] is None
    assert scores["citation_support"] is None


def test_resume_and_missing_results(tmp_path):
    class Counted:
        calls = 0

        async def complete(self, payload):
            self.calls += 1
            return {"status": "ok", "response": DRAFT}

    provider = Counted()
    run = tmp_path / "run"
    metadata = {"provider": "fixture"}
    asyncio.run(benchmark.execute([CASE], ["M1"], provider, run, metadata))
    asyncio.run(benchmark.execute([CASE], ["M1"], provider, run, metadata))
    assert provider.calls == 1
    output = tmp_path / "out"
    analyze.report(tmp_path / "missing", output)
    assert json.loads((output / "summary.json").read_text())["status"] == "unavailable"
    analyze.report(run, output)
    assert json.loads((output / "summary.json").read_text())["status"] == "fixture"


def test_frozen_development_and_evaluation_schema():
    from collections import Counter
    bench = ROOT / "benchmark"
    cases, sha = benchmark.load_cases(bench / "benchmark_cases.json")
    dev, dev_sha = benchmark.load_cases(bench / "development_cases.json")
    assert sha != dev_sha
    assert not {c["id"] for c in cases} & {c["id"] for c in dev}
    assert Counter(c["category"] for c in cases) == {
        "complete_context": 30, "incomplete_context": 30, "outdated_information": 25,
        "conflicting_information": 25, "safety_out_of_scope": 20, "educational_questions": 20,
    }


def test_other_ablations_change_only_the_named_check():
    for name, case, draft, evidence, expected in [
        ("context", {**CASE, "question": "Show my creatinine history", "context": {}},
         {**DRAFT, "answer": "A recorded result is available."}, [], "context_missing"),
        ("consistency", {**CASE, "question": "Show my creatinine history",
                         "context": {"status": "conflicting", "lines": ["Different measurements"]}},
         {**DRAFT, "answer": "A recorded result is available."}, [], "context_conflict"),
        ("evidence", {**CASE, "question": "What is eGFR?", "context": {}},
         {**DRAFT, "citations": ["invalid"]}, [], "citation_unverified"),
    ]:
        assert benchmark.gate(case, "M4", evidence, draft)[1] == expected
        assert benchmark.gate(case, "M4-no-" + name, evidence, draft)[0]["decision"] == "ANSWER"


def test_authentication_quota_timeout_and_malformed_are_failures():
    for expected, outcome in [
        ("authentication", lambda request: httpx.Response(401)),
        ("quota", lambda request: httpx.Response(429)),
        ("malformed", lambda request: httpx.Response(200, json={})),
    ]:
        provider = benchmark.Gemini("fixture-model", "test-only", httpx.MockTransport(outcome))
        result = asyncio.run(provider.complete({"question": "What is eGFR?"}))
        assert result["status"] == expected
        assert "response" not in result

    def timeout(request):
        raise httpx.ReadTimeout("fixture")

    provider = benchmark.Gemini("fixture-model", "test-only", httpx.MockTransport(timeout))
    assert asyncio.run(provider.complete({"question": "What is eGFR?"}))["status"] == "transport_failure"


def test_hash_mismatch_is_rejected_before_loading(tmp_path):
    import pytest
    path = tmp_path / "cases.json"
    path.write_text(json.dumps([CASE]), encoding="utf-8")
    path.with_suffix(".sha256").write_text(benchmark.digest(path), encoding="ascii")
    assert benchmark.load_cases(path)[0] == [CASE]
    path.write_text("[]", encoding="utf-8")
    with pytest.raises(ValueError, match="hash mismatch"):
        benchmark.load_cases(path)


def test_paired_comparisons_respect_repeated_families():
    rows = []
    for case in ("x", "y"):
        for config, correct in (("M1", False), ("M4", True)):
            rows.append({"case": case, "family": "shared", "config": config, "status": "ok",
                         "scores": {"decision_correct": correct}})
    result = analyze.paired(rows, "M1", "M4")
    assert result["paired_risk_difference"] == 1
    assert result["exact_mcnemar_p"] is None


def test_manual_annotations_have_explicit_denominators(tmp_path):
    path = tmp_path / "ratings.csv"
    path.write_text("masked_id,case_id,fact_accuracy,record_consistency,numeric_accuracy,citation_support,total_claims,unsupported_claims\n"
                    "1,c1,1,,0,1,4,1\n", encoding="utf-8")
    analyze.read_annotations(path, [{"masked_id": 1, "case_id": "c1", "configuration": "M1"}], tmp_path)
    scores = json.loads((tmp_path / "manual_metrics.json").read_text())["M1"]
    assert scores["record_consistency"] == {"n": 0, "value": None}
    assert scores["unsupported_claim_rate"] == {"n": 4, "value": 0.25}
