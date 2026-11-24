CREATE TABLE IF NOT EXISTS knowledge_documents (
    id TEXT PRIMARY KEY, manifest JSONB NOT NULL, content_hash TEXT NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id TEXT PRIMARY KEY, document_id TEXT NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL, embedding_model TEXT NOT NULL, embedding_dimension INTEGER NOT NULL CHECK (embedding_dimension > 0)
);
-- Optional vector extension is enabled explicitly by the local database owner.
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_extension WHERE extname = 'vector') THEN
        EXECUTE 'ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY, user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_owner ON ai_conversations(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY, conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    question TEXT NOT NULL, response JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON ai_messages(conversation_id, created_at, id);
CREATE TABLE IF NOT EXISTS ai_message_sources (
    message_id UUID NOT NULL REFERENCES ai_messages(id) ON DELETE CASCADE,
    evidence_id TEXT NOT NULL, provenance JSONB NOT NULL, PRIMARY KEY (message_id, evidence_id)
);
CREATE TABLE IF NOT EXISTS ai_audit_logs (
    message_id UUID PRIMARY KEY REFERENCES ai_messages(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('ANSWER','CLARIFY','ABSTAIN')),
    reasons JSONB NOT NULL, model_config JSONB NOT NULL, latency_ms BIGINT NOT NULL
);
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_message_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON knowledge_documents, knowledge_chunks, ai_conversations, ai_messages, ai_message_sources, ai_audit_logs FROM PUBLIC;
