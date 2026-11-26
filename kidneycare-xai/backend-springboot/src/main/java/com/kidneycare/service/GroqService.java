package com.kidneycare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kidneycare.dto.request.AssistantPageContext;
import com.kidneycare.dto.response.ActivityResponse;
import com.kidneycare.dto.response.ActivitySummaryResponse;
import com.kidneycare.dto.response.AssessmentResponse;
import com.kidneycare.dto.response.AssistantResponse;
import com.kidneycare.dto.response.HealthProfileResponse;
import com.kidneycare.dto.response.LabResultResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;

@Service
@Slf4j
public class GroqService {

    private static final String GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
    private static final Pattern RED_FLAGS = Pattern.compile(
            "(chest (pain|pressure)|chest.{0,35}(tight|heavy|crush)|struggl.{0,30}(breathe|breath)|can.?t breathe|cannot breathe|shortness of breath|difficulty breathing|passed out|unconscious|no urine|cannot pee|severe swelling)",
            Pattern.CASE_INSENSITIVE
    );

    public static final String KIDNEY_COMPANION_SYSTEM_PROMPT = """
You are "Kidney Companion", a calm, supportive, plain-language educational health assistant dedicated to chronic kidney disease (CKD) awareness and lifestyle monitoring.

Key Instructions:
1. Persona & Tone: Calm, empathetic, accessible, and brief (maximum around 120 words).
2. Clinical Boundaries & Scope:
   - Explain kidney health metrics: eGFR (blood filtration rate), creatinine (muscle waste filtered by kidneys), BUN (blood urea nitrogen), ACR (urine albumin-to-creatinine ratio), blood pressure, diet basics, and lifestyle habits.
   - You provide health education only. NEVER diagnose, prescribe medication, suggest dosage changes, or recommend medical interventions.
3. Context Injection & Explainable AI (XAI):
   - You will receive the user's latest recorded clinical records, CKD model assessment (including risk score, eGFR, creatinine, BP, and top TreeSHAP contribution factors), and weekly lifestyle summary as compact JSON.
   - Use these values to explain WHY the model produced its risk assessment in clear, plain words. Explain which factors increased or decreased the risk without using mathematical jargon.
   - Only if the user specifically asks about their lifestyle, daily habits, or weekly journal summary:
     Check the "weekly_lifestyle_summary". If recorded_days is 0 or missing, reply:
     "No journal entries this week. Log one in Daily Tracker."
     Do NOT mention the journal when the user asks about other concepts like eGFR or lab tests.
4. Style Rules:
   - Use concise bullet points for actionable steps or lists.
   - Never use medical jargon without immediately providing a simple 5-word explanation in parentheses.
5. Safety Red Flags:
   - If the user mentions urgent symptoms (chest pain, inability to urinate, severe swelling, or sudden breathlessness), IMMEDIATELY advise them to seek urgent emergency medical care.
   - Politely decline questions outside kidney health, nutrition, and lifestyle.
6. Health Guidance Note:
   - Do NOT include any line starting with "Disclaimer:". Only when providing specific health, clinical, or measurement guidance, conclude with one short educational sentence: "For educational awareness only; consult your doctor for clinical advice."
7. Follow-up Questions:
   - At the very end of your response, on a final line starting with "FOLLOW_UP_QUESTIONS: ", provide 2 to 3 short relevant follow-up questions formatted strictly as a JSON array of strings, for example:
   FOLLOW_UP_QUESTIONS: ["How do I record a daily journal?", "What is a healthy salt limit?"]
""";

    private final String apiKey;
    private final String model;
    private final ObjectMapper json;
    private final PatientContextService patientContext;
    private final ConversationService conversations;
    private final HttpClient httpClient;

