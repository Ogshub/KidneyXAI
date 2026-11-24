package com.kidneycare.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidneycare.dto.response.AssistantResponse;
import com.kidneycare.exception.ResourceNotFoundException;
import com.kidneycare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ConversationService {
    public record Conversation(UUID id, OffsetDateTime updatedAt) {}
    public record Turn(String question, AssistantResponse response) {}
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;
    private final UserRepository users;

    public long owner(String email) {
        return users.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("Account", "principal", "current")).getId();
    }

    public List<Conversation> list(long user) {
        return jdbc.query("""
            SELECT id, updated_at FROM ai_conversations WHERE user_id=? ORDER BY updated_at DESC LIMIT 50
            """, (row, n) -> new Conversation(row.getObject(1, UUID.class), row.getObject(2, OffsetDateTime.class)), user);
    }

    public List<Turn> history(long user, UUID id, int limit) {
        requireOwned(user, id);
        return jdbc.query("""
            SELECT question, response FROM (
              SELECT m.id, m.question,m.response,m.created_at FROM ai_messages m JOIN ai_conversations c
                ON m.conversation_id=c.id WHERE c.id=? AND c.user_id=?
              ORDER BY m.created_at DESC,m.id DESC LIMIT ?
            ) recent ORDER BY created_at,id
            """, (row, n) -> new Turn(row.getString(1), read(row.getString(2))), id, user, limit);
    }

    @Transactional
    public void delete(long user, UUID id) {
        if (jdbc.update("DELETE FROM ai_conversations WHERE id=? AND user_id=?", id, user) == 0) {
            throw missing(id);
        }
    }

    @Transactional
    public void save(long user, boolean create, String question, AssistantResponse answer, Object modelConfig) {
        UUID id = answer.conversationId();
        UUID message = answer.messageId();
        if (create) {
            jdbc.update("INSERT INTO ai_conversations(id,user_id) VALUES(?,?)", id, user);
        } else if (jdbc.update("UPDATE ai_conversations SET updated_at=now() WHERE id=? AND user_id=?", id, user) == 0) {
            throw missing(id);
        }
        jdbc.update("INSERT INTO ai_messages(id,conversation_id,question,response) VALUES(?,?,?,?::jsonb)",
                message, id, question, write(answer));
        for (var source : answer.evidenceSources()) {
            jdbc.update("INSERT INTO ai_message_sources(message_id,evidence_id,provenance) VALUES(?,?,?::jsonb)",
                    message, source.get("id"), write(source));
        }
        jdbc.update("""
            INSERT INTO ai_audit_logs(message_id,decision,reasons,model_config,latency_ms) VALUES(?,?,?::jsonb,?::jsonb,?)
            """, message, answer.decision(), write(answer.reasonCodes()), write(modelConfig), answer.latencyMs());
    }

    private void requireOwned(long user, UUID id) {
        if (Boolean.FALSE.equals(jdbc.queryForObject("SELECT EXISTS(SELECT 1 FROM ai_conversations WHERE id=? AND user_id=?)",
                Boolean.class, id, user))) {
            throw missing(id);
        }
    }

    private ResourceNotFoundException missing(UUID id) {
        return new ResourceNotFoundException("Conversation", "id", id);
    }

    private String write(Object value) {
        try {
            return json.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not serialize conversation");
        }
    }

    private AssistantResponse read(String value) {
        try {
            return json.readValue(value, AssistantResponse.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read conversation");
        }
    }
}
