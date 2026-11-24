package com.kidneycare.controller;

import com.kidneycare.dto.response.AssistantResponse;
import com.kidneycare.dto.request.AssistantPageContext;
import com.kidneycare.service.AssistantService;
import com.kidneycare.service.ConversationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/assistant")
@RequiredArgsConstructor
public class AssistantController {
    public record ChatRequest(UUID conversationId, @NotBlank @Size(max = 1000) String message,
                              @Valid AssistantPageContext pageContext) {}
    private final AssistantService assistant;
    private final ConversationService conversations;

    @PostMapping("/chat")
    public AssistantResponse chat(Authentication auth, @Valid @RequestBody ChatRequest request) {
        return assistant.chat(auth.getName(), request.conversationId(), request.message().strip(), request.pageContext());
    }

    @GetMapping("/conversations")
    public List<ConversationService.Conversation> list(Authentication auth) {
        return conversations.list(conversations.owner(auth.getName()));
    }

    @GetMapping("/conversations/{id}")
    public List<ConversationService.Turn> history(Authentication auth, @PathVariable UUID id) {
        return conversations.history(conversations.owner(auth.getName()), id, 50);
    }

    @DeleteMapping("/conversations/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(Authentication auth, @PathVariable UUID id) {
        conversations.delete(conversations.owner(auth.getName()), id);
    }
}
