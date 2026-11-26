package com.kidneycare.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.kidneycare.dto.request.AssistantPageContext;
import com.kidneycare.dto.response.AssistantResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.HashMap;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AssistantService {
    private record Window(long started, int count) {}
    private final Map<Long, Window> rate = new HashMap<>();
    private final RestClient client;
    private final String secret;
    private final ObjectMapper json;
    private final ConversationService conversations;
    private final AssistantContextTools tools;
    private final GroqService groqService;
    private final Set<String> syntheticAccounts;

    public AssistantService(@Value("${ml.service.url:http://localhost:8000}") String url,
            @Value("${ml.internal.secret:}") String secret, ObjectMapper json,
            ConversationService conversations, AssistantContextTools tools,
            GroqService groqService,
            @Value("${assistant.conversational.research:disabled}") String research,
            @Value("${assistant.synthetic.accounts:}") String accounts) {
        this.secret = secret;
        this.json = json;
        this.conversations = conversations;
        this.tools = tools;
        this.groqService = groqService;
        this.syntheticAccounts = "enabled".equals(research)
                ? Arrays.stream(accounts.split(",")).map(String::strip).filter(account -> !account.isEmpty())
                    .collect(Collectors.toUnmodifiableSet())
                : Set.of();
        var transport = new SimpleClientHttpRequestFactory();
        transport.setConnectTimeout(Duration.ofSeconds(2));
        transport.setReadTimeout(Duration.ofSeconds(18));
        this.client = RestClient.builder().baseUrl(url).requestFactory(transport).build();
    }

    public AssistantResponse chat(String email, UUID existing, String question, AssistantPageContext page) {
        long owner = conversations.owner(email);
        limit(owner);
        tools.validatePage(email, page);

        if (groqService.isEnabled()) {
            return groqService.chat(email, existing, question, page);
        }

        var previous = existing == null ? List.<ConversationService.Turn>of() : conversations.history(owner, existing, 1);
        boolean conversational = syntheticAccounts.contains(email);
        UUID conversation = existing == null ? UUID.randomUUID() : existing;
        UUID message = UUID.randomUUID();
        long started = System.nanoTime();
        var payload = new HashMap<String, Object>();
        payload.put("message", question);
        if (page != null) payload.put("pageContext", page);
        if (!previous.isEmpty() && (!conversational || "conversational_research".equals(previous.get(0).response().providerMode()))) {
            payload.put("previousIntent", previous.get(0).response().intent());
            payload.put("previousMessage", previous.get(0).question());
            String parameter = previous.get(0).response().patientRecordReferences().stream()
                    .map(ref -> ref.get("parameter")).filter(String.class::isInstance).map(String.class::cast)
                    .findFirst().orElse(null);
            if (parameter != null) payload.put("previousParameter", parameter);
            var reportIds = previous.get(0).response().patientRecordReferences().stream()
                    .filter(ref -> "report".equals(ref.get("kind"))).map(ref -> ref.get("id"))
                    .filter(Number.class::isInstance).map(Number.class::cast).map(Number::longValue).distinct().toList();
            if (reportIds.size() == 1) payload.put("previousReportId", reportIds.get(0));
        }

        AssistantResponse response;
        var metadata = new HashMap<String, Object>();
        try {
            AssistantContextTools.Route route;
            if (conversational) {
                var plan = call("/conversational/plan", payload);
                route = plan.hasNonNull("route") ? json.treeToValue(plan.get("route"), AssistantContextTools.Route.class) : null;
                for (String key : List.of("plan", "planError", "planVersion", "planTokens")) {
                    if (plan.hasNonNull(key)) payload.put(key, plan.get(key));
                }
                if (route == null && !plan.hasNonNull("planError")) {
                    throw new IllegalStateException("Invalid assistant plan");
                }
            } else {
                route = json.treeToValue(call("/route", payload), AssistantContextTools.Route.class);
            }
            if (route != null) payload.put("context", tools.read(email, route));
            JsonNode remote = call(conversational ? "/conversational/respond" : "/respond", payload);
            if (!Set.of("ANSWER", "CLARIFY", "ABSTAIN").contains(remote.path("decision").asText())
                    || (route != null && !route.intent().equals(remote.path("intent").asText()))) {
                throw new IllegalStateException("Invalid assistant decision");
            }
            metadata.put("retrieval", remote.path("retriever").asText("local-policy"));
            metadata.put("componentFlags", remote.path("componentFlags"));
            for (String key : List.of("tool", "planModelVersion", "providerTokens", "corpusVersion")) {
                if (remote.hasNonNull(key)) metadata.put(key, remote.get(key));
            }
            var body = (ObjectNode) remote;
            body.put("conversationId", conversation.toString());
            body.remove(List.of("retriever", "componentFlags", "tool", "planModelVersion", "providerTokens"));
            body.put("messageId", message.toString());
            body.put("latencyMs", elapsed(started));
            response = json.treeToValue(body, AssistantResponse.class);
            if (response.answer() == null || response.evidenceSources() == null || response.reasonCodes() == null) {
                throw new IllegalStateException("Incomplete assistant response");
            }
        } catch (Exception e) {
            response = new AssistantResponse(conversation, message, "ABSTAIN", "OUT_OF_SCOPE",
                    "The assistant is temporarily unavailable. If this may be an emergency, contact your local emergency services.",
                    "not_available", List.of(), List.of(), List.of(), List.of(), "NONE", List.of(),
                    "unavailable", elapsed(started), List.of("ASSISTANT_UNAVAILABLE"), "M4",
                    conversational ? "conversational_research" : "unavailable", null);
        }
        metadata.putAll(Map.of("configuration", response.configuration(), "version", response.modelVersion(),
                "promptVersion", conversational ? "conversational-1" : "evidence-selection-1",
                "context", response.contextStatus(), "intent", response.intent()));
        conversations.save(owner, existing == null, question, response, metadata);
        return response;
    }

    private JsonNode call(String path, Object body) throws com.fasterxml.jackson.core.JsonProcessingException {
        if (secret.isBlank()) throw new IllegalStateException("Assistant internal authentication is required");
        return client.post().uri("/internal/assistant" + path).header("X-Internal-Secret", secret)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON).body(json.writeValueAsString(body))
                .retrieve().body(JsonNode.class);
    }

    private synchronized void limit(long owner) {
        long now = System.nanoTime();
        long minute = Duration.ofMinutes(1).toNanos();
        rate.values().removeIf(window -> now - window.started() >= minute);
        var window = rate.getOrDefault(owner, new Window(now, 0));
        if (window.count() >= 10 || (rate.size() >= 10_000 && !rate.containsKey(owner))) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Assistant request limit reached");
        }
        rate.put(owner, new Window(window.started(), window.count() + 1));
    }

    private long elapsed(long start) {
        return Duration.ofNanos(System.nanoTime() - start).toMillis();
    }
}
