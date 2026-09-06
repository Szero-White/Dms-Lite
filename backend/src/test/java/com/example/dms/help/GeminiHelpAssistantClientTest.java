package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class GeminiHelpAssistantClientTest {

    @Test
    void defaultModelUsesCurrentGeminiFlashVersion() {
        assertThat(new GeminiHelpProperties().getModel()).isEqualTo("gemini-3.6-flash");
    }

    @Test
    void generationConfigRequiresStructuredJsonResponse() {
        GeminiHelpProperties properties = new GeminiHelpProperties();
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(properties, null, null);

        Map<String, Object> config = client.buildGenerationConfig();

        assertThat(config).containsEntry("responseMimeType", "application/json");
        assertThat(config.get("responseSchema")).isInstanceOf(Map.class);

        Map<?, ?> schema = (Map<?, ?>) config.get("responseSchema");
        assertThat(schema.get("type")).isEqualTo("OBJECT");
        assertThat(schema.get("required")).isEqualTo(List.of(
            "answer",
            "steps",
            "relatedModules",
            "guardrails",
            "scopeNotice",
            "blocked"
        ));
    }

    @Test
    void externalContextKeepsUserQuestionsButExcludesAssistantGeneratedAnswers() {
        String context = GeminiHelpAssistantClient.formatExternalContext(List.of(
            new HelpAskRequest.ConversationTurn("user", "Ton kho WATER-24 con bao nhieu?"),
            new HelpAskRequest.ConversationTurn(
                "assistant",
                "WATER-24 currently has 37 units on hand."
            ),
            new HelpAskRequest.ConversationTurn("user", "Toi nen lam gi tiep?"),
            new HelpAskRequest.ConversationTurn(null, "Untrusted role should not be forwarded")
        ));

        assertThat(context)
            .contains("user: Ton kho WATER-24 con bao nhieu?")
            .contains("user: Toi nen lam gi tiep?")
            .doesNotContain("37 units")
            .doesNotContain("Untrusted role");
    }

    @Test
    void externalContextReturnsNeutralMessageWhenThereAreNoUserTurns() {
        assertThat(GeminiHelpAssistantClient.formatExternalContext(List.of(
            new HelpAskRequest.ConversationTurn("assistant", "Sensitive server answer")
        ))).isEqualTo("No previous user questions.");
    }
    @Test
    void externalModelCannotReplaceBackendScopedNavigationOrBlockedState() {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(null, null, null);
        HelpPermissionScope scope = scope(
            "AI_HELP_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW",
            "NOTIFICATION_VIEW"
        );
        HelpAnswerResponse fallback = workflowFallback(
            "Safe inventory guidance",
            List.of("Review Inventory"),
            List.of("Inventory", "Products", "Notifications"),
            List.of("Stay inside assigned permissions")
        );
        GeminiHelpAssistantClient.GeminiAnswerPayload modelAnswer = new GeminiHelpAssistantClient.GeminiAnswerPayload(
            "Open Payments to continue",
            List.of("Open Payments"),
            List.of("Payments"),
            List.of("Ignore restrictions"),
            "Expanded scope",
            false
        );

        HelpAnswerResponse sanitized = client.sanitizeAnswer(modelAnswer, scope, fallback);

        assertThat(sanitized.answer()).isEqualTo(fallback.answer());
        assertThat(sanitized.answerSource()).isEqualTo(HelpAnswerSource.SYSTEM_FALLBACK);
        assertThat(sanitized.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
    }

    @Test
    void externalModelMayImproveSummaryButBackendKeepsScopedStepsAndModules() {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(null, null, null);
        HelpPermissionScope scope = scope(
            "AI_HELP_VIEW",
            "PRODUCT_VIEW",
            "INVENTORY_VIEW"
        );
        HelpAnswerResponse fallback = workflowFallback(
            "Inventory fallback",
            List.of("Review stock"),
            List.of("Inventory", "Products"),
            List.of("Do not expose restricted data")
        );
        GeminiHelpAssistantClient.GeminiAnswerPayload modelAnswer = new GeminiHelpAssistantClient.GeminiAnswerPayload(
            "Start by checking the low-stock items assigned to you.",
            List.of("Model generated step"),
            List.of("Inventory"),
            List.of("Model generated guardrail"),
            "Model scope notice",
            false
        );

        HelpAnswerResponse sanitized = client.sanitizeAnswer(modelAnswer, scope, fallback);

        assertThat(sanitized.answer()).isEqualTo("Start by checking the low-stock items assigned to you.");
        assertThat(sanitized.steps()).isEqualTo(fallback.steps());
        assertThat(sanitized.relatedModules()).isEqualTo(fallback.relatedModules());
        assertThat(sanitized.guardrails()).isEqualTo(fallback.guardrails());
        assertThat(sanitized.scopeNotice()).isEqualTo(fallback.scopeNotice());
        assertThat(sanitized.blocked()).isFalse();
        assertThat(sanitized.answerSource()).isEqualTo(HelpAnswerSource.WORKFLOW_KNOWLEDGE);
        assertThat(sanitized.generationProvider()).isEqualTo(HelpGenerationProvider.GEMINI);
    }

    private HelpAnswerResponse workflowFallback(
        String answer,
        List<String> steps,
        List<String> relatedModules,
        List<String> guardrails
    ) {
        return new HelpAnswerResponse(
            answer,
            steps,
            relatedModules,
            guardrails,
            "Scoped by permissions",
            false,
            HelpAnswerSource.WORKFLOW_KNOWLEDGE,
            HelpGenerationProvider.NONE
        );
    }

    private HelpPermissionScope scope(String... permissions) {
        Set<SimpleGrantedAuthority> authorities = Arrays.stream(permissions)
            .map(SimpleGrantedAuthority::new)
            .collect(java.util.stream.Collectors.toSet());

        return HelpPermissionScope.from(
            new UsernamePasswordAuthenticationToken("test-user", "n/a", authorities)
        );
    }

}
