package com.kidneycare.dto.response;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AssistantResponse(UUID conversationId, UUID messageId, String decision, String intent, String answer,
        String contextStatus, List<String> missingInformation, List<String> limitations,
        List<Map<String, Object>> evidenceSources, List<Map<String, Object>> patientRecordReferences,
        String urgency, List<String> suggestedActions, String modelVersion, long latencyMs,
        List<String> reasonCodes, String configuration) {
}
