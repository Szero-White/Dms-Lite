package com.example.dms.help;

import java.util.List;

public record HelpAnswerResponse(
    String answer,
    List<String> steps,
    List<String> relatedModules,
    List<String> guardrails,
    String scopeNotice,
    boolean blocked,
    HelpAnswerSource answerSource,
    HelpGenerationProvider generationProvider
) {
    public HelpAnswerResponse withProvenance(
        HelpAnswerSource source,
        HelpGenerationProvider provider
    ) {
        return new HelpAnswerResponse(
            answer,
            steps,
            relatedModules,
            guardrails,
            scopeNotice,
            blocked,
            source,
            provider
        );
    }
}
