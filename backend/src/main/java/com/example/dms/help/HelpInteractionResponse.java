package com.example.dms.help;

import java.time.Instant;
import java.util.List;

public record HelpInteractionResponse(
    Long id,
    Long actorId,
    String actorUsername,
    String actorFullName,
    List<String> actorRoles,
    String question,
    String answer,
    List<String> steps,
    List<String> relatedModules,
    List<String> guardrails,
    String scopeNotice,
    boolean blocked,
    HelpAnswerSource answerSource,
    HelpGenerationProvider generationProvider,
    Instant createdAt
) {
}