    public GroqService(
            @Value("${GROQ_API_KEY:${groq.api.key:}}") String apiKey,
            @Value("${GROQ_MODEL:${groq.model:qwen/qwen3.8-27b}}") String model,
            ObjectMapper json,
            PatientContextService patientContext,
            ConversationService conversations) {
        this.apiKey = (apiKey != null) ? apiKey.strip() : "";
        this.model = (model != null && !model.isBlank()) ? model.strip() : "qwen/qwen3.8-27b";
        this.json = json;
        this.patientContext = patientContext;
        this.conversations = conversations;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isEnabled() {
        return !apiKey.isBlank();
    }

    public AssistantResponse chat(String email, UUID existingConversationId, String question, AssistantPageContext page) {
        if (!isEnabled()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "GROQ_API_KEY is not configured on the server.");
        }

        long owner = conversations.owner(email);
        UUID conversationId = existingConversationId == null ? UUID.randomUUID() : existingConversationId;
        UUID messageId = UUID.randomUUID();
        long started = System.currentTimeMillis();

        // 1. Check for urgent safety red flags
        boolean isUrgent = RED_FLAGS.matcher(question).find();
        String urgency = isUrgent ? "URGENT" : "NONE";

        // 2. Build compact user clinical context JSON
        Map<String, Object> compactContext = buildCompactContext(email);
        String contextJson;
        try {
            contextJson = json.writeValueAsString(compactContext);
        } catch (Exception e) {
            contextJson = "{}";
        }

        // 3. Prepare messages list (System prompt + injected context + last 6 turns history + current message)
        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt with context injection
        String systemContent = KIDNEY_COMPANION_SYSTEM_PROMPT + "\n\nUser Health Records (compact JSON):\n" + contextJson;
        messages.add(Map.of("role", "system", "content", systemContent));

        // Load up to last 3 conversation turns (max 6 messages: user + assistant pairs)
        if (existingConversationId != null) {
            try {
                List<ConversationService.Turn> history = conversations.history(owner, existingConversationId, 3);
                for (ConversationService.Turn turn : history) {
                    if (turn.question() != null && !turn.question().isBlank()) {
                        messages.add(Map.of("role", "user", "content", turn.question()));
                    }
                    if (turn.response() != null && turn.response().answer() != null) {
                        messages.add(Map.of("role", "assistant", "content", turn.response().answer()));
                    }
                }
            } catch (Exception e) {
                log.warn("Could not retrieve conversation history for ID: {}", existingConversationId, e);
            }
        }

        // Add current user question
        messages.add(Map.of("role", "user", "content", question));

        // 4. Construct Groq API request payload
        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("model", model);
        requestPayload.put("messages", messages);
        requestPayload.put("max_tokens", 600);
        requestPayload.put("temperature", 0.4);

        String requestJson;
        try {
            requestJson = json.writeValueAsString(requestPayload);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to serialize Groq request payload.");
        }

        // 5. Execute HTTP call to Groq
        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_ENDPOINT))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(25))
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .build();

        String responseBody = "";
        int statusCode = 500;
        try {
            HttpResponse<String> httpResponse = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
            statusCode = httpResponse.statusCode();
            responseBody = httpResponse.body();
        } catch (Exception e) {
            log.error("Network error communicating with Groq endpoint: {}", e.getMessage(), e);
            throw new ResponseStatusException(HttpStatus.GATEWAY_TIMEOUT, "The request to Groq API timed out. Please try again.");
        }

        // 6. Handle HTTP response status codes with explicit error mapping & server-side logging
        if (statusCode != 200) {
            log.error("Groq API error response [HTTP {}]: {}", statusCode, responseBody);

            String errMsg = "Groq request failed";
            try {
                JsonNode errNode = json.readTree(responseBody);
                if (errNode.has("error") && errNode.get("error").has("message")) {
                    errMsg = errNode.get("error").get("message").asText();
                }
            } catch (Exception ignored) {}

            if (statusCode == 401) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or unauthorized Groq API key (401): " + errMsg);
            } else if (statusCode == 404) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Groq model not found (404): " + model + ". " + errMsg);
            } else if (statusCode == 429) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Groq rate limit exceeded (429): " + errMsg);
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq API error (" + statusCode + "): " + errMsg);
            }
        }

        // 7. Parse reply = choices[0].message.content (with reasoning fallback)
        String reply;
        try {
            JsonNode root = json.readTree(responseBody);
            JsonNode messageNode = root.path("choices").path(0).path("message");
            reply = messageNode.path("content").asText();
            if ((reply == null || reply.isBlank()) && messageNode.hasNonNull("reasoning")) {
                reply = messageNode.path("reasoning").asText();
            }
            if (reply == null || reply.isBlank()) {
                throw new IllegalStateException("Empty reply from Groq choices[0].message");
            }
        } catch (Exception e) {
            log.error("Failed to parse Groq completion response: {}", responseBody, e);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse Groq assistant completion.");
        }

        // Extract FOLLOW_UP_QUESTIONS JSON from reply if present
        List<String> followUpQuestions = new ArrayList<>();
        Pattern followUpPattern = Pattern.compile("(?i)FOLLOW_UP_QUESTIONS:\\s*(\\[.*?\\])", Pattern.DOTALL);
        var matcher = followUpPattern.matcher(reply);
        if (matcher.find()) {
            String jsonArrayStr = matcher.group(1).trim();
            try {
                JsonNode arr = json.readTree(jsonArrayStr);
                if (arr.isArray()) {
                    for (JsonNode item : arr) {
                        String q = item.asText().trim();
                        if (!q.isBlank() && q.length() <= 80) {
                            followUpQuestions.add(q);
                        }
                    }
                }
            } catch (Exception ignored) {}
            // Clean out the marker from the user-facing text
            reply = reply.replace(matcher.group(0), "").trim();
        }

        // Clean any leftover raw Disclaimer line if model emitted one
        reply = reply.replaceAll("(?i)Disclaimer:\\s*", "").trim();

        // Check if question asks to summarize lifestyle/journal and user has no entries
        String lowerQ = question.toLowerCase();
        if ((lowerQ.contains("lifestyle") || lowerQ.contains("journal") || lowerQ.contains("summarize my lifestyle"))
                && Boolean.TRUE.equals(compactContext.get("no_weekly_journal_entries"))) {
            reply = "No journal entries this week. Log one in Daily Tracker.";
            followUpQuestions = List.of("How do I record a daily journal?", "What metrics should I track?");
        }

        // If no follow-up questions were parsed, provide relevant defaults
        if (followUpQuestions.isEmpty()) {
            followUpQuestions = List.of("What is eGFR?", "Why is my risk score high?", "How do I log my journal?");
        }

        long elapsedMs = System.currentTimeMillis() - started;

        // 8. Construct patient record references for UI transparency
        List<Map<String, Object>> recordReferences = new ArrayList<>();
        if (compactContext.containsKey("risk_score")) {
            recordReferences.add(Map.of("kind", "assessment", "path", "/assessment/result/" + compactContext.getOrDefault("assessment_id", "")));
        }
        if (compactContext.containsKey("eGFR") || compactContext.containsKey("serum_creatinine")) {
            recordReferences.add(Map.of("kind", "lab_result", "path", "/lab-history"));
        }
        if (compactContext.containsKey("weekly_lifestyle_summary")) {
            recordReferences.add(Map.of("kind", "daily_activity", "path", "/tracker"));
        }

        AssistantResponse response = new AssistantResponse(
                conversationId,
                messageId,
                "ANSWER",
                "GENERAL_EDUCATION",
                reply,
                "complete",
                List.of(),
                List.of(),
                List.of(),
                recordReferences,
                urgency,
                followUpQuestions,
                model,
                elapsedMs,
                List.of("GROQ_COMPLETION"),
                "M4",
                "groq",
                null
        );

        // 9. Persist conversation turn
        try {
            Map<String, Object> metadata = Map.of(
                    "provider", "groq",
                    "model", model,
                    "urgency", urgency,
                    "latencyMs", elapsedMs
            );
            conversations.save(owner, existingConversationId == null, question, response, metadata);
        } catch (Exception e) {
            log.warn("Failed to persist conversation turn: {}", e.getMessage());
        }

        return response;
    }

    private Map<String, Object> buildCompactContext(String email) {
        Map<String, Object> ctx = new LinkedHashMap<>();

        // Latest assessment & XAI / SHAP features
        try {
            Optional<AssessmentResponse> optAss = patientContext.latestAssessment(email);
            if (optAss.isPresent()) {
                AssessmentResponse ass = optAss.get();
                ctx.put("assessment_id", ass.getId());
                ctx.put("risk_score", ass.getRiskScore());
                ctx.put("prediction", ass.getPrediction());

                List<Map<String, Object>> topShap = new ArrayList<>();
                if (ass.getExplanations() != null) {
                    ass.getExplanations().stream()
                            .filter(e -> e.getShapValue() != null)
                            .sorted((a, b) -> Double.compare(Math.abs(b.getShapValue()), Math.abs(a.getShapValue())))
                            .limit(4)
                            .forEach(e -> {
                                Map<String, Object> factor = new HashMap<>();
                                factor.put("feature", e.getFeature());
                                factor.put("value", e.getValue());
                                factor.put("shap_log_odds", e.getShapValue());
                                topShap.add(factor);
                            });
                }
                ctx.put("top_xai_shap_factors", topShap);
            }
        } catch (Exception e) {
            log.debug("No assessment found for user {}: {}", email, e.getMessage());
        }

        // Latest lab measurements
        try {
            Map<String, LabResultResponse> measurements = patientContext.latestMeasurements(email);
            if (measurements != null) {
                if (measurements.containsKey("egfr")) {
                    ctx.put("eGFR", measurements.get("egfr").value() + " " + measurements.get("egfr").unit());
                }
                if (measurements.containsKey("serum_creatinine")) {
                    ctx.put("serum_creatinine", measurements.get("serum_creatinine").value() + " " + measurements.get("serum_creatinine").unit());
                }
                if (measurements.containsKey("blood_urea")) {
                    ctx.put("BUN", measurements.get("blood_urea").value() + " " + measurements.get("blood_urea").unit());
                }
                if (measurements.containsKey("urine_acr")) {
                    ctx.put("urine_ACR", measurements.get("urine_acr").value() + " " + measurements.get("urine_acr").unit());
                }
            }
        } catch (Exception e) {
            log.debug("No lab measurements for user {}: {}", email, e.getMessage());
        }

        // Daily activity journal & BP
        try {
            Optional<ActivityResponse> journalOpt = patientContext.journalEntry(email, LocalDate.now());
            if (journalOpt.isPresent()) {
                ActivityResponse a = journalOpt.get();
                if (a.getSystolicBp() != null && a.getDiastolicBp() != null) {
                    ctx.put("blood_pressure", a.getSystolicBp() + "/" + a.getDiastolicBp() + " mmHg");
                }
                if (a.getWaterIntakeLiters() != null) {
                    ctx.put("today_journal_water_liters", a.getWaterIntakeLiters());
                }
                if (a.getSleepHours() != null) {
                    ctx.put("today_journal_sleep_hours", a.getSleepHours());
                }
                if (a.getExerciseMinutes() != null) {
                    ctx.put("today_journal_exercise_minutes", a.getExerciseMinutes());
                }
            }
        } catch (Exception e) {
            log.debug("No today journal entry for user {}: {}", email, e.getMessage());
        }

        // Weekly lifestyle summary (hydration, sleep, exercise, BP, recorded days)
        try {
            ActivitySummaryResponse weekly = patientContext.lifestyleSummary(email, "weekly", LocalDate.now());
            if (weekly != null) {
                if (weekly.getRecordedDays() == 0) {
                    ctx.put("no_weekly_journal_entries", true);
                } else {
                    Map<String, Object> wMap = new LinkedHashMap<>();
                    wMap.put("recorded_days", weekly.getRecordedDays());
                    wMap.put("total_days_in_period", weekly.getTotalDaysInPeriod());
                    if (weekly.getHydration() != null && weekly.getHydration().getAverageLiters() != null) {
                        wMap.put("avg_daily_water_liters", weekly.getHydration().getAverageLiters());
                    }
                    if (weekly.getSleep() != null && weekly.getSleep().getAverageHours() != null) {
                        wMap.put("avg_daily_sleep_hours", weekly.getSleep().getAverageHours());
                    }
                    if (weekly.getPhysicalActivity() != null && weekly.getPhysicalActivity().getAverageMinutes() != null) {
                        wMap.put("avg_daily_exercise_minutes", weekly.getPhysicalActivity().getAverageMinutes());
                    }
                    if (weekly.getBloodPressure() != null && weekly.getBloodPressure().getAverageSystolic() != null) {
                        wMap.put("avg_blood_pressure", Math.round(weekly.getBloodPressure().getAverageSystolic()) + "/" + Math.round(weekly.getBloodPressure().getAverageDiastolic()) + " mmHg");
                    }
                    ctx.put("weekly_lifestyle_summary", wMap);
                }
            } else {
                ctx.put("no_weekly_journal_entries", true);
            }
        } catch (Exception e) {
            log.debug("No weekly summary for user {}: {}", email, e.getMessage());
            ctx.put("no_weekly_journal_entries", true);
        }

        // Health profile (Hypertension status, BMI)
        try {
            Optional<HealthProfileResponse> profileOpt = patientContext.healthProfile(email);
            if (profileOpt.isPresent()) {
                HealthProfileResponse p = profileOpt.get();
                if (p.getHypertension() != null) {
                    ctx.put("hypertension_history", p.getHypertension());
                }
                if (p.getBmi() != null) {
                    ctx.put("BMI", p.getBmi());
                }
            }
        } catch (Exception e) {
            log.debug("No health profile for user {}: {}", email, e.getMessage());
        }

        return ctx;
    }
}
