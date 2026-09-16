package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

class GeminiHelpAssistantClientTest {

    @Test
    void defaultModelUsesCurrentGeminiFlashVersion() {
        assertThat(new GeminiHelpProperties().getModel()).isEqualTo("gemini-3.6-flash");
    }

    @Test
    void generationConfigRequiresAnswerOnlyStructuredJsonResponse() {
        GeminiHelpProperties properties = new GeminiHelpProperties();
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(properties, null, null);

        Map<String, Object> config = client.buildGenerationConfig();

        assertThat(config).containsEntry("responseMimeType", "application/json");
        assertThat(config).doesNotContainKeys("temperature", "topP", "topK");
        assertThat(config.get("responseSchema")).isInstanceOf(Map.class);

        Map<?, ?> schema = (Map<?, ?>) config.get("responseSchema");
        assertThat(schema.get("type")).isEqualTo("OBJECT");
        assertThat(schema.get("required")).isEqualTo(List.of("answer"));

        Map<?, ?> propertiesSchema = (Map<?, ?>) schema.get("properties");
        assertThat(propertiesSchema).hasSize(1);
        assertThat(propertiesSchema.containsKey("answer")).isTrue();
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
    void externalModelMayImproveSummaryButBackendKeepsAuthorizationMetadata() {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(null, null, null);
        HelpAnswerResponse fallback = workflowFallback(
            "Inventory fallback",
            List.of("Review stock"),
            List.of("Inventory", "Products"),
            List.of("Do not expose restricted data")
        );
        GeminiHelpAssistantClient.GeminiAnswerPayload modelAnswer =
            new GeminiHelpAssistantClient.GeminiAnswerPayload(
                "Start by checking the low-stock items assigned to you."
            );

        HelpAnswerResponse sanitized = client.sanitizeAnswer(modelAnswer, fallback);

        assertThat(sanitized.answer()).isEqualTo("Start by checking the low-stock items assigned to you.");
        assertThat(sanitized.steps()).isEqualTo(fallback.steps());
        assertThat(sanitized.relatedModules()).isEqualTo(fallback.relatedModules());
        assertThat(sanitized.guardrails()).isEqualTo(fallback.guardrails());
        assertThat(sanitized.scopeNotice()).isEqualTo(fallback.scopeNotice());
        assertThat(sanitized.blocked()).isEqualTo(fallback.blocked());
        assertThat(sanitized.answerSource()).isEqualTo(HelpAnswerSource.WORKFLOW_KNOWLEDGE);
        assertThat(sanitized.generationProvider()).isEqualTo(HelpGenerationProvider.GEMINI);
    }

    @Test
    void blankExternalAnswerFallsBackSafely() {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(null, null, null);
        HelpAnswerResponse fallback = workflowFallback(
            "Safe inventory guidance",
            List.of("Review Inventory"),
            List.of("Inventory"),
            List.of("Stay inside assigned permissions")
        );

        HelpAnswerResponse sanitized = client.sanitizeAnswer(
            new GeminiHelpAssistantClient.GeminiAnswerPayload("   "),
            fallback
        );

        assertThat(sanitized.answer()).isEqualTo(fallback.answer());
        assertThat(sanitized.answerSource()).isEqualTo(HelpAnswerSource.SYSTEM_FALLBACK);
        assertThat(sanitized.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
    }

    @Test
    void parserAcceptsStructuredJsonAnswer() throws Exception {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(
            null,
            new ObjectMapper(),
            null
        );

        assertThat(client.parseAnswerText("""
            {"answer":"Use the Payments workflow."}
            """))
            .isPresent()
            .get()
            .extracting(GeminiHelpAssistantClient.GeminiAnswerPayload::answer)
            .isEqualTo("Use the Payments workflow.");
    }

    @Test
    void parserAcceptsPlainTextAsDefensiveFallback() throws Exception {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(
            null,
            new ObjectMapper(),
            null
        );

        assertThat(client.parseAnswerText("Use the Payments workflow."))
            .isPresent()
            .get()
            .extracting(GeminiHelpAssistantClient.GeminiAnswerPayload::answer)
            .isEqualTo("Use the Payments workflow.");
    }

    @Test
    void retryPolicyCoversOnlyTransientProviderFailures() {
        GeminiHelpAssistantClient client = new GeminiHelpAssistantClient(null, null, null);

        assertThat(client.isRetryableStatus(HttpStatus.TOO_MANY_REQUESTS)).isTrue();
        assertThat(client.isRetryableStatus(HttpStatus.INTERNAL_SERVER_ERROR)).isTrue();
        assertThat(client.isRetryableStatus(HttpStatus.BAD_GATEWAY)).isTrue();
        assertThat(client.isRetryableStatus(HttpStatus.SERVICE_UNAVAILABLE)).isTrue();
        assertThat(client.isRetryableStatus(HttpStatus.GATEWAY_TIMEOUT)).isTrue();

        assertThat(client.isRetryableStatus(HttpStatus.BAD_REQUEST)).isFalse();
        assertThat(client.isRetryableStatus(HttpStatus.UNAUTHORIZED)).isFalse();
        assertThat(client.isRetryableStatus(HttpStatus.FORBIDDEN)).isFalse();
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
}
