package com.example.dms.help;

import java.util.List;

public record HelpAnswerResponse(
    String answer,
    List<String> steps,
    List<String> relatedModules,
    List<String> guardrails,
    String scopeNotice,
    boolean blocked
) {
}