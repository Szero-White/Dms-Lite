package com.example.dms.help;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

class HelpAssistantServiceProvenanceTest {

    private final HelpIntentDetector intentDetector = mock(HelpIntentDetector.class);
    private final HelpWorkflowKnowledge knowledge = mock(HelpWorkflowKnowledge.class);
    private final HelpDataAnswerService dataAnswerService = mock(HelpDataAnswerService.class);
    private final GeminiHelpAssistantClient geminiClient = mock(GeminiHelpAssistantClient.class);

    private final HelpAssistantService service = new HelpAssistantService(
        intentDetector,
        knowledge,
        dataAnswerService,
        geminiClient
    );

    private final HelpAskRequest request = new HelpAskRequest(
        "How should an accountant record a payment?",
        "en",
        List.of()
    );

    private final Authentication authentication = new UsernamePasswordAuthenticationToken(
        "accountant",
        "n/a",
        List.of(
            new SimpleGrantedAuthority("AI_HELP_VIEW"),
            new SimpleGrantedAuthority("CUSTOMER_VIEW"),
            new SimpleGrantedAuthority("PAYMENT_CREATE")
        )
    );

    private HelpAnswerResponse workflowFallback;

    @BeforeEach
    void setUp() {
        workflowFallback = new HelpAnswerResponse(
            "Use the Payments workflow.",
            List.of("Open Payments"),
            List.of("Payments", "Customers"),
            List.of("Stay inside assigned permissions"),
            "Scoped by permissions",
            false,
            HelpAnswerSource.WORKFLOW_KNOWLEDGE,
            HelpGenerationProvider.NONE
        );

        when(dataAnswerService.answer(eq(request), any(HelpPermissionScope.class), eq(HelpLocale.EN)))
            .thenReturn(Optional.empty());
        when(intentDetector.detect(request)).thenReturn(new HelpIntentMatch(HelpIntent.FINANCE, false));
        when(knowledge.financeAnswer(any(HelpPermissionScope.class), eq(HelpLocale.EN)))
            .thenReturn(workflowFallback);
    }

    @Test
    void disabledExternalProviderKeepsDeterministicWorkflowProvenance() {
        when(geminiClient.isAvailable()).thenReturn(false);

        HelpAnswerResponse answer = service.answer(request, authentication);

        assertThat(answer.answerSource()).isEqualTo(HelpAnswerSource.WORKFLOW_KNOWLEDGE);
        assertThat(answer.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
        verify(geminiClient, never()).answer(any(), any(), any(), any());
    }

    @Test
    void failedExternalProviderMarksSystemFallbackWithoutChangingTheSafeAnswer() {
        when(geminiClient.isAvailable()).thenReturn(true);
        when(geminiClient.answer(
            eq(request),
            any(HelpPermissionScope.class),
            eq(HelpLocale.EN),
            eq(workflowFallback)
        )).thenReturn(Optional.empty());

        HelpAnswerResponse answer = service.answer(request, authentication);

        assertThat(answer.answer()).isEqualTo(workflowFallback.answer());
        assertThat(answer.answerSource()).isEqualTo(HelpAnswerSource.SYSTEM_FALLBACK);
        assertThat(answer.generationProvider()).isEqualTo(HelpGenerationProvider.NONE);
    }
}
