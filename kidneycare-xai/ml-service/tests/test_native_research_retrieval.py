"""Opt-in integration test for a disposable native vector instance."""
import os

import pytest

from app import knowledge


def test_native_ingestion_replay_and_provenance(monkeypatch):
    if os.getenv("ASSISTANT_NATIVE_VECTOR_TEST") != "enabled":
        pytest.skip("No explicitly configured disposable pgvector instance")
    import psycopg
    from psycopg.conninfo import conninfo_to_dict

    dsn = os.environ["ASSISTANT_KB_DSN"]
    target = conninfo_to_dict(dsn)
    assert target.get("host") in {"127.0.0.1", "::1"}
    assert target.get("dbname", "").startswith("kidney_vector_test_")
    monkeypatch.setenv("ASSISTANT_RETRIEVER", "pgvector")
    with psycopg.connect(dsn) as db:
        assert db.execute("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname='vector')").fetchone()[0]
    knowledge.ingest()
    knowledge.ingest()
    with psycopg.connect(dsn) as db:
        rows = db.execute("SELECT id, vector_dims(embedding), embedding_dimension FROM knowledge_chunks").fetchall()
    assert len(rows) == len(knowledge.documents())
    assert all(actual == expected and actual > 0 for _, actual, expected in rows)
    evidence = knowledge.retrieve("What is eGFR?")
    assert evidence and all(doc["contentHash"] == knowledge.documents()[doc["id"]]["contentHash"] for doc in evidence)
    assert not knowledge.retrieve("unrelated extraterrestrial postal rates")
