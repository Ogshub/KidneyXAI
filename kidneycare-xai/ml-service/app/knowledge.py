"""Reviewed public knowledge. Patient data never enters this index."""
import hashlib
import json
import os
import re
from functools import lru_cache
from pathlib import Path

MANIFEST = Path(__file__).resolve().parents[1] / "knowledge" / "source_manifest.json"


@lru_cache
def documents():
    entries = json.loads(MANIFEST.read_text(encoding="utf-8"))
    result = {}
    for entry in entries:
        item = {**entry, "text": " ".join(entry["text"].split())}
        digest = hashlib.sha256(item["text"].encode("utf-8")).hexdigest()
        if not item["url"].startswith("https://") or item["id"] in result or item.get("contentHash") != digest:
            raise ValueError("Invalid knowledge manifest")
        result[item["id"]] = {**item, "contentHash": digest}
    return result


@lru_cache
def encoder(name):
    from sentence_transformers import SentenceTransformer
    return SentenceTransformer(name, local_files_only=True, trust_remote_code=False)


def vector_literal(values):
    return "[" + ",".join(str(float(value)) for value in values) + "]"


def ingest():
    import psycopg
    name = os.environ["ASSISTANT_EMBEDDING_MODEL"]
    docs = documents()
    vectors = encoder(name).encode([item["text"] for item in docs.values()], normalize_embeddings=True)
    with psycopg.connect(os.environ["ASSISTANT_KB_DSN"], connect_timeout=3) as db:
        for item, vector in zip(docs.values(), vectors, strict=True):
            db.execute("""INSERT INTO knowledge_documents(id,manifest,content_hash) VALUES(%s,%s::jsonb,%s)
                          ON CONFLICT(id) DO UPDATE SET manifest=excluded.manifest, content_hash=excluded.content_hash,
                          ingested_at=CASE WHEN knowledge_documents.content_hash<>excluded.content_hash
                                           THEN now() ELSE knowledge_documents.ingested_at END""",
                       (item["id"], json.dumps(item), item["contentHash"]))
            db.execute("""INSERT INTO knowledge_chunks(id,document_id,content,embedding_model,embedding_dimension,embedding)
                          VALUES(%s,%s,%s,%s,%s,%s::vector)
                          ON CONFLICT(id) DO UPDATE SET content=excluded.content, embedding_model=excluded.embedding_model,
                          embedding_dimension=excluded.embedding_dimension, embedding=excluded.embedding""",
                       (item["id"], item["id"], item["text"], name, len(vector), vector_literal(vector)))


def retrieve(query, *, research=False):
    vocabulary = set(re.findall(r"[a-z]+", query.lower())) - {"what", "is", "my", "for", "the", "a", "of", "how", "does"}
    docs = {key: item for key, item in documents().items() if research or not item.get("researchOnly")}
    relevant = {key: len(vocabulary.intersection(item["tags"].split())) for key, item in docs.items()}
    if os.getenv("ASSISTANT_RETRIEVER", "fixture") == "fixture":
        return [docs[key] for key in sorted(docs, key=lambda key: (-relevant[key], key)) if relevant[key]][:3]
    if os.getenv("ASSISTANT_RETRIEVER") != "pgvector":
        raise ValueError("Unsupported knowledge retriever")
    import psycopg
    name = os.environ["ASSISTANT_EMBEDDING_MODEL"]
    vector = encoder(name).encode(query, normalize_embeddings=True)
    with psycopg.connect(os.environ["ASSISTANT_KB_DSN"], connect_timeout=3) as db:
        db.execute("SET LOCAL statement_timeout = '3s'")
        rows = db.execute("""SELECT c.id, d.manifest FROM knowledge_chunks c
                             JOIN knowledge_documents d ON d.id=c.document_id
                             WHERE c.embedding_model=%s AND c.embedding_dimension=%s
                               AND c.id=ANY(%s)
                             ORDER BY c.embedding <=> %s::vector LIMIT 3""",
                          (name, len(vector), [key for key in docs if relevant[key]], vector_literal(vector))).fetchall()
    return [docs[key] for key, manifest in rows if manifest.get("contentHash") == docs[key]["contentHash"]]


if __name__ == "__main__":
    ingest()
